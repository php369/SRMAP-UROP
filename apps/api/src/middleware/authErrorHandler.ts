import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom error classes for authentication and authorization
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string = 'AUTHENTICATION_ERROR',
    public statusCode: number = 401,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: string = 'AUTHORIZATION_ERROR',
    public statusCode: number = 403,
    public details?: any,
    public guidance?: string
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class WindowNotActiveError extends Error {
  constructor(
    message: string,
    public windowKind: string,
    public projectType: string,
    public windowDetails?: any
  ) {
    super(message);
    this.name = 'WindowNotActiveError';
  }
}

export class EligibilityError extends Error {
  constructor(
    message: string,
    public code: string = 'ELIGIBILITY_ERROR',
    public statusCode: number = 403,
    public guidance?: string
  ) {
    super(message);
    this.name = 'EligibilityError';
  }
}

/**
 * Enhanced error handler for authentication and authorization errors
 */
export const authErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error('Auth error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.email,
    timestamp: new Date().toISOString(),
  });

  // Handle specific error types
  if (err instanceof AuthenticationError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (err instanceof AuthorizationError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        guidance: err.guidance,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (err instanceof WindowNotActiveError) {
    res.status(403).json({
      success: false,
      error: {
        code: 'WINDOW_NOT_ACTIVE',
        message: err.message,
        details: {
          windowKind: err.windowKind,
          projectType: err.projectType,
          ...err.windowDetails,
        },
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (err instanceof EligibilityError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        guidance: err.guidance,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle JWT-related errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: (err as any).errors,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Pass to next error handler if not handled
  next(err);
};

/**
 * Utility functions for throwing specific errors
 */
export const throwAuthenticationError = (
  message: string,
  code?: string,
  details?: any
): never => {
  throw new AuthenticationError(message, code, 401, details);
};

export const throwAuthorizationError = (
  message: string,
  code?: string,
  details?: any,
  guidance?: string
): never => {
  throw new AuthorizationError(message, code, 403, details, guidance);
};

export const throwWindowNotActiveError = (
  message: string,
  windowKind: string,
  projectType: string,
  windowDetails?: any
): never => {
  throw new WindowNotActiveError(message, windowKind, projectType, windowDetails);
};

export const throwEligibilityError = (
  message: string,
  code?: string,
  guidance?: string
): never => {
  throw new EligibilityError(message, code, 403, guidance);
};