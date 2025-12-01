import { api } from '../utils/api';
import { GroupSubmission, CreateGroupSubmissionData, SubmissionEligibility } from '../types';

export class SubmissionService {
  /**
   * Create a new group submission
   */
  static async createSubmission(data: CreateGroupSubmissionData): Promise<GroupSubmission> {
    const formData = new FormData();
    
    // Add required fields
    formData.append('groupId', data.groupId);
    formData.append('githubUrl', data.githubUrl);
    
    // Add optional fields
    if (data.presentationUrl) {
      formData.append('presentationUrl', data.presentationUrl);
    }
    if (data.comments) {
      formData.append('comments', data.comments);
    }
    
    // Add files
    if (data.reportFile) {
      formData.append('reportFile', data.reportFile);
    }
    if (data.presentationFile) {
      formData.append('presentationFile', data.presentationFile);
    }

    const response = await api.post('/submissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return (response.data as any)?.submission;
  }

  /**
   * Get submissions for current user's groups
   */
  static async getMySubmissions(): Promise<GroupSubmission[]> {
    const response = await api.get('/submissions/my');
    return (response.data as any)?.submissions || [];
  }

  /**
   * Get submission for a specific group
   */
  static async getGroupSubmission(groupId: string): Promise<GroupSubmission | null> {
    try {
      const response = await api.get(`/submissions/group/${groupId}`);
      return (response.data as any)?.submission || null;
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all submissions for faculty review
   */
  static async getFacultySubmissions(): Promise<GroupSubmission[]> {
    const response = await api.get('/submissions/faculty');
    return (response.data as any)?.submissions || [];
  }

  /**
   * Update submission comments
   */
  static async updateSubmissionComments(
    submissionId: string, 
    comments: string
  ): Promise<GroupSubmission> {
    const response = await api.put(`/submissions/${submissionId}/comments`, {
      comments
    });
    return (response.data as any)?.submission;
  }

  /**
   * Check if user can submit for a group
   */
  static async checkSubmissionEligibility(groupId: string): Promise<SubmissionEligibility> {
    const response = await api.get(`/submissions/${groupId}/eligibility`);
    return (response.data as any) || { canSubmit: false, reason: 'Unknown error' };
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File, type: 'report' | 'presentation'): {
    isValid: boolean;
    error?: string;
  } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be under 50MB'
      };
    }

    if (type === 'report') {
      if (file.type !== 'application/pdf') {
        return {
          isValid: false,
          error: 'Report must be a PDF file'
        };
      }
    } else if (type === 'presentation') {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return {
          isValid: false,
          error: 'Presentation must be PDF, PPT, or PPTX'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate GitHub URL
   */
  static validateGitHubUrl(url: string): {
    isValid: boolean;
    error?: string;
  } {
    const githubUrlPattern = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/;
    
    if (!githubUrlPattern.test(url)) {
      return {
        isValid: false,
        error: 'Must be a valid GitHub repository URL (https://github.com/username/repository)'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate presentation URL
   */
  static validatePresentationUrl(url: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!url) return { isValid: true }; // Optional field
    
    const supportedPlatforms = [
      /^https:\/\/docs\.google\.com/,
      /^https:\/\/www\.canva\.com/,
      /^https:\/\/prezi\.com/,
      /^https:\/\/slides\.com/,
      /^https:\/\/www\.slideshare\.net/
    ];
    
    const isValid = supportedPlatforms.some(pattern => pattern.test(url));
    
    if (!isValid) {
      return {
        isValid: false,
        error: 'Presentation URL must be from supported platforms (Google Slides, Canva, Prezi, etc.)'
      };
    }

    return { isValid: true };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}