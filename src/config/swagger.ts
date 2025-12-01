import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './environment';
import { swaggerExamples, errorCodes } from './swaggerExamples';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SRM Project Portal API',
      version: '1.0.0',
      description: 'A comprehensive project management portal for SRM University-AP with Google integration, assessment management, and real-time collaboration features.',
      contact: {
        name: 'SRM Project Portal Team',
        email: 'support@srmap.edu.in',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: config.NODE_ENV === 'production' 
          ? 'https://srm-portal-api.onrender.com' 
          : `http://localhost:${config.PORT || 3001}`,
        description: config.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from Google OAuth authentication',
        },
      },
      schemas: {
        // Common response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
          required: ['success', 'data'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  description: 'Human-readable error message',
                  example: 'Invalid request data',
                },
                details: {
                  type: 'object',
                  description: 'Additional error details',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Error timestamp',
                },
              },
              required: ['code', 'message'],
            },
          },
          required: ['success', 'error'],
        },
        
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email (must be @srmap.edu.in)',
              example: 'john.doe@srmap.edu.in',
            },
            role: {
              type: 'string',
              enum: ['student', 'faculty', 'admin'],
              description: 'User role',
              example: 'student',
            },
            avatarUrl: {
              type: 'string',
              format: 'uri',
              description: 'User avatar URL from Google',
              example: 'https://lh3.googleusercontent.com/a/default-user',
            },
            profile: {
              type: 'object',
              properties: {
                department: {
                  type: 'string',
                  example: 'Computer Science',
                },
                year: {
                  type: 'number',
                  example: 3,
                },
                skills: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['JavaScript', 'React', 'Node.js'],
                },
                bio: {
                  type: 'string',
                  example: 'Computer Science student passionate about web development',
                },
              },
            },
            preferences: {
              type: 'object',
              properties: {
                theme: {
                  type: 'string',
                  enum: ['light', 'dark'],
                  example: 'light',
                },
                notifications: {
                  type: 'boolean',
                  example: true,
                },
              },
            },
          },
          required: ['id', 'name', 'email', 'role'],
        },
        
        // Assessment schemas
        Assessment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Assessment ID',
              example: '507f1f77bcf86cd799439011',
            },
            title: {
              type: 'string',
              description: 'Assessment title',
              example: 'Web Development Project',
            },
            description: {
              type: 'string',
              description: 'Assessment description',
              example: 'Create a full-stack web application using React and Node.js',
            },
            courseId: {
              type: 'string',
              description: 'Course ID',
              example: '507f1f77bcf86cd799439012',
            },
            facultyId: {
              type: 'string',
              description: 'Faculty ID who created the assessment',
              example: '507f1f77bcf86cd799439013',
            },
            dueAt: {
              type: 'string',
              format: 'date-time',
              description: 'Assessment due date',
              example: '2024-12-31T23:59:59.000Z',
            },
            meetUrl: {
              type: 'string',
              format: 'uri',
              description: 'Google Meet URL for the assessment',
              example: 'https://meet.google.com/abc-defg-hij',
            },
            calendarEventId: {
              type: 'string',
              description: 'Google Calendar event ID',
              example: 'abc123def456ghi789',
            },
            visibility: {
              type: 'object',
              properties: {
                cohortIds: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: 'Cohort IDs that can see this assessment',
                },
                courseIds: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: 'Course IDs that can see this assessment',
                },
              },
            },
            settings: {
              type: 'object',
              properties: {
                allowLateSubmissions: {
                  type: 'boolean',
                  example: false,
                },
                maxFileSize: {
                  type: 'number',
                  description: 'Maximum file size in bytes',
                  example: 10485760,
                },
                allowedFileTypes: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['pdf', 'docx', 'zip'],
                },
              },
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'closed'],
              description: 'Assessment status',
              example: 'published',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
          },
          required: ['_id', 'title', 'description', 'courseId', 'facultyId', 'dueAt', 'status'],
        },
        
        CreateAssessmentRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'Assessment title',
              example: 'Web Development Project',
            },
            description: {
              type: 'string',
              minLength: 1,
              maxLength: 2000,
              description: 'Assessment description',
              example: 'Create a full-stack web application using React and Node.js',
            },
            courseId: {
              type: 'string',
              description: 'Course ID',
              example: '507f1f77bcf86cd799439012',
            },
            dueAt: {
              type: 'string',
              format: 'date-time',
              description: 'Assessment due date',
              example: '2024-12-31T23:59:59.000Z',
            },
            cohortIds: {
              type: 'array',
              items: {
                type: 'string',
              },
              minItems: 1,
              description: 'Cohort IDs that can see this assessment',
              example: ['507f1f77bcf86cd799439014'],
            },
            settings: {
              type: 'object',
              properties: {
                allowLateSubmissions: {
                  type: 'boolean',
                  example: false,
                },
                maxFileSize: {
                  type: 'number',
                  minimum: 1024,
                  maximum: 104857600,
                  description: 'Maximum file size in bytes (1KB to 100MB)',
                  example: 10485760,
                },
                allowedFileTypes: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['pdf', 'docx', 'zip'],
                },
              },
            },
          },
          required: ['title', 'description', 'courseId', 'dueAt', 'cohortIds'],
        },
        
        // Submission schemas
        Submission: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Submission ID',
              example: '507f1f77bcf86cd799439015',
            },
            assessmentId: {
              type: 'string',
              description: 'Assessment ID',
              example: '507f1f77bcf86cd799439011',
            },
            studentId: {
              type: 'string',
              description: 'Student ID',
              example: '507f1f77bcf86cd799439016',
            },
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: {
                    type: 'string',
                    example: 'project.zip',
                  },
                  url: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://res.cloudinary.com/srm-portal/raw/upload/v1234567890/submissions/project.zip',
                  },
                  size: {
                    type: 'number',
                    example: 1048576,
                  },
                  contentType: {
                    type: 'string',
                    example: 'application/zip',
                  },
                },
              },
            },
            notes: {
              type: 'string',
              description: 'Student notes with the submission',
              example: 'This is my final project submission',
            },
            submittedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T12:00:00.000Z',
            },
            status: {
              type: 'string',
              enum: ['submitted', 'graded', 'returned'],
              example: 'submitted',
            },
          },
          required: ['_id', 'assessmentId', 'studentId', 'files', 'submittedAt', 'status'],
        },
        
        // Grade schemas
        Grade: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Grade ID',
              example: '507f1f77bcf86cd799439017',
            },
            submissionId: {
              type: 'string',
              description: 'Submission ID',
              example: '507f1f77bcf86cd799439015',
            },
            facultyId: {
              type: 'string',
              description: 'Faculty ID who graded',
              example: '507f1f77bcf86cd799439013',
            },
            score: {
              type: 'number',
              description: 'Score given',
              example: 85,
            },
            maxScore: {
              type: 'number',
              description: 'Maximum possible score',
              example: 100,
            },
            rubric: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  criteria: {
                    type: 'string',
                    example: 'Code Quality',
                  },
                  points: {
                    type: 'number',
                    example: 20,
                  },
                  feedback: {
                    type: 'string',
                    example: 'Well-structured and readable code',
                  },
                },
              },
            },
            comments: {
              type: 'string',
              description: 'Overall feedback comments',
              example: 'Great work! The implementation is solid and meets all requirements.',
            },
            gradedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-02T10:00:00.000Z',
            },
          },
          required: ['_id', 'submissionId', 'facultyId', 'score', 'maxScore', 'comments', 'gradedAt'],
        },
        
        // Auth schemas
        GoogleAuthRequest: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Google OAuth authorization code',
              example: '4/0AX4XfWjYZ1234567890abcdef',
            },
            state: {
              type: 'string',
              description: 'Optional state parameter',
              example: 'random-state-string',
            },
          },
          required: ['code'],
        },
        
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'JWT access token',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                expiresIn: {
                  type: 'number',
                  description: 'Token expiration time in seconds',
                  example: 3600,
                },
                user: {
                  $ref: '#/components/schemas/User',
                },
              },
              required: ['token', 'refreshToken', 'expiresIn', 'user'],
            },
          },
          required: ['success', 'data'],
        },
        
        RefreshTokenRequest: {
          type: 'object',
          properties: {
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
          required: ['refreshToken'],
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Google OAuth authentication and JWT token management',
        externalDocs: {
          description: 'Google OAuth 2.0 Documentation',
          url: 'https://developers.google.com/identity/protocols/oauth2',
        },
      },
      {
        name: 'Assessments',
        description: 'Assessment creation, management, and Google Calendar integration',
      },
      {
        name: 'Submissions',
        description: 'File submission and management',
      },
      {
        name: 'Grades',
        description: 'Grading and feedback system',
      },
      {
        name: 'Admin',
        description: 'Administrative functions and user management',
      },
      {
        name: 'System',
        description: 'System health and status endpoints',
      },
    ],
    'x-error-codes': errorCodes,
    'x-examples': swaggerExamples,
  },
  apis: [
    './src/routes/*.ts', // Path to the API routes
    './src/models/*.ts', // Path to the models (for additional schema definitions)
  ],
};

export const swaggerSpec = swaggerJsdoc(options);