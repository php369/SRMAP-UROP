import { supabase, STORAGE_BUCKET, STORAGE_FOLDERS } from '../config/supabase';
import { logger } from '../utils/logger';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

export class StorageService {
  /**
   * Upload file to Supabase Storage
   */
  static async uploadFile(
    buffer: Buffer,
    filename: string,
    folder: 'solo' | 'group',
    contentType: string = 'application/pdf'
  ): Promise<UploadResult> {
    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `${timestamp}_${sanitizedFilename}`;
      
      // Determine folder path
      const folderPath = folder === 'solo' ? STORAGE_FOLDERS.SOLO_SUBMISSIONS : STORAGE_FOLDERS.GROUP_SUBMISSIONS;
      const filePath = `${folderPath}/${uniqueFilename}`;

      logger.info('Uploading file to Supabase Storage:', {
        filename: uniqueFilename,
        folder: folderPath,
        size: buffer.length,
        contentType
      });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, buffer, {
          contentType,
          duplex: 'half'
        });

      if (error) {
        logger.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('Upload failed: No data returned');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      logger.info('File uploaded successfully:', {
        path: data.path,
        publicUrl: urlData.publicUrl
      });

      return {
        url: urlData.publicUrl,
        path: data.path,
        size: buffer.length
      };
    } catch (error: any) {
      logger.error('Storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete file from Supabase Storage
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (error) {
        logger.error('Supabase delete error:', error);
        return false;
      }

      logger.info('File deleted successfully:', { filePath });
      return true;
    } catch (error: any) {
      logger.error('Storage delete error:', error);
      return false;
    }
  }

  /**
   * Get signed URL for private file access (if needed)
   */
  static async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        logger.error('Supabase signed URL error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error: any) {
      logger.error('Storage signed URL error:', error);
      return null;
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(filePath.split('/').slice(0, -1).join('/'));

      if (error) {
        return false;
      }

      const filename = filePath.split('/').pop();
      return data.some(file => file.name === filename);
    } catch (error) {
      return false;
    }
  }
}