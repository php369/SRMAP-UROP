import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

/**
 * Middleware to validate request body against Joi schema
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown properties
      allowUnknown: false // Don't allow unknown properties
    });

    if (error) {
      const validationErrors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Request validation failed:', {
        path: req.path,
        method: req.method,
        errors: validationErrors,
        body: req.body
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
}

/**
 * Middleware to validate request query parameters against Joi schema
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const validationErrors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Query validation failed:', {
        path: req.path,
        method: req.method,
        errors: validationErrors,
        query: req.query
      });

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: validationErrors
      });
    }

    // Replace req.query with validated and sanitized value
    req.query = value;
    next();
  };
}

/**
 * Middleware to validate request parameters against Joi schema
 * @param schema - Joi validation schema
 * @returns Express middleware function
 */
export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const validationErrors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Params validation failed:', {
        path: req.path,
        method: req.method,
        errors: validationErrors,
        params: req.params
      });

      return res.status(400).json({
        success: false,
        message: 'Parameter validation failed',
        errors: validationErrors
      });
    }

    // Replace req.params with validated and sanitized value
    req.params = value;
    next();
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  objectId: Joi.string().custom((value: any, helpers: any) => {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'ObjectId validation'),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),

  projectType: Joi.string().valid('IDP', 'UROP', 'CAPSTONE'),

  email: Joi.string().email().lowercase(),

  srmEmail: Joi.string().email().pattern(/@srmap\.edu\.in$/).message('Email must be from @srmap.edu.in domain')
};