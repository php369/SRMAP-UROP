/**
 * Consistent Error Codes
 * Standardized error codes across the application
 */

export const ErrorCodes = {
  // Authentication Errors (1xxx)
  AUTH_TOKEN_MISSING: { code: 1001, message: 'Authentication token is missing', status: 401 },
  AUTH_TOKEN_INVALID: { code: 1002, message: 'Authentication token is invalid', status: 401 },
  AUTH_TOKEN_EXPIRED: { code: 1003, message: 'Authentication token has expired', status: 401 },
  AUTH_UNAUTHORIZED: { code: 1004, message: 'Unauthorized access', status: 401 },
  AUTH_INVALID_CREDENTIALS: { code: 1005, message: 'Invalid credentials', status: 401 },
  AUTH_DOMAIN_NOT_ALLOWED: { code: 1006, message: 'Email domain not allowed', status: 403 },

  // Authorization Errors (2xxx)
  AUTHZ_INSUFFICIENT_PERMISSIONS: { code: 2001, message: 'Insufficient permissions', status: 403 },
  AUTHZ_FORBIDDEN: { code: 2002, message: 'Access forbidden', status: 403 },
  AUTHZ_NOT_RESOURCE_OWNER: { code: 2003, message: 'Not resource owner', status: 403 },
  AUTHZ_NOT_GROUP_LEADER: { code: 2004, message: 'Only group leader can perform this action', status: 403 },

  // Validation Errors (3xxx)
  VALIDATION_FAILED: { code: 3001, message: 'Validation failed', status: 400 },
  VALIDATION_INVALID_INPUT: { code: 3002, message: 'Invalid input provided', status: 400 },
  VALIDATION_MISSING_FIELD: { code: 3003, message: 'Required field is missing', status: 400 },
  VALIDATION_INVALID_FORMAT: { code: 3004, message: 'Invalid format', status: 400 },
  VALIDATION_OUT_OF_RANGE: { code: 3005, message: 'Value out of range', status: 400 },

  // Resource Errors (4xxx)
  RESOURCE_NOT_FOUND: { code: 4001, message: 'Resource not found', status: 404 },
  RESOURCE_ALREADY_EXISTS: { code: 4002, message: 'Resource already exists', status: 409 },
  RESOURCE_CONFLICT: { code: 4003, message: 'Resource conflict', status: 409 },
  RESOURCE_DELETED: { code: 4004, message: 'Resource has been deleted', status: 410 },

  // Business Logic Errors (5xxx)
  BUSINESS_WINDOW_CLOSED: { code: 5001, message: 'Submission window is closed', status: 400 },
  BUSINESS_ALREADY_SUBMITTED: { code: 5002, message: 'Already submitted', status: 409 },
  BUSINESS_NOT_ELIGIBLE: { code: 5003, message: 'Not eligible for this action', status: 403 },
  BUSINESS_CAPACITY_REACHED: { code: 5004, message: 'Capacity reached', status: 409 },
  BUSINESS_DEADLINE_PASSED: { code: 5005, message: 'Deadline has passed', status: 400 },
  BUSINESS_INVALID_STATE: { code: 5006, message: 'Invalid state for this operation', status: 400 },

  // Rate Limiting (6xxx)
  RATE_LIMIT_EXCEEDED: { code: 6001, message: 'Rate limit exceeded', status: 429 },
  RATE_LIMIT_TOO_MANY_REQUESTS: { code: 6002, message: 'Too many requests', status: 429 },

  // Server Errors (7xxx)
  SERVER_INTERNAL_ERROR: { code: 7001, message: 'Internal server error', status: 500 },
  SERVER_DATABASE_ERROR: { code: 7002, message: 'Database operation failed', status: 500 },
  SERVER_EXTERNAL_SERVICE_ERROR: { code: 7003, message: 'External service error', status: 502 },
  SERVER_SERVICE_UNAVAILABLE: { code: 7004, message: 'Service temporarily unavailable', status: 503 },
  SERVER_TIMEOUT: { code: 7005, message: 'Request timeout', status: 504 },

  // File/Upload Errors (8xxx)
  FILE_TOO_LARGE: { code: 8001, message: 'File size exceeds limit', status: 413 },
  FILE_INVALID_TYPE: { code: 8002, message: 'Invalid file type', status: 400 },
  FILE_UPLOAD_FAILED: { code: 8003, message: 'File upload failed', status: 500 },
  FILE_NOT_FOUND: { code: 8004, message: 'File not found', status: 404 },

  // Network Errors (9xxx)
  NETWORK_CONNECTION_ERROR: { code: 9001, message: 'Network connection error', status: 503 },
  NETWORK_TIMEOUT: { code: 9002, message: 'Network timeout', status: 504 },
} as const;

export type ErrorCodeKey = keyof typeof ErrorCodes;
export type ErrorCodeValue = typeof ErrorCodes[ErrorCodeKey];

/**
 * Application Error Class
 */
export class AppError extends Error {
  public readonly code: number;
  public readonly status: number;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    errorCode: ErrorCodeValue,
    details?: any,
    message?: string
  ) {
    super(message || errorCode.message);
    this.name = 'AppError';
    this.code = errorCode.code;
    this.status = errorCode.status;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Create error from error code
 */
export function createError(
  errorCodeKey: ErrorCodeKey,
  details?: any,
  customMessage?: string
): AppError {
  const errorCode = ErrorCodes[errorCodeKey];
  return new AppError(errorCode, details, customMessage);
}

/**
 * Check if error is AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Get error code from error
 */
export function getErrorCode(error: any): number | null {
  if (isAppError(error)) {
    return error.code;
  }
  return null;
}

/**
 * Format error for response
 */
export function formatErrorResponse(error: any) {
  if (isAppError(error)) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
      },
    };
  }

  // Generic error
  return {
    success: false,
    error: {
      code: 7001, // Internal server error
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Error handler middleware
 */
export function errorCodeMiddleware(err: any, req: any, res: any, next: any) {
  if (isAppError(err)) {
    return res.status(err.status).json(err.toJSON());
  }

  // Handle other errors
  const status = err.status || err.statusCode || 500;
  res.status(status).json(formatErrorResponse(err));
}

/**
 * Usage Examples:
 * 
 * // Example 1: Throw error with code
 * throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, { resourceId: '123' });
 * 
 * // Example 2: Create error
 * const error = createError('VALIDATION_FAILED', {
 *   field: 'email',
 *   reason: 'Invalid format',
 * });
 * throw error;
 * 
 * // Example 3: Custom message
 * throw new AppError(
 *   ErrorCodes.BUSINESS_WINDOW_CLOSED,
 *   { windowType: 'submission', assessmentType: 'CLA-1' },
 *   'Submission window for Assessment CLA-1 is closed'
 * );
 * 
 * // Example 4: In route handler
 * router.get('/projects/:id', async (req, res, next) => {
 *   try {
 *     const project = await Project.findById(req.params.id);
 *     if (!project) {
 *       throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND, {
 *         resource: 'Project',
 *         id: req.params.id,
 *       });
 *     }
 *     res.json({ success: true, data: project });
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 * 
 * // Example 5: Check error type
 * try {
 *   // Some operation
 * } catch (error) {
 *   if (isAppError(error) && error.code === 4001) {
 *     // Handle not found
 *   }
 * }
 */
