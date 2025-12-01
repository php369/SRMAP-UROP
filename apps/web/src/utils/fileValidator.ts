/**
 * File validation utilities for submissions
 */

export const FILE_SIZE_LIMITS = {
  PDF: 10 * 1024 * 1024, // 10MB
  PPT: 50 * 1024 * 1024, // 50MB
  PPTX: 50 * 1024 * 1024, // 50MB
};

export const ALLOWED_FILE_TYPES = {
  PDF: ['application/pdf'],
  PPT: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
};

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * Validate PDF file
 */
export function validatePDF(file: File): { valid: boolean; error?: string } {
  if (!isValidFileType(file, ALLOWED_FILE_TYPES.PDF)) {
    return { valid: false, error: 'File must be a PDF' };
  }
  
  if (!isValidFileSize(file, FILE_SIZE_LIMITS.PDF)) {
    return { valid: false, error: 'PDF file size must be less than 10MB' };
  }
  
  return { valid: true };
}

/**
 * Validate PPT/PPTX file
 */
export function validatePPT(file: File): { valid: boolean; error?: string } {
  if (!isValidFileType(file, ALLOWED_FILE_TYPES.PPT)) {
    return { valid: false, error: 'File must be a PowerPoint presentation (.ppt or .pptx)' };
  }
  
  if (!isValidFileSize(file, FILE_SIZE_LIMITS.PPT)) {
    return { valid: false, error: 'PPT file size must be less than 50MB' };
  }
  
  return { valid: true };
}

/**
 * Validate GitHub URL
 */
export function validateGitHubURL(url: string): { valid: boolean; error?: string } {
  const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
  
  if (!url) {
    return { valid: false, error: 'GitHub URL is required' };
  }
  
  if (!githubRegex.test(url)) {
    return { valid: false, error: 'Invalid GitHub repository URL' };
  }
  
  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
