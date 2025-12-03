import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook to periodically refresh user data to ensure role changes are reflected
 * @param intervalMs - Refresh interval in milliseconds (default: 5 minutes)
 */
export function useUserRefresh(intervalMs: number = 5 * 60 * 1000) {
    const { isAuthenticated, refreshUserData } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        // Refresh immediately on mount
        refreshUserData();

        // Set up periodic refresh
        const interval = setInterval(() => {
            console.log('🔄 Refreshing user data...');
            refreshUserData();
        }, intervalMs);

        return () => clearInterval(interval);
    }, [isAuthenticated, intervalMs, refreshUserData]);
}
