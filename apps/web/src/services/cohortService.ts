import { apiClient } from '../utils/api';

export interface Cohort {
    _id: string;
    name: string;
    year: number;
    department: string;
    members: string[];
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

export interface CreateCohortData {
    name: string;
    year: number;
    department: string;
    members?: string[];
}

export interface CohortStats {
    totalMembers: number;
    membersByRole: { [key: string]: number };
    status: string;
}

export const cohortService = {
    /**
     * Get all cohorts with optional filters
     */
    async getCohorts(filters?: {
        year?: number;
        department?: string;
        status?: 'active' | 'inactive';
    }): Promise<Cohort[]> {
        const params = new URLSearchParams();
        if (filters?.year) params.append('year', filters.year.toString());
        if (filters?.department) params.append('department', filters.department);
        if (filters?.status) params.append('status', filters.status);

        const queryString = params.toString();
        const url = `/cohorts${queryString ? `?${queryString}` : ''}`;

        const response = await apiClient.get(url);
        if (response.success) {
            return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch cohorts');
    },

    /**
     * Get cohort by ID
     */
    async getCohortById(cohortId: string): Promise<Cohort> {
        const response = await apiClient.get(`/cohorts/${cohortId}`);
        if (response.success) {
            return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch cohort');
    },

    /**
     * Create a new cohort
     */
    async createCohort(data: CreateCohortData): Promise<Cohort> {
        const response = await apiClient.post('/cohorts', data);
        if (response.success) {
            return response.data;
        }
        throw new Error(response.error?.message || 'Failed to create cohort');
    },

    /**
     * Update cohort
     */
    async updateCohort(
        cohortId: string,
        updates: Partial<CreateCohortData>
    ): Promise<Cohort> {
        const response = await apiClient.put(`/cohorts/${cohortId}`, updates);
        if (response.success) {
            return response.data;
        }
        throw new Error(response.error?.message || 'Failed to update cohort');
    },

    /**
     * Delete cohort
     */
    async deleteCohort(cohortId: string): Promise<void> {
        const response = await apiClient.delete(`/cohorts/${cohortId}`);
        if (!response.success) {
            throw new Error(response.error?.message || 'Failed to delete cohort');
        }
    },

    /**
     * Add members to cohort
     */
    async addMembers(cohortId: string, memberIds: string[]): Promise<Cohort> {
        const response = await apiClient.post(`/cohorts/${cohortId}/members`, {
            memberIds,
        });
        if (response.success) {
            return response.data;
        }
        throw new Error(response.error?.message || 'Failed to add members');
    },

    /**
     * Join a cohort (student adds themselves)
     */
    async joinCohort(cohortId: string): Promise<Cohort> {
        const response = await apiClient.post(`/cohorts/${cohortId}/join`, {});
        if (response.success) {
            return response.data;
        }
        throw new Error(response.error?.message || 'Failed to join cohort');
    },

    /**
     * Remove members from cohort
     */
    async removeMembers(cohortId: string, memberIds: string[]): Promise<Cohort> {
        const response = await apiClient.delete(`/cohorts/${cohortId}/members`, {
            memberIds,
        });
        if (response.success) {
            return response.data;
        }
        throw new Error(response.error?.message || 'Failed to remove members');
    },

    /**
     * Bulk add members by email
     */
    async bulkAddMembersByEmail(
        cohortId: string,
        emails: string[]
    ): Promise<{
        added: number;
        notFound: string[];
        alreadyInCohort: string[];
    }> {
        const response = await apiClient.post(`/cohorts/${cohortId}/members/bulk`, {
            emails,
        });
        if (response.success) {
            return response.data;
        }
        throw new Error(response.error?.message || 'Failed to bulk add members');
    },

    /**
     * Get cohort statistics
     */
    async getCohortStats(cohortId: string): Promise<CohortStats> {
        const response = await apiClient.get(`/cohorts/${cohortId}/stats`);
        if (response.success) {
            return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch cohort stats');
    },

    /**
     * Get cohorts for a specific user
     */
    async getUserCohorts(userId: string): Promise<Cohort[]> {
        const response = await apiClient.get(`/cohorts/user/${userId}`);
        if (response.success) {
            return response.data;
        }
        throw new Error(response.error?.message || 'Failed to fetch user cohorts');
    },
};
