import { Request, Response, NextFunction } from 'express';
import { rbacGuard, studentGuard, facultyGuard, adminGuard } from '../../middleware/rbac';
import { checkUserAuthorization } from '../../services/authService';

// Mock dependencies
jest.mock('../../services/authService');

const mockCheckUserAuthorization = checkUserAuthorization as jest.MockedFunction<typeof checkUserAuthorization>;

describe('RBAC Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: undefined,
      path: '/test',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('rbacGuard', () => {
    test('should allow access for authorized user with correct role', async () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: true,
        role: 'student',
        eligibility: {
          studentEmail: 'test@srmap.edu.in',
          type: 'IDP',
          year: 3,
          semester: 7,
          termKind: 'odd',
          validFrom: new Date(),
          validTo: new Date(),
        },
      });

      const middleware = rbacGuard('student', 'faculty');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user?.role).toBe('student');
      expect((mockReq as any).authContext).toBeDefined();
    });

    test('should deny access for user with revoked authorization', async () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: false,
        error: {
          code: 'NOT_ELIGIBLE',
          message: 'Student not eligible',
          guidance: 'Contact academic office',
        },
      });

      const middleware = rbacGuard('student');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ACCESS_REVOKED',
          message: 'User access has been revoked',
          guidance: 'Contact academic office',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should deny access for user with wrong role', async () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: true,
        role: 'student',
      });

      const middleware = rbacGuard('faculty', 'admin');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

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

    test('should handle authentication service errors', async () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };

      mockCheckUserAuthorization.mockRejectedValue(new Error('Database error'));

      const middleware = rbacGuard('student');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RBAC_ERROR',
          message: 'Failed to verify user permissions',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('studentGuard', () => {
    test('should allow access for eligible student', async () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: true,
        role: 'student',
        eligibility: {
          studentEmail: 'test@srmap.edu.in',
          type: 'IDP',
          year: 3,
          semester: 7,
          termKind: 'odd',
          validFrom: new Date(),
          validTo: new Date(),
        },
      });

      const middleware = studentGuard('IDP');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).authContext.projectType).toBe('IDP');
    });

    test('should deny access for student with wrong project type', async () => {
      mockReq.user = {
        id: 'user123',
        email: 'test@srmap.edu.in',
        name: 'Test User',
        role: 'student',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: true,
        role: 'student',
        eligibility: {
          studentEmail: 'test@srmap.edu.in',
          type: 'IDP',
          year: 3,
          semester: 7,
          termKind: 'odd',
          validFrom: new Date(),
          validTo: new Date(),
        },
      });

      const middleware = studentGuard('UROP');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PROJECT_TYPE_NOT_ELIGIBLE',
          message: 'Student not eligible for UROP projects',
          details: {
            studentType: 'IDP',
            requiredType: 'UROP',
          },
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should deny access for non-student user', async () => {
      mockReq.user = {
        id: 'user123',
        email: 'faculty@srmap.edu.in',
        name: 'Faculty User',
        role: 'faculty',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: true,
        role: 'faculty',
        facultyInfo: {
          email: 'faculty@srmap.edu.in',
          name: 'Faculty User',
          dept: 'CSE',
          isCoordinator: false,
          active: true,
        },
      });

      const middleware = studentGuard();
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'STUDENT_ACCESS_REQUIRED',
          message: 'Student access required',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('facultyGuard', () => {
    test('should allow access for faculty member', async () => {
      mockReq.user = {
        id: 'faculty123',
        email: 'faculty@srmap.edu.in',
        name: 'Faculty User',
        role: 'faculty',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: true,
        role: 'faculty',
        facultyInfo: {
          email: 'faculty@srmap.edu.in',
          name: 'Faculty User',
          dept: 'CSE',
          isCoordinator: false,
          active: true,
        },
      });

      const middleware = facultyGuard();
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).authContext.isCoordinator).toBe(false);
    });

    test('should allow access for coordinator', async () => {
      mockReq.user = {
        id: 'coord123',
        email: 'coordinator@srmap.edu.in',
        name: 'Coordinator User',
        role: 'coordinator',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: true,
        role: 'coordinator',
        facultyInfo: {
          email: 'coordinator@srmap.edu.in',
          name: 'Coordinator User',
          dept: 'CSE',
          isCoordinator: true,
          active: true,
        },
      });

      const middleware = facultyGuard(true);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).authContext.isCoordinator).toBe(true);
    });

    test('should deny access for faculty when coordinator required', async () => {
      mockReq.user = {
        id: 'faculty123',
        email: 'faculty@srmap.edu.in',
        name: 'Faculty User',
        role: 'faculty',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: true,
        role: 'faculty',
        facultyInfo: {
          email: 'faculty@srmap.edu.in',
          name: 'Faculty User',
          dept: 'CSE',
          isCoordinator: false,
          active: true,
        },
      });

      const middleware = facultyGuard(true);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'COORDINATOR_ACCESS_REQUIRED',
          message: 'Coordinator privileges required',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should deny access for non-faculty user', async () => {
      mockReq.user = {
        id: 'student123',
        email: 'student@srmap.edu.in',
        name: 'Student User',
        role: 'student',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: true,
        role: 'student',
      });

      const middleware = facultyGuard();
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FACULTY_ACCESS_REQUIRED',
          message: 'Faculty access required',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('adminGuard', () => {
    test('should allow access for admin user', async () => {
      mockReq.user = {
        id: 'admin123',
        email: 'admin@srmap.edu.in',
        name: 'Admin User',
        role: 'admin',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: true,
        role: 'admin',
      });

      const middleware = adminGuard();
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).authContext.isAdmin).toBe(true);
    });

    test('should deny access for non-admin user', async () => {
      mockReq.user = {
        id: 'faculty123',
        email: 'faculty@srmap.edu.in',
        name: 'Faculty User',
        role: 'faculty',
      };

      mockCheckUserAuthorization.mockResolvedValue({
        isAuthorized: true,
        role: 'faculty',
      });

      const middleware = adminGuard();
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ADMIN_ACCESS_REQUIRED',
          message: 'Administrator access required',
          timestamp: expect.any(String),
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});