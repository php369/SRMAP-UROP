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
          message: 'Access restricted to @srmap.edu.in email addresses only',
          details: {
            email: googleUser.email,
            requiredDomain: 'srmap.edu.in',
          },
        },
      });
    }

    // Find or create user in database
    let user = await User.findOne({ googleId: googleUser.googleId }) as IUser | null;
    
    if (!user) {
      // Create new user
      user = new User({
        googleId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        avatarUrl: googleUser.avatarUrl,
        role: 'student', // Default role, can be changed by admin
        profile: {},
        preferences: {
          theme: 'light',
          notifications: true,
        },
      });

      await user.save();
      logger.info(`New user created: ${user.email}`);
    } else {
      // Update existing user info
      user.name = googleUser.name;
      user.avatarUrl = googleUser.avatarUrl;
      await user.save();
      logger.info(`Existing user updated: ${user.email}`);
    }

    // Generate JWT tokens
    const jwtTokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Log successful authentication
    logger.info(`User authenticated successfully: ${user.email}`);

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
          role: user.role,
          avatarUrl: user.avatarUrl,
          profile: user.profile,
          preferences: user.preferences,
        },
      },
    });

  } catch (error) {
    logger.error('Google authentication failed:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
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
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
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

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          profile: user.profile,
          preferences: user.preferences,
        },
        permissions: getUserPermissions(user.role),
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
    ],
  };

  return permissions[role] || [];
}

export default router;