import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { validateFile } from '../services/cloudinaryService';
import { logger } from '../utils/logger';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Get allowed file types from request or use defaults
  const allowedTypes = req.body.allowedFileTypes || ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip', 'rar'];
  const maxSize = req.body.maxFileSize || 10 * 1024 * 1024; // 10MB default

  const validation = validateFile(
    {
      mimetype: file.mimetype,
      size: 0, // Size will be checked later
      originalname: file.originalname,
    },
    allowedTypes,
    maxSize
  );

  if (!validation.isValid) {
    logger.warn(`File upload rejected: ${validation.error}`);
    return cb(new Error(validation.error));
  }

  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB absolute maximum
    files: 10, // Maximum 10 files per request
  },
});

/**
 * Middleware for single file upload
 * @param fieldName - Name of the form field
 * @returns Multer middleware
 */
export const uploadSingle = (fieldName: string = 'file') => {
  return upload.single(fieldName);
};

/**
 * Middleware for multiple file upload
 * @param fieldName - Name of the form field
 * @param maxCount - Maximum number of files
 * @returns Multer middleware
 */
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Middleware for mixed file upload (multiple fields)
 * @param fields - Array of field configurations
 * @returns Multer middleware
 */
export const uploadFields = (fields: Array<{ name: string; maxCount?: number }>) => {
  return upload.fields(fields);
};

/**
 * Enhanced file validation middleware
 * Performs additional validation after multer processing
 */
export const validateUploadedFiles = (
  allowedTypes?: string[],
  maxSize?: number,
  maxFiles?: number
) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const file = req.file as Express.Multer.File | undefined;
      
      // Get files array (handle both single and multiple uploads)
      const fileList: Express.Multer.File[] = [];
      if (files && Array.isArray(files)) {
        fileList.push(...files);
      } else if (file) {
        fileList.push(file);
      }

      if (fileList.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILES_UPLOADED',
            message: 'No files were uploaded',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check maximum number of files
      if (maxFiles && fileList.length > maxFiles) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_FILES',
            message: `Maximum ${maxFiles} files allowed, received ${fileList.length}`,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Validate each file
      const validationErrors: string[] = [];
      let totalSize = 0;

      for (const uploadedFile of fileList) {
        totalSize += uploadedFile.size;

        const validation = validateFile(
          {
            mimetype: uploadedFile.mimetype,
            size: uploadedFile.size,
            originalname: uploadedFile.originalname,
          },
          allowedTypes,
          maxSize
        );

        if (!validation.isValid) {
          validationErrors.push(`${uploadedFile.originalname}: ${validation.error}`);
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_VALIDATION_FAILED',
            message: 'One or more files failed validation',
            details: validationErrors,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check total upload size (optional additional limit)
      const maxTotalSize = 50 * 1024 * 1024; // 50MB total
      if (totalSize > maxTotalSize) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOTAL_SIZE_EXCEEDED',
            message: `Total upload size ${Math.round(totalSize / (1024 * 1024))}MB exceeds limit of ${Math.round(maxTotalSize / (1024 * 1024))}MB`,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Add file metadata to request
      req.fileMetadata = {
        count: fileList.length,
        totalSize,
        files: fileList.map(f => ({
          originalName: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
        })),
      };

      logger.info(`File validation passed: ${fileList.length} files, ${Math.round(totalSize / 1024)}KB total`);
      next();

    } catch (error) {
      logger.error('File validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FILE_VALIDATION_ERROR',
          message: 'File validation failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Error handling middleware for multer errors
 */
export const handleUploadErrors = (
  error: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  if (error instanceof multer.MulterError) {
    logger.warn('Multer upload error:', error);

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds the maximum allowed limit',
            timestamp: new Date().toISOString(),
          },
        });

      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_FILES',
            message: 'Too many files uploaded',
            timestamp: new Date().toISOString(),
          },
        });

      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: {
            code: 'UNEXPECTED_FILE_FIELD',
            message: 'Unexpected file field in upload',
            timestamp: new Date().toISOString(),
          },
        });

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: error.message || 'File upload failed',
            timestamp: new Date().toISOString(),
          },
        });
    }
  }

  // Handle custom file validation errors
  if (error.message && typeof error.message === 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_VALIDATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Pass other errors to the next error handler
  next(error);
};

// Extend Express Request interface to include file metadata
declare global {
  namespace Express {
    interface Request {
      fileMetadata?: {
        count: number;
        totalSize: number;
        files: Array<{
          originalName: string;
          mimetype: string;
          size: number;
        }>;
      };
    }
  }
}

export default upload;