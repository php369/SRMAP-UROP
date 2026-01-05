import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../../../utils/api';
import { Stats } from '../types';

export const useStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await api.get('/control/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      if (error.message?.includes('Too many requests')) {
        toast.error('Rate limit reached. Please wait a moment before refreshing.');
      }
    } finally {
      setStatsLoading(false);
    }
  }, []);

  return {
    stats,
    statsLoading,
    fetchStats
  };
};