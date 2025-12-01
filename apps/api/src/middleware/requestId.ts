import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request type to include id
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Middleware to add unique request ID to each request
 * The ID is added to the request object and response headers
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  const requestId = randomUUID();
  
  // Add to request object
  req.id = requestId;
  
  // Add to response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
}
