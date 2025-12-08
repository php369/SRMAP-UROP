import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Window, isWindowActive } from '../utils/windowChecker';

interface WindowStatus {
  windows: Window[];
  loading: boolean;
  error: string | null;
  isProposalOpen: (projectType: string) => boolean;
  isApplicationOpen: (projectType: string) => boolean;
  isSubmissionOpen: (projectType: string, assessmentType?: string) => boolean;
  isAssessmentOpen: (projectType: string, assessmentType?: string) => boolean;
  isGradeReleaseOpen: (projectType: string, assessmentType?: string) => boolean;
  refresh: () => Promise<void>;
}

export function useWindowStatus(): WindowStatus {
  const [windows, setWindows] = useState<Window[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWindows = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/windows');
      
      console.log('Windows fetched:', response);
      
      if (response.success && response.data) {
        setWindows(Array.isArray(response.data) ? response.data : []);
      } else {
        setWindows([]);
      }
    } catch (err: any) {
      console.error('Error fetching windows:', err);
      setError(err.response?.data?.error?.message || 'Failed to fetch windows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWindows();
    
    // Refresh windows every 30 seconds to keep status up to date
    const interval = setInterval(() => {
      fetchWindows();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const isProposalOpen = (projectType: string): boolean => {
    const window = windows.find(
      w => w.windowType === 'proposal' && w.projectType === projectType
    );
    
    if (!window) {
      console.log(`No proposal window found for ${projectType}`);
      return false;
    }
    
    const now = new Date();
    const start = new Date(window.startDate);
    const end = new Date(window.endDate);
    const isActive = now >= start && now <= end;
    
    console.log(`Proposal window check for ${projectType}:`, {
      window,
      isActive,
      now: now.toISOString(),
      start: start.toISOString(),
      end: end.toISOString(),
      nowTime: now.getTime(),
      startTime: start.getTime(),
      endTime: end.getTime(),
      isAfterStart: now >= start,
      isBeforeEnd: now <= end
    });
    
    return isActive;
  };

  const isApplicationOpen = (projectType: string): boolean => {
    const window = windows.find(
      w => w.windowType === 'application' && w.projectType === projectType
    );
    return window ? isWindowActive(window) : false;
  };

  const isSubmissionOpen = (projectType: string, assessmentType?: string): boolean => {
    const window = windows.find(
      w => w.windowType === 'submission' && 
           w.projectType === projectType &&
           (!assessmentType || w.assessmentType === assessmentType)
    );
    return window ? isWindowActive(window) : false;
  };

  const isAssessmentOpen = (projectType: string, assessmentType?: string): boolean => {
    const window = windows.find(
      w => w.windowType === 'assessment' && 
           w.projectType === projectType &&
           (!assessmentType || w.assessmentType === assessmentType)
    );
    return window ? isWindowActive(window) : false;
  };

  const isGradeReleaseOpen = (projectType: string, assessmentType?: string): boolean => {
    const window = windows.find(
      w => w.windowType === 'grade_release' && 
           w.projectType === projectType &&
           (!assessmentType || w.assessmentType === assessmentType)
    );
    return window ? isWindowActive(window) : false;
  };

  return {
    windows,
    loading,
    error,
    isProposalOpen,
    isApplicationOpen,
    isSubmissionOpen,
    isAssessmentOpen,
    isGradeReleaseOpen,
    refresh: fetchWindows,
  };
}
