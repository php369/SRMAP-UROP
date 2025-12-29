import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Middleware to validate request body against Zod schema
 * @param schema - Zod validation schema
 * @returns Express middleware function
 */
export function validateRequestZod<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const validationErrors = result.error.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code,
      }));

      logger.warn('Request validation failed:', {
        path: req.path,
        method: req.method,
        errors: validationErrors,
        requestId: req.id,
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationErrors,
        },
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = result.data;
    next();
  };
}

/**
 * Middleware to validate request query parameters against Zod schema
 * @param schema - Zod validation schema
 * @returns Express middleware function
 */
export function validateQueryZod<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const validationErrors = result.error.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code,
      }));

      logger.warn('Query validation failed:', {
        path: req.path,
        method: req.method,
        errors: validationErrors,
        requestId: req.id,
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query validation failed',
          details: validationErrors,
        },
      });
    }

    // Replace req.query with validated and sanitized value
    req.query = result.data as any;
    next();
  };
}

/**
 * Middleware to validate request parameters against Zod schema
 * @param schema - Zod validation schema
 * @returns Express middleware function
 */
export function validateParamsZod<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const validationErrors = result.error.errors.map((error) => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code,
      }));

      logger.warn('Params validation failed:', {
        path: req.path,
        method: req.method,
        errors: validationErrors,
        requestId: req.id,
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parameter validation failed',
          details: validationErrors,
        },
      });
    }

    // Replace req.params with validated and sanitized value
    req.params = result.data as any;
    next();
  };
}

/**
 * Common Zod validation schemas
 */
export const zodSchemas = {
  // MongoDB ObjectId validation
  objectId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  }),

  // Pagination schema
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Project type
  projectType: z.enum(['IDP', 'UROP', 'CAPSTONE']),

  // Email validation
  email: z.string().email().toLowerCase(),

  // SRM email validation
  srmEmail: z
    .string()
    .email()
    .refine((email) => email.endsWith('@srmap.edu.in'), {
      message: 'Email must be from @srmap.edu.in domain',
    }),

  // Assessment type
  assessmentType: z.enum(['CLA-1', 'CLA-2', 'CLA-3', 'External']),

  // User role
  userRole: z.enum(['student', 'faculty', 'coordinator', 'admin']),

  // Status enums
  applicationStatus: z.enum(['pending', 'accepted', 'rejected']),
  projectStatus: z.enum(['draft', 'published', 'frozen', 'assigned']),
  submissionStatus: z.enum(['draft', 'submitted', 'graded']),

  // Date validation
  dateString: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),

  // URL validation
  url: z.string().url(),

  // GitHub URL validation
  githubUrl: z
    .string()
    .url()
    .refine((url) => url.includes('github.com'), {
      message: 'Must be a valid GitHub URL',
    }),
};

/**
 * Helper to create a schema with common fields
 */
export const createSchema = {
  withPagination: <T extends z.ZodRawShape>(schema: T) => {
    return z.object({
      ...schema,
      ...zodSchemas.pagination.shape,
    });
  },

  withObjectId: (fieldName: string = 'id') => {
    return z.object({
      [fieldName]: zodSchemas.objectId,
    });
  },
};
