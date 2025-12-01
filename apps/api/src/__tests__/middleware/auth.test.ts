import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, requirePermission, optionalAuth, requireOwnership } from '../../middleware/auth';
import { User } from '../../models/User';
import { verifyAccessToken, extractTokenFromHeader } from '../../services/jwtService';

// Mock dependencies
jest.mock('../../services/jwtService');
jest.mock('../../models/User');

const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;
const mockExtractTokenFromHeader = extractTokenFromHeader as jest.MockedFunction<typeof extractTokenFromHeader>;
const mockUserFindById = User.findById as jest.MockedFunction<typeof User.findById>;

describe('Authentication Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      params: {},
      body: {},
      path: '/test',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    test('should authenticate valid token successfully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };

      mockExtractTokenFromHeader.mockReturnValue('valid-token');
      mockVerifyAccessToken.mockReturnValue({
        userId: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      });
      mockUserFindById.mockResolvedValue(mockUser);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual({
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should reject request without token', async () => {
      mockExtractTokenFromHeader.mockReturnValue(null);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authorization token required',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject invalid token', async () => {
      mockExtractTokenFromHeader.mockReturnValue('invalid-token');
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject expired token', async () => {
      mockExtractTokenFromHeader.mockReturnValue('expired-token');
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject when user not found in database', async () => {
      mockExtractTokenFromHeader.mockReturnValue('valid-token');
      mockVerifyAccessToken.mockReturnValue({
        userId: 'nonexistent',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      });
      mockUserFindById.mockResolvedValue(null);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    test('should allow access for authorized role', () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'faculty',
      };

      const middleware = authorize('faculty', 'admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should deny access for unauthorized role', () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };

      const middleware = authorize('faculty', 'admin');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to access this resource',
          details: {
            requiredRoles: ['faculty', 'admin'],
            userRole: 'student',
          },
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should deny access when user not authenticated', () => {
      const middleware = authorize('faculty');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    test('should allow access for user with required permission', () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'faculty',
      };

      const middleware = requirePermission('assessments:create');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should deny access for user without required permission', () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };

      const middleware = requirePermission('assessments:create');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Permission denied: assessments:create',
          details: {
            requiredPermission: 'assessments:create',
            userPermissions: expect.any(Array),
          },
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    test('should attach user when valid token provided', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };

      mockExtractTokenFromHeader.mockReturnValue('valid-token');
      mockVerifyAccessToken.mockReturnValue({
        userId: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      });
      mockUserFindById.mockResolvedValue(mockUser);

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual({
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should continue without user when no token provided', async () => {
      mockExtractTokenFromHeader.mockReturnValue(null);

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    test('should continue without user when invalid token provided', async () => {
      mockExtractTokenFromHeader.mockReturnValue('invalid-token');
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireOwnership', () => {
    test('should allow admin to access any resource', () => {
      mockReq.user = {
        id: 'admin123',
        email: 'admin@srmap.edu.in',
        name: 'Admin User',
        role: 'admin',
      };
      mockReq.params = { userId: 'other123' };

      const middleware = requireOwnership('userId');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should allow user to access their own resource', () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };
      mockReq.params = { userId: 'user123' };

      const middleware = requireOwnership('userId');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should deny user access to other user resource', () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };
      mockReq.params = { userId: 'other123' };

      const middleware = requireOwnership('userId');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_RESOURCE_OWNER',
          message: 'You can only access your own resources',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle missing resource ID', () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };
      mockReq.params = {};

      const middleware = requireOwnership('userId');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_RESOURCE_ID',
          message: 'Missing userId in request',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});