import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../../../utils/api';
import { ProjectType, Window } from '../types';

export const useGradeRelease = () => {
  const [releasedGrades, setReleasedGrades] = useState<Record<ProjectType, boolean>>({
    'IDP': false,
    'UROP': false,
    'CAPSTONE': false
  });

  const checkReleasedGrades = useCallback(async () => {
    try {
      // Check if grades have been released for each project type
      const projectTypes: ProjectType[] = ['IDP', 'UROP', 'CAPSTONE'];
      const releasedStatus: Record<ProjectType, boolean> = {
        'IDP': false,
        'UROP': false,
        'CAPSTONE': false
      };

      for (const projectType of projectTypes) {
        try {
          const response = await api.get(`/student-evaluations/released-count?projectType=${projectType}`);
          if (response.success && response.data && (response.data as any).count > 0) {
            releasedStatus[projectType] = true;
          }
        } catch (error) {
          // If endpoint doesn't exist or fails, assume not released
          console.log(`Could not check released status for ${projectType}`);
        }
      }

      setReleasedGrades(releasedStatus);
    } catch (error) {
      console.error('Error checking released grades:', error);
    }
  }, []);

  const releaseGrades = useCallback(async (projectType: ProjectType) => {
    try {
      const response = await api.post('/control/grades/release-final', { projectType });

      if (response.success) {
        toast.success((response as any).message || 'Final grades released successfully');
        setReleasedGrades(prev => ({ ...prev, [projectType]: true }));
        return true;
      } else {
        toast.error(response.error?.message || 'Failed to release final grades');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to release final grades');
      return false;
    }
  }, []);

  // Check if grade release window is active for any project type
  const isGradeReleaseWindowActive = useCallback((windows: Window[]) => {
    const now = new Date();
    return windows.some(window => {
      const start = new Date(window.startDate);
      const end = new Date(window.endDate);
      return window.windowType === 'grade_release' && now >= start && now <= end;
    });
  }, []);

  return {
    releasedGrades,
    checkReleasedGrades,
    releaseGrades,
    isGradeReleaseWindowActive
  };
};