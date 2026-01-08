import { apiClient } from '../utils/api';
import { User } from '../types';

export const userService = {
    /**
     * Update the current user's profile
     * @param data Partial user data to update
     * @returns Updated user object
     */
    updateProfile: async (data: Partial<User>) => {
        const response = await apiClient.patch<{ user: User }>('/users/me', data);
        return response.data?.user;
    },
};
