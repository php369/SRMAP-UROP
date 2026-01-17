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
    // Refresh windows every 30 seconds to keep status up to date
    // Removed as per user request to avoid reloading loop
    // const interval = setInterval(() => {
    //   console.log('Auto-refreshing window status...');
    //   fetchWindows();
    // }, 30000);

    // return () => clearInterval(interval);
  }, []);

  const isProposalOpen = (projectType: string): boolean => {
    const proposalWindows = windows.filter(
      w => w.windowType === 'proposal' && w.projectType === projectType
    );

    if (proposalWindows.length === 0) {
      console.log(`No proposal window found for ${projectType}`);
      return false;
    }

    // Use the same isWindowActive function for consistency
    const isActive = proposalWindows.some(w => isWindowActive(w));

    console.log(`Proposal window check for ${projectType}:`, {
      totalWindows: proposalWindows.length,
      isActive,
      now: new Date().toISOString()
    });

    return isActive;
  };

  const isApplicationOpen = (projectType: string): boolean => {
    const applicationWindows = windows.filter(
      w => w.windowType === 'application' && w.projectType === projectType
    );

    if (applicationWindows.length === 0) {
      console.log(`No application window found for ${projectType}`);
      return false;
    }

    const isActive = applicationWindows.some(w => isWindowActive(w));

    console.log(`Application window check for ${projectType}:`, {
      totalWindows: applicationWindows.length,
      windows: applicationWindows.map(w => ({
        id: w._id,
        start: w.startDate,
        end: w.endDate,
        isActive: isWindowActive(w)
      })),
      isActive,
      now: new Date().toISOString()
    });

    return isActive;
  };

  const isSubmissionOpen = (projectType: string, assessmentType?: string): boolean => {
    const submissionWindows = windows.filter(
      w => w.windowType === 'submission' &&
        w.projectType === projectType &&
        (!assessmentType || w.assessmentType === assessmentType)
    );

    if (submissionWindows.length === 0) {
      console.log(`No submission window found for ${projectType}${assessmentType ? ` - ${assessmentType}` : ''}`);
      return false;
    }

    const isActive = submissionWindows.some(w => isWindowActive(w));
    console.log(`Submission window check for ${projectType}${assessmentType ? ` - ${assessmentType}` : ''}:`, {
      totalWindows: submissionWindows.length,
      isActive,
      now: new Date().toISOString()
    });

    return isActive;
  };

  const isAssessmentOpen = (projectType: string, assessmentType?: string): boolean => {
    const assessmentWindows = windows.filter(
      w => w.windowType === 'assessment' &&
        w.projectType === projectType &&
        (!assessmentType || w.assessmentType === assessmentType)
    );

    if (assessmentWindows.length === 0) {
      console.log(`No assessment window found for ${projectType}${assessmentType ? ` - ${assessmentType}` : ''}`);
      return false;
    }

    const isActive = assessmentWindows.some(w => isWindowActive(w));
    console.log(`Assessment window check for ${projectType}${assessmentType ? ` - ${assessmentType}` : ''}:`, {
      totalWindows: assessmentWindows.length,
      isActive,
      now: new Date().toISOString()
    });

    return isActive;
  };

  const isGradeReleaseOpen = (projectType: string, assessmentType?: string): boolean => {
    const gradeReleaseWindows = windows.filter(
      w => w.windowType === 'grade_release' &&
        w.projectType === projectType &&
        (!assessmentType || w.assessmentType === assessmentType)
    );

    if (gradeReleaseWindows.length === 0) {
      console.log(`No grade release window found for ${projectType}${assessmentType ? ` - ${assessmentType}` : ''}`);
      return false;
    }

    const isActive = gradeReleaseWindows.some(w => isWindowActive(w));
    console.log(`Grade release window check for ${projectType}${assessmentType ? ` - ${assessmentType}` : ''}:`, {
      totalWindows: gradeReleaseWindows.length,
      isActive,
      now: new Date().toISOString()
    });

    return isActive;
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
