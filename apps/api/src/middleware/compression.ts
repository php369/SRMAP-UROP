/**
 * Response Compression Middleware
 * Compresses HTTP responses to reduce bandwidth usage
 * 
 * ✅ Package installed: compression
 */

import compression from 'compression';
import { Request, Response } from 'express';

export const compressionMiddleware = compression({
  // Filter function to determine if response should be compressed
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use compression filter
    return compression.filter(req, res);
  },

  // Compression level (0-9, where 6 is default)
  // Higher = better compression but slower
  level: 6,

  // Only compress responses larger than this (in bytes)
  threshold: 1024, // 1KB

  // Memory level (1-9, where 8 is default)
  // Higher = more memory but better compression
  memLevel: 8,

  // Window bits (9-15, where 15 is default)
  // Higher = better compression but more memory
  windowBits: 15,

  // Strategy (0-4)
  // 0 = default, 1 = filtered, 2 = huffman only, 3 = RLE, 4 = fixed
  strategy: 0,
});
