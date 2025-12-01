import { api } from '../utils/api';
import { Group } from '../types';

export class GroupService {
  /**
   * Get current user's groups
   */
  static async getMyGroups(): Promise<Group[]> {
    const response = await api.get('/groups/my');
    return (response.data as any)?.groups || [];
  }

  /**
   * Get group by ID
   */
  static async getGroupById(groupId: string): Promise<Group | null> {
    try {
      const response = await api.get(`/groups/${groupId}`);
      return (response.data as any)?.group || null;
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new group
   */
  static async createGroup(type: 'IDP' | 'UROP' | 'CAPSTONE'): Promise<Group> {
    const response = await api.post('/groups', { type });
    return (response.data as any)?.group;
  }

  /**
   * Join a group by code
   */
  static async joinGroup(code: string): Promise<Group> {
    const response = await api.post('/groups/join', { code });
    return (response.data as any)?.group;
  }

  /**
   * Leave a group
   */
  static async leaveGroup(groupId: string): Promise<void> {
    await api.post(`/groups/${groupId}/leave`);
  }

  /**
   * Reset group code (for group leaders)
   */
  static async resetGroupCode(groupId: string): Promise<{ code: string }> {
    const response = await api.post(`/groups/${groupId}/reset-code`);
    return (response.data as any) || { code: '' };
  }

  /**
   * Delete a group (for group leaders)
   */
  static async deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}`);
  }

  /**
   * Get all groups (for faculty/coordinators)
   */
  static async getAllGroups(filters?: {
    type?: 'IDP' | 'UROP' | 'CAPSTONE';
    status?: string;
  }): Promise<Group[]> {
    const response = await api.get('/groups', filters);
    return (response.data as any)?.groups || [];
  }
}