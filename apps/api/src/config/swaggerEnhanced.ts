import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './environment';

/**
 * Enhanced Swagger configuration with comprehensive examples
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SRM Project Portal API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for SRM Project Portal with examples and error codes',
      contact: {
        name: 'API Support',
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
          ? 'https://your-api.onrender.com'
          : `http://localhost:${config.PORT}`,
        description: config.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
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
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            projectId: {
              type: 'string',
              example: 'IDP-2025-001',
            },
            title: {
              type: 'string',
              example: 'AI-Powered Chatbot Development',
            },
            brief: {
              type: 'string',
              example: 'Build an intelligent chatbot using NLP and machine learning',
            },
            type: {
              type: 'string',
              enum: ['IDP', 'UROP', 'CAPSTONE'],
              example: 'IDP',
            },
            department: {
              type: 'string',
              example: 'Computer Science',
            },
            prerequisites: {
              type: 'string',
              example: 'Python, Machine Learning basics',
            },
            facultyId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012',
            },
            facultyName: {
              type: 'string',
              example: 'Dr. John Doe',
            },
            facultyIdNumber: {
              type: 'string',
              example: 'FAC001',
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'frozen', 'assigned'],
              example: 'published',
            },
            semester: {
              type: 'string',
              example: 'Fall 2025',
            },
            year: {
              type: 'number',
              example: 2025,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-01T10:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-01T10:00:00.000Z',
            },
          },
        },
        Application: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
            groupId: { type: 'string', example: '507f1f77bcf86cd799439014' },
            studentId: { type: 'string', example: '507f1f77bcf86cd799439015' },
            projectId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            projectPreferences: {
              type: 'array',
              items: { type: 'string' },
              example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
            },
            department: { type: 'string', example: 'Computer Science' },
            specialization: { type: 'string', example: 'Artificial Intelligence' },
            cgpa: { type: 'number', example: 8.5 },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected'],
              example: 'pending',
            },
            applicationType: {
              type: 'string',
              enum: ['solo', 'group'],
              example: 'group',
            },
          },
        },
        Submission: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439016' },
            groupId: { type: 'string', example: '507f1f77bcf86cd799439014' },
            projectId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            assessmentType: {
              type: 'string',
              enum: ['CLA-1', 'CLA-2', 'CLA-3', 'External'],
              example: 'CLA-1',
            },
            githubLink: {
              type: 'string',
              example: 'https://github.com/username/project',
            },
            reportUrl: {
              type: 'string',
              example: 'https://res.cloudinary.com/demo/report.pdf',
            },
            facultyGrade: { type: 'number', example: 85 },
            externalGrade: { type: 'number', example: 90 },
            gradeReleased: { type: 'boolean', example: false },
            submittedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-01T10:00:00.000Z',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authentication required',
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'User does not have permission to access this resource',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: 'Insufficient permissions',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Validation failed',
                  details: [
                    {
                      field: 'title',
                      message: 'Title is required',
                    },
                  ],
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Too many requests. Please try again later.',
                  retryAfter: 900,
                },
              },
            },
          },
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
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Projects',
        description: 'Project management endpoints',
      },
      {
        name: 'Applications',
        description: 'Student application endpoints',
      },
      {
        name: 'Submissions',
        description: 'Assignment submission endpoints',
      },
      {
        name: 'Assessments',
        description: 'Grading and assessment endpoints',
      },
      {
        name: 'Groups',
        description: 'Group management endpoints',
      },
      {
        name: 'Meetings',
        description: 'Meeting scheduling and logs',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints',
      },
      {
        name: 'System',
        description: 'System health and monitoring',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
