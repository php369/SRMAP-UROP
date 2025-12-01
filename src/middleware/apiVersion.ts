/**
 * API Versioning Middleware
 * Supports versioning via URL path and headers
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiVersionConfig {
  defaultVersion: string;
  supportedVersions: string[];
  deprecatedVersions: string[];
}

const config: ApiVersionConfig = {
  defaultVersion: '1',
  supportedVersions: ['1'],
  deprecatedVersions: [],
};

/**
 * Extract API version from request
 */
function extractVersion(req: Request): string {
  // Priority 1: Header
  const headerVersion = req.get('API-Version') || req.get('X-API-Version');
  if (headerVersion) {
    return headerVersion;
  }

  // Priority 2: URL path
  const urlMatch = req.path.match(/\/v(\d+)\//);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Priority 3: Query parameter
  const queryVersion = req.query.version as string;
  if (queryVersion) {
    return queryVersion;
  }

  // Default version
  return config.defaultVersion;
}

/**
 * API versioning middleware
 */
export function apiVersionMiddleware(req: Request, res: Response, next: NextFunction) {
  const version = extractVersion(req);

  // Validate version
  if (!config.supportedVersions.includes(version)) {
    logger.warn('Unsupported API version requested', {
      version,
      path: req.path,
      ip: req.ip,
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'UNSUPPORTED_API_VERSION',
        message: `API version ${version} is not supported`,
        supportedVersions: config.supportedVersions,
      },
    });
  }

  // Check if version is deprecated
  if (config.deprecatedVersions.includes(version)) {
    logger.warn('Deprecated API version used', {
      version,
      path: req.path,
      userId: (req as any).user?.id,
    });

    // Add deprecation warning header
    res.setHeader('X-API-Deprecated', 'true');
    res.setHeader(
      'X-API-Deprecation-Info',
      `API version ${version} is deprecated. Please upgrade to version ${config.defaultVersion}.`
    );
  }

  // Attach version to request
  (req as any).apiVersion = version;

  // Add version to response headers
  res.setHeader('API-Version', version);

  next();
}

/**
 * Version-specific route handler
 */
export function versionedRoute(handlers: Record<string, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = (req as any).apiVersion || config.defaultVersion;
    const handler = handlers[`v${version}`] || handlers.default;

    if (!handler) {
      return res.status(501).json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: `This endpoint is not implemented for API version ${version}`,
        },
      });
    }

    return handler(req, res, next);
  };
}

/**
 * Deprecate version
 */
export function deprecateVersion(version: string, sunsetDate?: Date) {
  if (!config.deprecatedVersions.includes(version)) {
    config.deprecatedVersions.push(version);
    logger.info(`API version ${version} marked as deprecated`, {
      sunsetDate: sunsetDate?.toISOString(),
    });
  }
}

/**
 * Remove version support
 */
export function removeVersionSupport(version: string) {
  const index = config.supportedVersions.indexOf(version);
  if (index > -1) {
    config.supportedVersions.splice(index, 1);
    logger.info(`API version ${version} removed from supported versions`);
  }
}

/**
 * Add version support
 */
export function addVersionSupport(version: string) {
  if (!config.supportedVersions.includes(version)) {
    config.supportedVersions.push(version);
    logger.info(`API version ${version} added to supported versions`);
  }
}

/**
 * Get version info
 */
export function getVersionInfo() {
  return {
    current: config.defaultVersion,
    supported: config.supportedVersions,
    deprecated: config.deprecatedVersions,
  };
}

/**
 * Usage Examples:
 * 
 * // Example 1: Apply to all routes
 * app.use('/api', apiVersionMiddleware);
 * 
 * // Example 2: Version-specific handlers
 * router.get('/projects', versionedRoute({
 *   v1: async (req, res) => {
 *     // V1 implementation
 *     const projects = await Project.find();
 *     res.json({ success: true, data: projects });
 *   },
 *   v2: async (req, res) => {
 *     // V2 implementation with new fields
 *     const projects = await Project.find().populate('faculty');
 *     res.json({ success: true, data: projects });
 *   },
 *   default: async (req, res) => {
 *     // Default to latest version
 *     const projects = await Project.find().populate('faculty');
 *     res.json({ success: true, data: projects });
 *   },
 * }));
 * 
 * // Example 3: Check version in handler
 * router.get('/projects', (req, res) => {
 *   const version = req.apiVersion;
 *   
 *   if (version === '2') {
 *     // V2 logic
 *   } else {
 *     // V1 logic
 *   }
 * });
 * 
 * // Example 4: Deprecate version
 * deprecateVersion('1', new Date('2025-12-31'));
 * 
 * // Example 5: Version info endpoint
 * router.get('/version', (req, res) => {
 *   res.json(getVersionInfo());
 * });
 * 
 * // Example 6: Client usage
 * // Option 1: Header
 * fetch('/api/projects', {
 *   headers: { 'API-Version': '2' }
 * });
 * 
 * // Option 2: URL
 * fetch('/api/v2/projects');
 * 
 * // Option 3: Query parameter
 * fetch('/api/projects?version=2');
 */
