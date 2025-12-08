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
    // Find ALL proposal windows for this project type
    const proposalWindows = windows.filter(
      w => w.windowType === 'proposal' && w.projectType === projectType
    );
    
    if (proposalWindows.length === 0) {
      console.log(`No proposal window found for ${projectType}`);
      return false;
    }
    
    const now = new Date();
    
    // Check if ANY of the windows is currently active
    const activeWindow = proposalWindows.find(w => {
      const start = new Date(w.startDate);
      const end = new Date(w.endDate);
      return now >= start && now <= end;
    });
    
    const isActive = !!activeWindow;
    
    console.log(`Proposal window check for ${projectType}:`, {
      totalWindows: proposalWindows.length,
      activeWindow: activeWindow ? {
        id: activeWindow._id,
        start: activeWindow.startDate,
        end: activeWindow.endDate
      } : null,
      isActive,
      now: now.toISOString()
    });
    
    return isActive;
  };

  const isApplicationOpen = (projectType: string): boolean => {
    const applicationWindows = windows.filter(
      w => w.windowType === 'application' && w.projectType === projectType
    );
    return applicationWindows.some(w => isWindowActive(w));
  };

  const isSubmissionOpen = (projectType: string, assessmentType?: string): boolean => {
    const submissionWindows = windows.filter(
      w => w.windowType === 'submission' && 
           w.projectType === projectType &&
           (!assessmentType || w.assessmentType === assessmentType)
    );
    return submissionWindows.some(w => isWindowActive(w));
  };

  const isAssessmentOpen = (projectType: string, assessmentType?: string): boolean => {
    const assessmentWindows = windows.filter(
      w => w.windowType === 'assessment' && 
           w.projectType === projectType &&
           (!assessmentType || w.assessmentType === assessmentType)
    );
    return assessmentWindows.some(w => isWindowActive(w));
  };

  const isGradeReleaseOpen = (projectType: string, assessmentType?: string): boolean => {
    const gradeReleaseWindows = windows.filter(
      w => w.windowType === 'grade_release' && 
           w.projectType === projectType &&
           (!assessmentType || w.assessmentType === assessmentType)
    );
    return gradeReleaseWindows.some(w => isWindowActive(w));
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
