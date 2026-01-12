import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../../../utils/api';
import { Window, WindowForm, ProjectType, WindowType, AssessmentType } from '../types';
import { convertLocalDateTimeToISO, formatToLocalDateTime } from '../utils/dateTimeUtils';

export const useWindowManagement = () => {
  const [windows, setWindows] = useState<Window[]>([]);
  const [windowsLoading, setWindowsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchWindows = useCallback(async () => {
    setWindowsLoading(true);
    try {
      const response = await api.get('/control/windows');
      if (response.success && response.data) {
        setWindows(Array.isArray(response.data) ? response.data : []);
      } else {
        setWindows([]);
      }
    } catch (error: any) {
      console.error('Error fetching windows:', error);
      if (error.message?.includes('Too many requests')) {
        toast.error('Rate limit reached. Please wait a moment before refreshing.');
      }
      setWindows([]);
    } finally {
      setWindowsLoading(false);
    }
  }, []);

  const createWindow = useCallback(async (
    windowForm: WindowForm,
    editingWindow: Window | null
  ) => {
    setLoading(true);
    try {
      // Convert datetime-local values to ISO strings (preserving local time)
      let startDate, endDate;
      if (windowForm.useCommonDates) {
        startDate = convertLocalDateTimeToISO(windowForm.startDate);
        endDate = convertLocalDateTimeToISO(windowForm.endDate);
      }

      if (editingWindow) {
        // For editing, use single window approach (existing functionality)
        if (!windowForm.useCommonDates || !startDate || !endDate) {
          toast.error('Please use common dates mode when editing a window');
          return false;
        }

        const payload = {
          windowType: windowForm.windowTypes[0],
          projectType: windowForm.projectTypes[0],
          assessmentType: windowForm.assessmentType || undefined,
          startDate,
          endDate
        };

        const response = await api.put(`/control/windows/${editingWindow._id}`, payload);

        if (response.success) {
          toast.success('Window updated successfully');
          await fetchWindows();
          return true;
        } else {
          toast.error(response.error?.message || 'Failed to update window');
          return false;
        }
      } else {
        // For creating, create multiple windows based on selections
        const windowsToCreate = [];

        for (const windowType of windowForm.windowTypes) {
          for (const projectType of windowForm.projectTypes) {
            const windowKey = `${windowType}-${projectType}`;

            // Use individual dates if available, otherwise use common dates
            let windowStartDate, windowEndDate;

            if (!windowForm.useCommonDates && windowForm.individualDates[windowKey]) {
              windowStartDate = convertLocalDateTimeToISO(windowForm.individualDates[windowKey].startDate);
              windowEndDate = convertLocalDateTimeToISO(windowForm.individualDates[windowKey].endDate);
            } else {
              windowStartDate = startDate;
              windowEndDate = endDate;
            }

            windowsToCreate.push({
              windowType,
              projectType,
              assessmentType: windowForm.assessmentType || undefined,
              startDate: windowStartDate,
              endDate: windowEndDate
            });
          }
        }

        console.log(`Creating ${windowsToCreate.length} windows:`, windowsToCreate);

        // Create all windows
        const results = await Promise.allSettled(
          windowsToCreate.map(payload => api.post('/control/windows', payload))
        );

        // Count successful and failed creations
        const successful = results.filter(result =>
          result.status === 'fulfilled' && result.value.success
        ).length;

        const failed = results.length - successful;

        if (successful > 0) {
          if (failed === 0) {
            toast.success(`Successfully created ${successful} window${successful > 1 ? 's' : ''}`);
          } else {
            toast.success(`Created ${successful} window${successful > 1 ? 's' : ''}, ${failed} failed`);
          }
          await fetchWindows();
          return true;
        } else {
          toast.error('Failed to create any windows');
          return false;
        }
      }
    } catch (error: any) {
      console.error('Create window error:', error);
      toast.error(error.message || 'Failed to create window');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchWindows]);

  const createBulkWindows = useCallback(async (
    windowForm: WindowForm,
    selectedProjectType: ProjectType
  ) => {
    setLoading(true);
    try {
      const generatedWindows = [];
      const { bulkSettings } = windowForm;

      // Generate proposal windows
      generatedWindows.push({
        windowType: 'proposal' as WindowType,
        projectType: selectedProjectType,
        startDate: convertLocalDateTimeToISO(bulkSettings.proposal.startDate),
        endDate: convertLocalDateTimeToISO(bulkSettings.proposal.endDate)
      });

      // Generate application windows
      generatedWindows.push({
        windowType: 'application' as WindowType,
        projectType: selectedProjectType,
        startDate: convertLocalDateTimeToISO(bulkSettings.application.startDate),
        endDate: convertLocalDateTimeToISO(bulkSettings.application.endDate)
      });

      // Generate assessment windows (submission + assessment for each CLA type)
      const assessmentTypes: AssessmentType[] = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
      const phaseKeys = ['cla1', 'cla2', 'cla3', 'external'] as const;

      assessmentTypes.forEach((assessmentType, index) => {
        const phaseKey = phaseKeys[index];
        const phaseSettings = bulkSettings[phaseKey];

        // Submission window
        generatedWindows.push({
          windowType: 'submission' as WindowType,
          projectType: selectedProjectType,
          assessmentType,
          startDate: convertLocalDateTimeToISO(phaseSettings.submissionStart),
          endDate: convertLocalDateTimeToISO(phaseSettings.submissionEnd)
        });

        // Assessment window
        generatedWindows.push({
          windowType: 'assessment' as WindowType,
          projectType: selectedProjectType,
          assessmentType,
          startDate: convertLocalDateTimeToISO(phaseSettings.assessmentStart),
          endDate: convertLocalDateTimeToISO(phaseSettings.assessmentEnd)
        });
      });

      // Generate grade release windows
      generatedWindows.push({
        windowType: 'grade_release' as WindowType,
        projectType: selectedProjectType,
        startDate: convertLocalDateTimeToISO(bulkSettings.gradeRelease.startDate),
        endDate: convertLocalDateTimeToISO(bulkSettings.gradeRelease.endDate)
      });

      console.log(`Creating ${generatedWindows.length} windows for ${selectedProjectType}:`, generatedWindows);

      // Create all windows
      const results = await Promise.allSettled(
        generatedWindows.map(windowData => api.post('/control/windows', windowData))
      );

      // Count successful and failed creations
      const successful = results.filter(result =>
        result.status === 'fulfilled' && result.value.success
      ).length;

      const failed = results.length - successful;

      if (successful > 0) {
        if (failed === 0) {
          toast.success(`Successfully created all ${successful} windows for ${selectedProjectType}! 🎉`);
        } else {
          toast.success(`Created ${successful} windows for ${selectedProjectType}, ${failed} failed. Check existing windows.`);
        }
        await fetchWindows();
        return true;
      } else {
        toast.error(`Failed to create semester windows for ${selectedProjectType}. Check for existing windows.`);
        return false;
      }
    } catch (error: any) {
      console.error('Bulk window creation error:', error);
      toast.error(error.message || 'Failed to create semester windows');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchWindows]);

  const deleteWindow = useCallback(async (windowId: string) => {
    try {
      const response = await api.delete(`/windows/${windowId}`);

      if (response.success) {
        toast.success('Window deleted successfully');
        await fetchWindows();
        return true;
      } else {
        toast.error(response.error?.message || 'Failed to delete window');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete window');
      return false;
    }
  }, [fetchWindows]);



  const prepareEditWindow = useCallback((window: Window): WindowForm => {
    // Convert UTC dates to local datetime-local format
    const startDate = new Date(window.startDate);
    const endDate = new Date(window.endDate);

    return {
      windowTypes: [window.windowType],
      projectTypes: [window.projectType],
      assessmentType: (window.assessmentType || '') as AssessmentType | '',
      startDate: formatToLocalDateTime(startDate),
      endDate: formatToLocalDateTime(endDate),
      useCommonDates: true,
      individualDates: {},
      bulkSettings: {
        proposal: { startDate: '', endDate: '' },
        application: { startDate: '', endDate: '' },
        cla1: { submissionStart: '', submissionEnd: '', assessmentStart: '', assessmentEnd: '' },
        cla2: { submissionStart: '', submissionEnd: '', assessmentStart: '', assessmentEnd: '' },
        cla3: { submissionStart: '', submissionEnd: '', assessmentStart: '', assessmentEnd: '' },
        external: { submissionStart: '', submissionEnd: '', assessmentStart: '', assessmentEnd: '' },
        gradeRelease: { startDate: '', endDate: '' }
      }
    };
  }, []);

  return {
    windows,
    windowsLoading,
    loading,
    fetchWindows,
    createWindow,
    createBulkWindows,
    deleteWindow,

    prepareEditWindow
  };
};