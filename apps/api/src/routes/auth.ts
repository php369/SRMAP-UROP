import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { User, IUser } from '../models/User';
import { authenticate, authorize } from '../middleware/auth';
import { 
  verifyGoogleIdToken, 
  verifyDomainRestriction, 
  generateAuthUrl,
  exchangeCodeForTokens 
} from '../services/googleAuth';
import { 
  generateTokenPair, 
  verifyRefreshToken, 
  extractTokenFromHeader,
  verifyAccessToken 
} from '../services/jwtService';
import { checkUserAuthorization } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const googleAuthSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * @swagger
 * /api/v1/auth/google/url:
 *   get:
 *     summary: Generate Google OAuth authorization URL
 *     description: Creates a Google OAuth 2.0 authorization URL for user authentication
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Optional state parameter for CSRF protection
 *     responses:
 *       200:
 *         description: Authorization URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         authUrl:
 *                           type: string
 *                           format: uri
 *                           example: 'https://accounts.google.com/o/oauth2/v2/auth?...'
 *                         message:
 *                           type: string
 *                           example: 'Use this URL to authenticate with Google'
 *       500:
 *         description: Failed to generate authorization URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/google/url', (req: Request, res: Response) => {
  try {
    const state = req.query.state as string;
    const authUrl = generateAuthUrl(state);

    res.json({
      success: true,
      data: {
        authUrl,
        message: 'Use this URL to authenticate with Google',
      },
    });

  } catch (error) {
    logger.error('Failed to generate auth URL:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_URL_GENERATION_FAILED',
        message: 'Failed to generate authentication URL',
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/auth/google:
 *   post:
 *     summary: Exchange Google authorization code for JWT tokens
 *     description: Authenticates user with Google OAuth and returns JWT tokens. Only @srmap.edu.in email addresses are allowed.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleAuthRequest'
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid request data or email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired Google token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Domain restriction failed - only @srmap.edu.in emails allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/google', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validationResult = googleAuthSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      },
    });
  }

  const { code } = validationResult.data;

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Verify ID token and extract user info
    const googleUser = await verifyGoogleIdToken(tokens.idToken);

    // Verify domain restriction
    if (!verifyDomainRestriction(googleUser.email, googleUser.hostedDomain)) {
      logger.warn(`Domain restriction failed for email: ${googleUser.email}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'DOMAIN_RESTRICTION_FAILED',
          message: 'Only SRM University-AP students and faculty are allowed to access the portal',
          guidance: 'Please use your official @srmap.edu.in email address to sign in',
          details: {
            email: googleUser.email,
            requiredDomain: 'srmap.edu.in',
          },
        },
      });
    }

    // Check user authorization (eligibility/faculty roster/admin)
    const authResult = await checkUserAuthorization(googleUser.email);
    
    if (!authResult.isAuthorized) {
      logger.warn(`Authorization failed for email: ${googleUser.email}`);
      return res.status(403).json({
        success: false,
        error: {
          code: authResult.error?.code || 'AUTHORIZATION_FAILED',
          message: authResult.error?.message || 'User not authorized to access the portal',
          guidance: authResult.error?.guidance,
          details: {
            email: googleUser.email,
          },
        },
      });
    }

    // Find or create user in database
    let user = await User.findOne({ 
      $or: [
        { googleId: googleUser.googleId },
        { email: googleUser.email }
      ]
    }) as IUser | null;
    
    if (!user) {
      // Create new user with determined role
      user = new User({
        googleId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        role: authResult.role === 'coordinator' ? 'faculty' : authResult.role, // Store coordinator as faculty in User model
        isCoordinator: authResult.role === 'coordinator',
        department: authResult.user?.department,
        preferences: {
          theme: 'light',
          notifications: true,
        },
      });

      try {
        await user.save();
        logger.info(`New user created: ${user.email} with role: ${authResult.role}`);
      } catch (error: any) {
        if (error.code === 11000) {
          // Handle duplicate key error - user might have been created by another request
          user = await User.findOne({ email: googleUser.email }) as IUser;
          if (!user) {
            throw error; // Re-throw if we still can't find the user
          }
          logger.info(`User already exists, using existing record: ${user.email}`);
        } else {
          throw error;
        }
      }
    } else {
      // Update existing user info and role
      user.name = googleUser.name;
      user.role = authResult.role === 'coordinator' ? 'faculty' : authResult.role;
      user.googleId = googleUser.googleId; // Update Google ID if it was missing
      user.isCoordinator = authResult.role === 'coordinator';
      
      // Update department if available
      if (authResult.user?.department) {
        user.department = authResult.user.department;
      }
      
      await user.save();
      logger.info(`Existing user updated: ${user.email} with role: ${authResult.role}`);
    }

    // Generate JWT tokens with actual role (including coordinator distinction)
    const jwtTokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: authResult.role as any, // Use the actual role from authorization
    });

    // Log successful authentication
    logger.info(`User authenticated successfully: ${user.email} (${authResult.role})`);

    res.json({
      success: true,
      data: {
        token: jwtTokens.accessToken,
        refreshToken: jwtTokens.refreshToken,
        expiresIn: jwtTokens.expiresIn,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: authResult.role, // Return the actual role including coordinator
          department: user.department,
          isCoordinator: user.isCoordinator,
          isExternalEvaluator: user.isExternalEvaluator,
          preferences: user.preferences,
        },
      },
    });

  } catch (error) {
    logger.error('Google authentication failed:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('OAuth configuration mismatch')) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'OAUTH_CONFIG_MISMATCH',
            message: 'OAuth configuration error',
            details: error.message,
            guidance: 'Please contact the administrator to fix the OAuth configuration.',
          },
        });
      }
      
      if (error.message.includes('Authorization code is malformed') || error.message.includes('Authorization code is invalid')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_AUTH_CODE',
            message: 'Invalid authorization code',
            details: error.message,
            guidance: 'Please try logging in again with a fresh authorization.',
          },
        });
      }
      
      if (error.message.includes('Token verification failed')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired Google token',
          },
        });
      }
      
      if (error.message.includes('Email not verified')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Google account email must be verified',
          },
        });
      }
      
      if (error.message.includes('OAuth client configuration error')) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'OAUTH_CLIENT_ERROR',
            message: 'OAuth client configuration error',
            details: error.message,
            guidance: 'Please contact the administrator to fix the OAuth client settings.',
          },
        });
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}));

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current authenticated user information
 *     description: Returns the current user's profile and permissions based on JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ['assessments:read', 'submissions:create', 'submissions:read:own']
 *       401:
 *         description: No token provided or token expired/invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const token = extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Authorization token required',
      },
    });
  }

  try {
    // Verify access token
    const payload = verifyAccessToken(token);
    
    // Find user in database
    const user = await User.findById(payload.userId) as IUser | null;
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Re-check authorization to get current role and eligibility info
    const authResult = await checkUserAuthorization(user.email);
    
    if (!authResult.isAuthorized) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_REVOKED',
          message: 'User access has been revoked',
          guidance: authResult.error?.guidance,
        },
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: authResult.role, // Use current role from authorization check
          department: user.department,
          isCoordinator: user.isCoordinator,
          isExternalEvaluator: user.isExternalEvaluator,
          preferences: user.preferences,
        },
        permissions: getUserPermissions(authResult.role),
      },
    });

  } catch (error) {
    logger.error('Token verification failed:', error);
    
    if (error instanceof Error && error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        },
      });
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token',
      },
    });
  }
}));

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     description: Generates a new access token pair using a valid refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           description: New JWT access token
 *                         refreshToken:
 *                           type: string
 *                           description: New JWT refresh token
 *                         expiresIn:
 *                           type: number
 *                           description: Token expiration time in seconds
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validationResult = refreshTokenSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      },
    });
  }

  const { refreshToken } = validationResult.data;

  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    
    // Find user in database
    const user = await User.findById(payload.userId) as IUser | null;
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Generate new token pair
    const newTokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    logger.info(`Tokens refreshed for user: ${user.email}`);

    res.json({
      success: true,
      data: {
        token: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
      },
    });

  } catch (error) {
    logger.error('Token refresh failed:', error);
    
    if (error instanceof Error && error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token has expired',
        },
      });
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token',
      },
    });
  }
}));

/**
 * POST /auth/google/calendar
 * Exchange Google authorization code for calendar tokens (faculty only)
 */
router.post('/google/calendar', authenticate, authorize('faculty'), asyncHandler(async (req: Request, res: Response) => {
  const { code, assessmentId } = req.body;
  const facultyId = req.user!.id;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Authorization code is required',
      },
    });
  }

  try {
    const { exchangeCodeForCalendarTokens } = await import('../services/googleAuth');
    
    // Exchange code for calendar tokens and store them
    await exchangeCodeForCalendarTokens(code, facultyId);

    logger.info(`Calendar tokens stored for faculty: ${facultyId}`);

    // If assessmentId is provided, try to complete the assessment setup
    if (assessmentId) {
      try {
        const { completeCalendarAuth } = await import('../services/assessmentService');
        const assessment = await completeCalendarAuth(facultyId, assessmentId, code);
        
        return res.json({
          success: true,
          data: {
            message: 'Calendar authentication completed and assessment updated',
            assessment,
          },
        });
      } catch (assessmentError) {
        logger.error(`Failed to complete assessment setup after calendar auth:`, assessmentError);
        // Continue with success response even if assessment update fails
      }
    }

    res.json({
      success: true,
      data: {
        message: 'Calendar authentication completed successfully',
      },
    });

  } catch (error) {
    logger.error(`Calendar authentication failed for faculty ${facultyId}:`, error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'CALENDAR_AUTH_FAILED',
        message: 'Failed to authenticate with Google Calendar',
      },
    });
  }
}));

/**
 * POST /auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', (_req: Request, res: Response) => {
  // In a stateless JWT system, logout is handled client-side
  // The client should remove the tokens from storage
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
});

/**
 * Get user permissions based on role
 * @param role - User role
 * @returns Array of permissions
 */
function getUserPermissions(role: string): string[] {
  const permissions: { [key: string]: string[] } = {
    student: [
      'assessments:read',
      'submissions:create',
      'submissions:read:own',
      'grades:read:own',
    ],
    faculty: [
      'assessments:create',
      'assessments:read',
      'assessments:update:own',
      'assessments:delete:own',
      'submissions:read',
      'grades:create',
      'grades:update',
      'grades:read',
    ],
    coordinator: [
      'assessments:create',
      'assessments:read',
      'assessments:update',
      'assessments:delete',
      'submissions:read',
      'grades:create',
      'grades:update',
      'grades:read',
      'grades:publish',
      'projects:approve',
      'projects:reject',
      'windows:manage',
      'evaluations:publish',
    ],
    admin: [
      'users:read',
      'users:update',
      'users:delete',
      'assessments:read',
      'assessments:delete',
      'submissions:read',
      'grades:read',
      'reports:read',
      'system:manage',
      'eligibility:import',
      'faculty:manage',
    ],
  };

  return permissions[role] || [];
}

/**
 * @swagger
 * /api/v1/auth/callback:
 *   post:
 *     summary: Handle Google OAuth callback (alias for /google)
 *     description: Processes Google OAuth authorization code and returns JWT tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code from Google OAuth
 *               state:
 *                 type: string
 *                 description: Optional state parameter
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Domain restriction or authorization failed
 */

router.post('/callback', asyncHandler(async (req: Request, res: Response) => {
  // This is an alias for the /google endpoint to maintain compatibility
  // with frontend expectations. Reuse the same validation and logic.
  
  // Validate request body
  const validationResult = googleAuthSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validationResult.error.errors,
      },
    });
  }

  const { code } = validationResult.data;

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Verify ID token and extract user info
    const googleUser = await verifyGoogleIdToken(tokens.idToken);

    // Verify domain restriction
    if (!verifyDomainRestriction(googleUser.email, googleUser.hostedDomain)) {
      logger.warn(`Domain restriction failed for email: ${googleUser.email}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'DOMAIN_RESTRICTION_FAILED',
          message: 'Only SRM University-AP students and faculty are allowed to access the portal',
          guidance: 'Please use your official @srmap.edu.in email address to sign in',
          details: {
            email: googleUser.email,
            requiredDomain: 'srmap.edu.in',
          },
        },
      });
    }

    // Check user authorization (eligibility/faculty roster/admin)
    const authResult = await checkUserAuthorization(googleUser.email);
    
    if (!authResult.isAuthorized) {
      logger.warn(`Authorization failed for email: ${googleUser.email}`);
      return res.status(403).json({
        success: false,
        error: {
          code: authResult.error?.code || 'AUTHORIZATION_FAILED',
          message: authResult.error?.message || 'User not authorized to access the portal',
          guidance: authResult.error?.guidance,
          details: {
            email: googleUser.email,
          },
        },
      });
    }

    // Find or create user
    let user = await User.findOne({ googleId: googleUser.googleId });

    if (!user) {
      // Create new user
      user = new User({
        googleId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        role: authResult.role === 'coordinator' ? 'faculty' : authResult.role, // Store coordinator as faculty in User model
        isCoordinator: authResult.role === 'coordinator',
        department: authResult.user?.department,
        preferences: {
          theme: 'light',
          notifications: true,
        },
        lastSeen: new Date(),
      });

      await user.save();
      logger.info(`New user created: ${user.email} (${authResult.role})`);
    } else {
      // Update existing user info and role
      user.name = googleUser.name;
      user.role = authResult.role === 'coordinator' ? 'faculty' : authResult.role;
      user.googleId = googleUser.googleId; // Update Google ID if it was missing
      user.isCoordinator = authResult.role === 'coordinator';
      
      // Update department if available
      if (authResult.user?.department) {
        user.department = authResult.user.department;
      }
      
      user.lastSeen = new Date();
      await user.save();
      logger.info(`User updated: ${user.email} (${authResult.role})`);
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: authResult.role, // Use the actual role including coordinator
    });

    // Log successful authentication
    logger.info(`User authenticated successfully: ${user.email} (${authResult.role})`);

    // Return user data and tokens
    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: authResult.role, // Return the actual role including coordinator
          department: user.department,
          isCoordinator: user.isCoordinator,
          isExternalEvaluator: user.isExternalEvaluator,
          preferences: user.preferences,
          permissions: getUserPermissions(authResult.role),
        },
        tokens: {
          accessToken,
          refreshToken,
        },
        message: 'Authentication successful',
      },
    });

  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    
    if (error instanceof Error) {
      // Handle specific OAuth errors
      if (error.message.includes('invalid_grant')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_AUTHORIZATION_CODE',
            message: 'The authorization code is invalid or has expired',
            guidance: 'Please try signing in again',
          },
        });
      }
      
      if (error.message.includes('Token verification failed')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOKEN_VERIFICATION_FAILED',
            message: 'Failed to verify Google ID token',
            guidance: 'Please try signing in again',
          },
        });
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'An error occurred during authentication',
        guidance: 'Please try again later or contact support if the problem persists',
      },
    });
  }
}));

export default router;