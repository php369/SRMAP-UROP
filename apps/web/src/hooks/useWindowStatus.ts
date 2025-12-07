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
  }, []);

  const isProposalOpen = (projectType: string): boolean => {
    const window = windows.find(
      w => w.windowType === 'proposal' && w.projectType === projectType
    );
    const isActive = window ? isWindowActive(window) : false;
    console.log(`Proposal window check for ${projectType}:`, {
      window,
      isActive,
      now: new Date(),
      start: window?.startDate,
      end: window?.endDate
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
