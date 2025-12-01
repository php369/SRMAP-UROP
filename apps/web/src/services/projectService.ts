import { apiClient } from '../utils/api';
import { ApiResponse, Project } from '../types';

export interface ProjectFilters {
  department?: string;
  type?: 'IDP' | 'UROP' | 'CAPSTONE';
  search?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface CreateProjectData {
  title: string;
  brief: string;
  description?: string;
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  department: string;
  prerequisites?: string;
  capacity?: number;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {}

export class ProjectService {
  /**
   * Get published projects for public viewing
   */
  static async getPublishedProjects(filters?: ProjectFilters): Promise<ApiResponse<Project[]>> {
    const params: Record<string, any> = {
      status: 'published',
      ...filters
    };

    return apiClient.get<Project[]>('/projects/public', params);
  }

  /**
   * Get unique departments from published projects
   */
  static async getDepartments(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/projects/departments');
  }

  /**
   * Get project types
   */
  static getProjectTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'IDP', label: 'IDP' },
      { value: 'UROP', label: 'UROP' },
      { value: 'CAPSTONE', label: 'CAPSTONE' }
    ];
  }

  // Faculty CRUD Operations

  /**
   * Create a new project (Faculty only)
   */
  static async createProject(data: CreateProjectData): Promise<ApiResponse<Project>> {
    return apiClient.post<Project>('/projects', data);
  }

  /**
   * Get faculty's own projects
   */
  static async getFacultyProjects(filters?: { status?: string }): Promise<ApiResponse<Project[]>> {
    return apiClient.get<Project[]>('/projects/faculty', filters);
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string): Promise<ApiResponse<Project>> {
    return apiClient.get<Project>(`/projects/${id}`);
  }

  /**
   * Update project
   */
  static async updateProject(id: string, data: UpdateProjectData): Promise<ApiResponse<Project>> {
    return apiClient.put<Project>(`/projects/${id}`, data);
  }

  /**
   * Delete project
   */
  static async deleteProject(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/projects/${id}`);
  }

  /**
   * Submit project for approval
   */
  static async submitProject(id: string): Promise<ApiResponse<Project>> {
    return apiClient.post<Project>(`/projects/${id}/submit`);
  }

  // Coordinator Operations

  /**
   * Get pending projects for coordinator approval
   */
  static async getPendingProjects(filters?: { type?: string; department?: string }): Promise<ApiResponse<Project[]>> {
    return apiClient.get<Project[]>('/projects/pending', filters);
  }

  /**
   * Approve project (Coordinator only)
   */
  static async approveProject(id: string): Promise<ApiResponse<Project>> {
    return apiClient.post<Project>(`/projects/${id}/approve`);
  }

  /**
   * Reject project (Coordinator only)
   */
  static async rejectProject(id: string, reason?: string): Promise<ApiResponse<Project>> {
    return apiClient.post<Project>(`/projects/${id}/reject`, { reason });
  }

  /**
   * Bulk approve projects (Coordinator only)
   */
  static async bulkApproveProjects(projectIds: string[]): Promise<ApiResponse<{
    approvedCount: number;
    requestedCount: number;
    skippedCount: number;
  }>> {
    return apiClient.post(`/projects/bulk-approve`, { projectIds });
  }
}