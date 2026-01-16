import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { WindowForm, ProjectType, AssessmentType, Window, WindowCombination } from '../types';
import {
  isWindowCombinationDisabled,
  validateSequentialWindows,
  validateIndividualWindowCreation,
  isWindowTypeAvailable
} from '../utils/windowValidation';

const initialWindowForm: WindowForm = {
  windowTypes: [],
  projectTypes: [],
  assessmentType: '',
  startDate: '',
  endDate: '',
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

export const useWindowForm = (windows: Window[]) => {
  const [windowForm, setWindowForm] = useState<WindowForm>(initialWindowForm);

  const resetForm = useCallback(() => {
    setWindowForm(initialWindowForm);
  }, []);

  // Auto-deselect invalid window types when project types change
  const handleProjectTypeChange = useCallback((projectType: ProjectType, isChecked: boolean, editingWindow?: Window | null) => {
    let newProjectTypes: ProjectType[];

    if (isChecked) {
      newProjectTypes = [...windowForm.projectTypes, projectType];
    } else {
      newProjectTypes = windowForm.projectTypes.filter(t => t !== projectType);
    }

    // Filter out invalid window types based on new project type selection
    const validWindowTypes = windowForm.windowTypes.filter(windowType => {
      // If no project types selected, keep all window types
      if (newProjectTypes.length === 0) return true;

      // Check if this window type is valid for at least one selected project type
      return newProjectTypes.some(projType => {
        // Check workflow availability
        const isWorkflowAvailable = isWindowTypeAvailable(windowType, projType, undefined, windows, editingWindow);

        // Check for existing windows
        const existingCheck = isWindowCombinationDisabled(windowType, projType,
          windowType === 'assessment' ? windowForm.assessmentType as AssessmentType : undefined,
          windows,
          editingWindow
        );

        return isWorkflowAvailable && !existingCheck.disabled;
      });
    });

    setWindowForm({
      ...windowForm,
      projectTypes: newProjectTypes,
      windowTypes: validWindowTypes
    });
  }, [windowForm, windows]);

  // Helper function to get window combinations
  const getWindowCombinations = useCallback((): WindowCombination[] => {
    const combinations = [];
    for (const windowType of windowForm.windowTypes) {
      for (const projectType of windowForm.projectTypes) {
        combinations.push({
          key: `${windowType}-${projectType}`,
          windowType,
          projectType,
          label: `${windowType.replace('_', ' ')} - ${projectType}`
        });
      }
    }
    return combinations;
  }, [windowForm.windowTypes, windowForm.projectTypes]);

  // Helper function to update individual dates
  const updateIndividualDate = useCallback((windowKey: string, field: 'startDate' | 'endDate', value: string) => {
    setWindowForm(prev => ({
      ...prev,
      individualDates: {
        ...prev.individualDates,
        [windowKey]: {
          ...prev.individualDates[windowKey],
          [field]: value
        }
      }
    }));
  }, []);

  // Validate form before submission
  const validateForm = useCallback((editingWindow?: Window | null) => {
    // Validate window and project type selections
    if (windowForm.projectTypes.length === 0) {
      toast.error('Please select at least one project type');
      return false;
    }

    if (windowForm.windowTypes.length === 0) {
      toast.error('Please select at least one window type');
      return false;
    }

    // Additional validation: Check if selected combinations are still valid
    for (const windowType of windowForm.windowTypes) {
      for (const projectType of windowForm.projectTypes) {
        // Check workflow availability
        const isWorkflowAvailable = isWindowTypeAvailable(windowType, projectType, undefined, windows, editingWindow);
        if (!isWorkflowAvailable) {
          toast.error(`${windowType.replace('_', ' ')} is not available for ${projectType} due to workflow prerequisites`);
          return false;
        }

        // Check for existing windows (Skip if editing, as we are the existing window)
        const existingCheck = editingWindow
          ? { disabled: false, reason: '' }
          : isWindowCombinationDisabled(windowType, projectType,
            windowType === 'assessment' ? windowForm.assessmentType as AssessmentType : undefined,
            windows,
            editingWindow
          );

        if (existingCheck.disabled) {
          toast.error(`Cannot create ${windowType.replace('_', ' ')} for ${projectType}: ${existingCheck.reason}`);
          return false;
        }

        // Enhanced sequential timing validation
        const proposedStartDate = windowForm.useCommonDates ?
          new Date(windowForm.startDate) :
          new Date(windowForm.individualDates[`${windowType}-${projectType}`]?.startDate || '');

        if (proposedStartDate && !isNaN(proposedStartDate.getTime())) {
          const sequentialCheck = validateSequentialWindows(
            windowType,
            projectType,
            windowType === 'assessment' || windowType === 'submission' ? windowForm.assessmentType as AssessmentType : undefined,
            proposedStartDate,
            windows
          );

          if (!sequentialCheck.valid) {
            toast.error(`Sequential validation failed: ${sequentialCheck.reason}`);
            return false;
          }
        }
      }
    }

    // Validate dates based on mode
    if (windowForm.useCommonDates) {
      // For common dates mode, validate the common date fields
      if (!windowForm.startDate || !windowForm.endDate) {
        toast.error('Please fill all required fields');
        return false;
      }

      if (new Date(windowForm.endDate) <= new Date(windowForm.startDate)) {
        toast.error('End date must be after start date');
        return false;
      }
    } else {
      // For individual dates mode, validate each window combination
      const windowCombinations = getWindowCombinations();

      for (const combination of windowCombinations) {
        const individualDate = windowForm.individualDates[combination.key];
        if (!individualDate || !individualDate.startDate || !individualDate.endDate) {
          toast.error(`Please set dates for ${combination.key.replace('-', ' - ')}`);
          return false;
        }

        if (new Date(individualDate.endDate) <= new Date(individualDate.startDate)) {
          toast.error(`End date must be after start date for ${combination.key.replace('-', ' - ')}`);
          return false;
        }

        // Enhanced database validation for individual windows
        const validationErrors = validateIndividualWindowCreation(
          combination.windowType,
          combination.projectType,
          combination.windowType === 'assessment' || combination.windowType === 'submission' ? windowForm.assessmentType as AssessmentType : '',
          individualDate.startDate,
          individualDate.endDate,
          windows,
          editingWindow
        );

        if (validationErrors.length > 0) {
          toast.error(`${combination.key.replace('-', ' - ')}: ${validationErrors[0]}`);
          return false;
        }
      }
    }

    // Enhanced database validation for common dates mode
    if (windowForm.useCommonDates) {
      for (const windowType of windowForm.windowTypes) {
        for (const projectType of windowForm.projectTypes) {
          const validationErrors = validateIndividualWindowCreation(
            windowType,
            projectType,
            windowType === 'assessment' || windowType === 'submission' ? windowForm.assessmentType as AssessmentType : '',
            windowForm.startDate,
            windowForm.endDate,
            windows,
            editingWindow
          );

          if (validationErrors.length > 0) {
            toast.error(`${windowType.replace('_', ' ')} - ${projectType}: ${validationErrors[0]}`);
            return false;
          }
        }
      }
    }

    return true;
  }, [windowForm, windows, getWindowCombinations]);

  return {
    windowForm,
    setWindowForm,
    resetForm,
    handleProjectTypeChange,
    getWindowCombinations,
    updateIndividualDate,
    validateForm
  };
};