/**
 * Comprehensive Swagger Examples for API Documentation
 * Provides detailed request/response examples for all endpoints
 */

export const swaggerExamples = {
  // Authentication Examples
  auth: {
    googleAuthRequest: {
      summary: 'Google OAuth authentication',
      value: {
        code: '4/0AX4XfWjYZ1234567890abcdef',
        state: 'random-state-string',
      },
    },
    authResponse: {
      summary: 'Successful authentication',
      value: {
        success: true,
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc4OWFiY2RlZjEyMzQ1Njc4OTBhYmMiLCJlbWFpbCI6ImpvaG4uZG9lQHNybWFwLmVkdS5pbiIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzAxMTIzNDU2LCJleHAiOjE3MDExMjcwNTZ9.abc123def456',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc4OWFiY2RlZjEyMzQ1Njc4OTBhYmMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwMTEyMzQ1NiwiZXhwIjoxNzAzNzE1NDU2fQ.xyz789uvw012',
          expiresIn: 3600,
          user: {
            id: '65789abcdef1234567890abc',
            name: 'John Doe',
            email: 'john.doe@srmap.edu.in',
            role: 'student',
            avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
            profile: {
              department: 'Computer Science',
              year: 3,
              skills: ['JavaScript', 'React', 'Node.js'],
              bio: 'Computer Science student passionate about web development',
            },
            preferences: {
              theme: 'light',
              notifications: true,
            },
          },
        },
      },
    },
    refreshTokenRequest: {
      summary: 'Refresh access token',
      value: {
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc4OWFiY2RlZjEyMzQ1Njc4OTBhYmMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTcwMTEyMzQ1NiwiZXhwIjoxNzAzNzE1NDU2fQ.xyz789uvw012',
      },
    },
  },

  // Assessment Examples
  assessments: {
    createRequest: {
      summary: 'Create a new assessment',
      value: {
        title: 'Web Development Final Project',
        description: 'Create a full-stack web application using React, Node.js, and MongoDB. The application should include user authentication, CRUD operations, and real-time features.',
        courseId: '65789abcdef1234567890def',
        dueAt: '2024-12-31T23:59:59.000Z',
        cohortIds: ['65789abcdef1234567890ghi'],
        settings: {
          allowLateSubmissions: false,
          maxFileSize: 10485760,
          allowedFileTypes: ['pdf', 'docx', 'zip'],
        },
      },
    },
    createResponse: {
      summary: 'Assessment created successfully',
      value: {
        success: true,
        data: {
          _id: '65789abcdef1234567890jkl',
          title: 'Web Development Final Project',
          description: 'Create a full-stack web application using React, Node.js, and MongoDB. The application should include user authentication, CRUD operations, and real-time features.',
          courseId: '65789abcdef1234567890def',
          facultyId: '65789abcdef1234567890mno',
          dueAt: '2024-12-31T23:59:59.000Z',
          meetUrl: 'https://meet.google.com/abc-defg-hij',
          calendarEventId: 'abc123def456ghi789',
          visibility: {
            cohortIds: ['65789abcdef1234567890ghi'],
            courseIds: ['65789abcdef1234567890def'],
          },
          settings: {
            allowLateSubmissions: false,
            maxFileSize: 10485760,
            allowedFileTypes: ['pdf', 'docx', 'zip'],
          },
          status: 'published',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      },
    },
    listResponse: {
      summary: 'List of assessments',
      value: {
        success: true,
        data: {
          assessments: [
            {
              _id: '65789abcdef1234567890jkl',
              title: 'Web Development Final Project',
              description: 'Create a full-stack web application...',
              courseId: '65789abcdef1234567890def',
              facultyId: '65789abcdef1234567890mno',
              dueAt: '2024-12-31T23:59:59.000Z',
              status: 'published',
              createdAt: '2024-01-01T00:00:00.000Z',
            },
            {
              _id: '65789abcdef1234567890pqr',
              title: 'Database Design Assignment',
              description: 'Design and implement a normalized database schema...',
              courseId: '65789abcdef1234567890def',
              facultyId: '65789abcdef1234567890mno',
              dueAt: '2024-11-30T23:59:59.000Z',
              status: 'published',
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          ],
          count: 2,
          page: 1,
          totalPages: 1,
        },
      },
    },
  },

  // Submission Examples
  submissions: {
    createRequest: {
      summary: 'Submit an assessment',
      value: {
        assessmentId: '65789abcdef1234567890jkl',
        notes: 'This is my final project submission. I have implemented all required features including user authentication, CRUD operations, and real-time chat using Socket.io.',
      },
    },
    createResponse: {
      summary: 'Submission created successfully',
      value: {
        success: true,
        data: {
          _id: '65789abcdef1234567890stu',
          assessmentId: '65789abcdef1234567890jkl',
          studentId: '65789abcdef1234567890abc',
          files: [
            {
              filename: 'project.zip',
              url: 'https://res.cloudinary.com/srm-portal/raw/upload/v1234567890/submissions/project.zip',
              size: 1048576,
              contentType: 'application/zip',
            },
            {
              filename: 'documentation.pdf',
              url: 'https://res.cloudinary.com/srm-portal/raw/upload/v1234567890/submissions/documentation.pdf',
              size: 524288,
              contentType: 'application/pdf',
            },
          ],
          notes: 'This is my final project submission. I have implemented all required features including user authentication, CRUD operations, and real-time chat using Socket.io.',
          submittedAt: '2024-12-30T15:30:00.000Z',
          status: 'submitted',
        },
      },
    },
  },

  // Grade Examples
  grades: {
    createRequest: {
      summary: 'Grade a submission',
      value: {
        submissionId: '65789abcdef1234567890stu',
        score: 85,
        maxScore: 100,
        rubric: [
          {
            criteria: 'Code Quality',
            points: 20,
            maxPoints: 25,
            feedback: 'Well-structured and readable code. Good use of design patterns.',
          },
          {
            criteria: 'Functionality',
            points: 25,
            maxPoints: 25,
            feedback: 'All required features implemented correctly.',
          },
          {
            criteria: 'Documentation',
            points: 15,
            maxPoints: 20,
            feedback: 'Good documentation, but could include more API examples.',
          },
          {
            criteria: 'Testing',
            points: 15,
            maxPoints: 20,
            feedback: 'Basic tests included, but coverage could be improved.',
          },
          {
            criteria: 'UI/UX',
            points: 10,
            maxPoints: 10,
            feedback: 'Excellent user interface and user experience.',
          },
        ],
        comments: 'Great work! The implementation is solid and meets all requirements. The code is well-structured and the UI is polished. To improve further, consider adding more comprehensive tests and detailed API documentation.',
      },
    },
    createResponse: {
      summary: 'Grade created successfully',
      value: {
        success: true,
        data: {
          _id: '65789abcdef1234567890vwx',
          submissionId: '65789abcdef1234567890stu',
          facultyId: '65789abcdef1234567890mno',
          score: 85,
          maxScore: 100,
          rubric: [
            {
              criteria: 'Code Quality',
              points: 20,
              maxPoints: 25,
              feedback: 'Well-structured and readable code. Good use of design patterns.',
            },
            {
              criteria: 'Functionality',
              points: 25,
              maxPoints: 25,
              feedback: 'All required features implemented correctly.',
            },
            {
              criteria: 'Documentation',
              points: 15,
              maxPoints: 20,
              feedback: 'Good documentation, but could include more API examples.',
            },
            {
              criteria: 'Testing',
              points: 15,
              maxPoints: 20,
              feedback: 'Basic tests included, but coverage could be improved.',
            },
            {
              criteria: 'UI/UX',
              points: 10,
              maxPoints: 10,
              feedback: 'Excellent user interface and user experience.',
            },
          ],
          comments: 'Great work! The implementation is solid and meets all requirements. The code is well-structured and the UI is polished. To improve further, consider adding more comprehensive tests and detailed API documentation.',
          gradedAt: '2024-12-31T10:00:00.000Z',
        },
      },
    },
  },

  // Error Examples
  errors: {
    validationError: {
      summary: 'Validation error',
      value: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: {
            title: 'Title is required',
            dueAt: 'Due date must be in the future',
          },
          timestamp: '2024-01-01T12:00:00.000Z',
        },
      },
    },
    authenticationError: {
      summary: 'Authentication error',
      value: {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid or expired token',
          timestamp: '2024-01-01T12:00:00.000Z',
        },
      },
    },
    authorizationError: {
      summary: 'Authorization error',
      value: {
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'You do not have permission to perform this action',
          details: {
            required: 'faculty',
            current: 'student',
          },
          timestamp: '2024-01-01T12:00:00.000Z',
        },
      },
    },
    notFoundError: {
      summary: 'Resource not found',
      value: {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Assessment not found',
          details: {
            resource: 'Assessment',
            id: '65789abcdef1234567890xyz',
          },
          timestamp: '2024-01-01T12:00:00.000Z',
        },
      },
    },
    rateLimitError: {
      summary: 'Rate limit exceeded',
      value: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            limit: 100,
            window: '15 minutes',
            retryAfter: 300,
          },
          timestamp: '2024-01-01T12:00:00.000Z',
        },
      },
    },
  },
};

/**
 * Error code documentation
 */
export const errorCodes = {
  // Authentication & Authorization (4xx)
  AUTHENTICATION_ERROR: {
    status: 401,
    description: 'Invalid or expired authentication token',
    resolution: 'Obtain a new token by logging in again',
  },
  AUTHORIZATION_ERROR: {
    status: 403,
    description: 'User does not have permission to perform this action',
    resolution: 'Contact an administrator if you believe you should have access',
  },
  INVALID_CREDENTIALS: {
    status: 401,
    description: 'Invalid email or password',
    resolution: 'Check your credentials and try again',
  },
  INVALID_DOMAIN: {
    status: 403,
    description: 'Email domain not allowed (must be @srmap.edu.in)',
    resolution: 'Use your SRM University email address',
  },

  // Validation (400)
  VALIDATION_ERROR: {
    status: 400,
    description: 'Request data failed validation',
    resolution: 'Check the details field for specific validation errors',
  },
  INVALID_ID: {
    status: 400,
    description: 'Invalid MongoDB ObjectId format',
    resolution: 'Ensure the ID is a valid 24-character hex string',
  },

  // Resource Errors (404, 409)
  NOT_FOUND: {
    status: 404,
    description: 'Requested resource not found',
    resolution: 'Verify the resource ID and try again',
  },
  ALREADY_EXISTS: {
    status: 409,
    description: 'Resource already exists',
    resolution: 'Use a different identifier or update the existing resource',
  },

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: {
    status: 429,
    description: 'Too many requests in a given time window',
    resolution: 'Wait for the specified retry-after period before making more requests',
  },

  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR: {
    status: 500,
    description: 'An unexpected error occurred on the server',
    resolution: 'Try again later or contact support if the issue persists',
  },
  DATABASE_ERROR: {
    status: 500,
    description: 'Database operation failed',
    resolution: 'Try again later or contact support',
  },
  EXTERNAL_SERVICE_ERROR: {
    status: 502,
    description: 'External service (Google, Cloudinary) is unavailable',
    resolution: 'Try again later when the service is available',
  },
};
