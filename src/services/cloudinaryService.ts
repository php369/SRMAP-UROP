import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

export interface FileUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resourceType: string;
  createdAt: string;
}

export interface SignedUploadParams {
  publicId: string;
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder?: string;
  resourceType?: string;
  allowedFormats?: string[];
  maxBytes?: number;
}

/**
 * Generate signed upload parameters for client-side upload
 * @param options - Upload configuration options
 * @returns Signed upload parameters
 */
export function generateSignedUploadParams(options: {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  allowedFormats?: string[];
  maxBytes?: number;
  publicId?: string;
}): SignedUploadParams {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = options.publicId || `submission_${timestamp}_${Math.random().toString(36).substring(2, 15)}`;
    
    const uploadParams: any = {
      timestamp,
      public_id: publicId,
    };

    // Add optional parameters
    if (options.folder) {
      uploadParams.folder = options.folder;
    }
    
    if (options.resourceType) {
      uploadParams.resource_type = options.resourceType;
    }
    
    if (options.allowedFormats && options.allowedFormats.length > 0) {
      uploadParams.allowed_formats = options.allowedFormats.join(',');
    }
    
    if (options.maxBytes) {
      uploadParams.bytes_step = options.maxBytes;
    }

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(uploadParams, config.CLOUDINARY_API_SECRET);

    logger.debug(`Generated signed upload params for: ${publicId}`);

    return {
      publicId,
      timestamp,
      signature,
      apiKey: config.CLOUDINARY_API_KEY,
      cloudName: config.CLOUDINARY_CLOUD_NAME,
      folder: options.folder,
      resourceType: options.resourceType,
      allowedFormats: options.allowedFormats,
      maxBytes: options.maxBytes,
    };

  } catch (error) {
    logger.error('Failed to generate signed upload params:', error);
    throw new Error('Failed to generate upload parameters');
  }
}

/**
 * Upload file buffer to Cloudinary
 * @param fileBuffer - File buffer to upload
 * @param options - Upload options
 * @returns Upload result
 */
export async function uploadFileBuffer(
  fileBuffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    allowedFormats?: string[];
    maxBytes?: number;
  }
): Promise<FileUploadResult> {
  try {
    const uploadOptions: any = {
      resource_type: options.resourceType || 'auto',
      folder: options.folder || 'submissions',
      public_id: options.publicId,
      use_filename: true,
      unique_filename: true,
    };

    if (options.allowedFormats && options.allowedFormats.length > 0) {
      uploadOptions.allowed_formats = options.allowedFormats;
    }

    if (options.maxBytes) {
      uploadOptions.bytes_step = options.maxBytes;
    }

    // Convert buffer to base64 data URI
    const base64Data = `data:application/octet-stream;base64,${fileBuffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64Data, uploadOptions);

    logger.info(`File uploaded to Cloudinary: ${result.public_id}`);

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      createdAt: result.created_at,
    };

  } catch (error) {
    logger.error('Failed to upload file to Cloudinary:', error);
    throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete file from Cloudinary
 * @param publicId - Public ID of the file to delete
 * @param resourceType - Type of resource to delete
 * @returns Deletion result
 */
export async function deleteFile(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    logger.info(`File deleted from Cloudinary: ${publicId}`);
    return result;

  } catch (error) {
    logger.error(`Failed to delete file from Cloudinary: ${publicId}`, error);
    throw new Error(`File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate secure download URL with expiration
 * @param publicId - Public ID of the file
 * @param options - URL generation options
 * @returns Secure URL
 */
export function generateSecureUrl(
  publicId: string,
  options?: {
    resourceType?: 'image' | 'video' | 'raw';
    expiresAt?: number; // Unix timestamp
    transformation?: any;
  }
): string {
  try {
    const urlOptions: any = {
      resource_type: options?.resourceType || 'raw',
      secure: true,
      sign_url: true,
    };

    if (options?.expiresAt) {
      urlOptions.expires_at = options.expiresAt;
    }

    if (options?.transformation) {
      urlOptions.transformation = options.transformation;
    }

    const url = cloudinary.url(publicId, urlOptions);
    
    logger.debug(`Generated secure URL for: ${publicId}`);
    return url;

  } catch (error) {
    logger.error(`Failed to generate secure URL for: ${publicId}`, error);
    throw new Error('Failed to generate secure URL');
  }
}

/**
 * Get file information from Cloudinary
 * @param publicId - Public ID of the file
 * @param resourceType - Type of resource
 * @returns File information
 */
export async function getFileInfo(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<any> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });

    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      createdAt: result.created_at,
      folder: result.folder,
    };

  } catch (error) {
    logger.error(`Failed to get file info for: ${publicId}`, error);
    throw new Error(`Failed to retrieve file information: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate file type and size
 * @param file - File information
 * @param allowedTypes - Allowed file types
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export function validateFile(
  file: {
    mimetype: string;
    size: number;
    originalname: string;
  },
  allowedTypes: string[] = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip', 'rar'],
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): { isValid: boolean; error?: string } {
  try {
    // Extract file extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (!fileExtension) {
      return { isValid: false, error: 'File must have an extension' };
    }

    // Check file type
    if (!allowedTypes.includes(fileExtension)) {
      return { 
        isValid: false, 
        error: `File type '${fileExtension}' not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      };
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024) * 100) / 100;
      return { 
        isValid: false, 
        error: `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB` 
      };
    }

    // Additional MIME type validation
    const mimeTypeMap: { [key: string]: string[] } = {
      'pdf': ['application/pdf'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'txt': ['text/plain'],
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'zip': ['application/zip', 'application/x-zip-compressed'],
      'rar': ['application/x-rar-compressed', 'application/vnd.rar'],
    };

    const expectedMimeTypes = mimeTypeMap[fileExtension];
    if (expectedMimeTypes && !expectedMimeTypes.includes(file.mimetype)) {
      return { 
        isValid: false, 
        error: `File MIME type '${file.mimetype}' does not match extension '${fileExtension}'` 
      };
    }

    return { isValid: true };

  } catch (error) {
    logger.error('File validation error:', error);
    return { isValid: false, error: 'File validation failed' };
  }
}

/**
 * Generate folder path for organized file storage
 * @param type - Type of upload (submission, profile, etc.)
 * @param userId - User ID
 * @param additionalPath - Additional path segments
 * @returns Folder path
 */
export function generateFolderPath(
  type: 'submissions' | 'profiles' | 'assessments' | 'temp',
  userId?: string,
  additionalPath?: string
): string {
  const basePath = `srm-portal/${type}`;
  
  if (userId) {
    const userPath = `${basePath}/${userId}`;
    return additionalPath ? `${userPath}/${additionalPath}` : userPath;
  }
  
  return additionalPath ? `${basePath}/${additionalPath}` : basePath;
}

/**
 * Clean up temporary files older than specified time
 * @param olderThanHours - Delete files older than this many hours
 * @returns Cleanup result
 */
export async function cleanupTempFiles(olderThanHours: number = 24): Promise<{ deleted: number }> {
  try {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    // List files in temp folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'srm-portal/temp/',
      max_results: 500,
    });

    let deletedCount = 0;
    
    for (const resource of result.resources) {
      const createdAt = new Date(resource.created_at);
      if (createdAt < cutoffTime) {
        try {
          await deleteFile(resource.public_id, resource.resource_type);
          deletedCount++;
        } catch (deleteError) {
          logger.warn(`Failed to delete temp file: ${resource.public_id}`, deleteError);
        }
      }
    }

    logger.info(`Cleaned up ${deletedCount} temporary files`);
    return { deleted: deletedCount };

  } catch (error) {
    logger.error('Failed to cleanup temp files:', error);
    throw new Error('Temp file cleanup failed');
  }
}

export { cloudinary };