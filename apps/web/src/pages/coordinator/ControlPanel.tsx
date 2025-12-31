import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Award, Users, FileText, Plus, Edit2, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { SmartDateTimeInput } from '../../components/ui/SmartDateTimeInput';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

type WindowType = 'proposal' | 'application' | 'submission' | 'assessment' | 'grade_release';
type ProjectType = 'IDP' | 'UROP' | 'CAPSTONE';
type AssessmentType = 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External';

export function ControlPanel() {
  const [windows, setWindows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showInactiveWindows, setShowInactiveWindows] = useState(false);
  const [releasedGrades, setReleasedGrades] = useState<Record<ProjectType, boolean>>({
    'IDP': false,
    'UROP': false,
    'CAPSTONE': false
  });
  const [showWindowForm, setShowWindowForm] = useState(false);
  const [showCreationModeModal, setShowCreationModeModal] = useState(false);
  const [creationMode, setCreationMode] = useState<'individual' | 'bulk'>('individual');
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [editingWindow, setEditingWindow] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [windowToDelete, setWindowToDelete] = useState<any>(null);
  const [showGradeReleaseModal, setShowGradeReleaseModal] = useState(false);
  const [gradeReleaseProjectType, setGradeReleaseProjectType] = useState<ProjectType | null>(null);

  const [windowForm, setWindowForm] = useState({
    windowTypes: [] as WindowType[],
    projectTypes: [] as ProjectType[],
    assessmentType: '' as AssessmentType | '',
    startDate: '',
    endDate: '',
    useCommonDates: true, // Toggle between common and individual dates
    individualDates: {} as Record<string, { startDate: string; endDate: string }>, // Individual dates for each combination
    // Bulk creation settings
    bulkSettings: {
      semesterStartDate: '',
      proposalDuration: 7, // days
      applicationDuration: 14, // days
      submissionDuration: 7, // days
      assessmentDuration: 14, // days
      gradeReleaseDuration: 3, // days
      gapBetweenPhases: 1, // days
      gapBetweenAssessments: 3 // days
    }
  });

  useEffect(() => {
    // Load windows and stats in parallel, but don't block each other
    const loadData = async () => {
      await Promise.all([
        fetchWindows(),
        fetchStats(),
        checkReleasedGrades()
      ]);
    };
    
    loadData();
  }, []);

  const fetchWindows = async () => {
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
    }
  };

  const fetchStats = async () => {
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
  };

  // Check if a window combination already exists (active or upcoming)
  const isWindowCombinationDisabled = (windowType: WindowType, projectType: ProjectType, assessmentType?: AssessmentType) => {
    const now = new Date();
    
    // Find existing windows that are active or upcoming for this combination
    const existingWindow = windows.find(window => {
      const end = new Date(window.endDate);
      const isActiveOrUpcoming = now <= end; // Active (now between start-end) or upcoming (now < start)
      
      return window.windowType === windowType &&
             window.projectType === projectType &&
             window.assessmentType === assessmentType &&
             isActiveOrUpcoming;
    });

    if (existingWindow) {
      const start = new Date(existingWindow.startDate);
      const end = new Date(existingWindow.endDate);
      const isActive = now >= start && now <= end;
      
      return {
        disabled: true,
        reason: isActive ? 'Active window exists' : 'Upcoming window exists',
        window: existingWindow,
        status: isActive ? 'active' : 'upcoming'
      };
    }

    return { disabled: false };
  };

  // Enhanced sequential window validation
  const validateSequentialWindows = (windowType: WindowType, projectType: ProjectType, assessmentType?: AssessmentType, proposedStartDate?: Date) => {
    const now = new Date();
    
    // For proposal windows, check if there's already an active IDP proposal
    if (windowType === 'proposal' && projectType !== 'IDP') {
      const activeIdpProposal = windows.find(w => 
        w.windowType === 'proposal' && 
        w.projectType === 'IDP' && 
        now >= new Date(w.startDate) && 
        now <= new Date(w.endDate)
      );
      
      if (activeIdpProposal && proposedStartDate) {
        const idpEndDate = new Date(activeIdpProposal.endDate);
        if (proposedStartDate <= idpEndDate) {
          return {
            valid: false,
            reason: `${projectType} proposal must start after IDP proposal ends (${idpEndDate.toLocaleDateString()})`
          };
        }
      }
    }

    // For application windows, ensure proposal window has ended
    if (windowType === 'application') {
      const proposalWindow = windows.find(w => 
        w.windowType === 'proposal' && 
        w.projectType === projectType
      );
      
      if (!proposalWindow) {
        return {
          valid: false,
          reason: `Proposal window for ${projectType} must be created first`
        };
      }
      
      if (proposedStartDate) {
        const proposalEndDate = new Date(proposalWindow.endDate);
        if (proposedStartDate <= proposalEndDate) {
          return {
            valid: false,
            reason: `Application window must start after proposal window ends (${proposalEndDate.toLocaleDateString()})`
          };
        }
      }
    }

    // For submission windows, ensure application window has ended
    if (windowType === 'submission') {
      const applicationWindow = windows.find(w => 
        w.windowType === 'application' && 
        w.projectType === projectType
      );
      
      if (!applicationWindow) {
        return {
          valid: false,
          reason: `Application window for ${projectType} must be created first`
        };
      }
      
      if (proposedStartDate) {
        const applicationEndDate = new Date(applicationWindow.endDate);
        if (proposedStartDate <= applicationEndDate) {
          return {
            valid: false,
            reason: `Submission window must start after application window ends (${applicationEndDate.toLocaleDateString()})`
          };
        }
      }

      // For CLA assessments, ensure sequential order
      if (assessmentType && assessmentType !== 'CLA-1') {
        const claOrder: AssessmentType[] = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
        const currentIndex = claOrder.indexOf(assessmentType);
        
        if (currentIndex > 0) {
          const previousAssessment = claOrder[currentIndex - 1];
          const previousSubmissionWindow = windows.find(w => 
            w.windowType === 'submission' && 
            w.projectType === projectType &&
            w.assessmentType === previousAssessment
          );
          
          if (!previousSubmissionWindow) {
            return {
              valid: false,
              reason: `${previousAssessment} submission window must be created first`
            };
          }
          
          if (proposedStartDate) {
            const previousEndDate = new Date(previousSubmissionWindow.endDate);
            if (proposedStartDate <= previousEndDate) {
              return {
                valid: false,
                reason: `${assessmentType} submission must start after ${previousAssessment} submission ends (${previousEndDate.toLocaleDateString()})`
              };
            }
          }
        }
      }
    }

    // For assessment windows, ensure submission window has ended
    if (windowType === 'assessment') {
      const submissionWindow = windows.find(w => 
        w.windowType === 'submission' && 
        w.projectType === projectType &&
        w.assessmentType === assessmentType
      );
      
      if (!submissionWindow) {
        return {
          valid: false,
          reason: `Submission window for ${projectType} ${assessmentType || ''} must be created first`
        };
      }
      
      if (proposedStartDate) {
        const submissionEndDate = new Date(submissionWindow.endDate);
        if (proposedStartDate <= submissionEndDate) {
          return {
            valid: false,
            reason: `Assessment window must start after submission window ends (${submissionEndDate.toLocaleDateString()})`
          };
        }
      }
    }

    // For grade release, ensure all assessments are completed
    if (windowType === 'grade_release') {
      const requiredAssessments: AssessmentType[] = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
      
      for (const assessment of requiredAssessments) {
        const assessmentWindow = windows.find(w => 
          w.windowType === 'assessment' && 
          w.projectType === projectType &&
          w.assessmentType === assessment
        );
        
        if (!assessmentWindow) {
          return {
            valid: false,
            reason: `All assessment windows (${requiredAssessments.join(', ')}) must be completed before grade release`
          };
        }
        
        if (proposedStartDate) {
          const assessmentEndDate = new Date(assessmentWindow.endDate);
          if (proposedStartDate <= assessmentEndDate) {
            return {
              valid: false,
              reason: `Grade release must start after all assessments end. ${assessment} ends on ${assessmentEndDate.toLocaleDateString()}`
            };
          }
        }
      }
    }

    return { valid: true };
  };

  // Generate bulk windows for all project types
  const generateBulkWindows = () => {
    const { bulkSettings } = windowForm;
    const startDate = new Date(bulkSettings.semesterStartDate);
    const generatedWindows = [];
    
    const projectTypes: ProjectType[] = ['IDP', 'UROP', 'CAPSTONE'];
    const assessmentTypes: AssessmentType[] = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
    
    let currentDate = new Date(startDate);
    
    // Phase 1: IDP Proposal (first)
    const idpProposalStart = new Date(currentDate);
    const idpProposalEnd = new Date(currentDate.getTime() + bulkSettings.proposalDuration * 24 * 60 * 60 * 1000);
    generatedWindows.push({
      windowType: 'proposal' as WindowType,
      projectType: 'IDP' as ProjectType,
      startDate: idpProposalStart,
      endDate: idpProposalEnd
    });
    
    currentDate = new Date(idpProposalEnd.getTime() + bulkSettings.gapBetweenPhases * 24 * 60 * 60 * 1000);
    
    // Phase 2: Other project proposals (UROP, CAPSTONE)
    for (const projectType of ['UROP', 'CAPSTONE'] as ProjectType[]) {
      const proposalStart = new Date(currentDate);
      const proposalEnd = new Date(currentDate.getTime() + bulkSettings.proposalDuration * 24 * 60 * 60 * 1000);
      generatedWindows.push({
        windowType: 'proposal' as WindowType,
        projectType,
        startDate: proposalStart,
        endDate: proposalEnd
      });
      currentDate = new Date(proposalEnd.getTime() + bulkSettings.gapBetweenPhases * 24 * 60 * 60 * 1000);
    }
    
    // Phase 3: Application windows for all project types
    for (const projectType of projectTypes) {
      const applicationStart = new Date(currentDate);
      const applicationEnd = new Date(currentDate.getTime() + bulkSettings.applicationDuration * 24 * 60 * 60 * 1000);
      generatedWindows.push({
        windowType: 'application' as WindowType,
        projectType,
        startDate: applicationStart,
        endDate: applicationEnd
      });
      currentDate = new Date(applicationEnd.getTime() + bulkSettings.gapBetweenPhases * 24 * 60 * 60 * 1000);
    }
    
    // Phase 4: Sequential assessment phases
    for (const assessmentType of assessmentTypes) {
      for (const projectType of projectTypes) {
        // Submission window
        const submissionStart = new Date(currentDate);
        const submissionEnd = new Date(currentDate.getTime() + bulkSettings.submissionDuration * 24 * 60 * 60 * 1000);
        generatedWindows.push({
          windowType: 'submission' as WindowType,
          projectType,
          assessmentType,
          startDate: submissionStart,
          endDate: submissionEnd
        });
        
        // Assessment window (starts right after submission)
        const assessmentStart = new Date(submissionEnd.getTime() + bulkSettings.gapBetweenPhases * 24 * 60 * 60 * 1000);
        const assessmentEnd = new Date(assessmentStart.getTime() + bulkSettings.assessmentDuration * 24 * 60 * 60 * 1000);
        generatedWindows.push({
          windowType: 'assessment' as WindowType,
          projectType,
          assessmentType,
          startDate: assessmentStart,
          endDate: assessmentEnd
        });
      }
      
      // Gap between different assessment types
      currentDate = new Date(currentDate.getTime() + (bulkSettings.submissionDuration + bulkSettings.assessmentDuration + bulkSettings.gapBetweenAssessments) * 24 * 60 * 60 * 1000);
    }
    
    // Phase 5: Grade release windows
    for (const projectType of projectTypes) {
      const gradeReleaseStart = new Date(currentDate);
      const gradeReleaseEnd = new Date(currentDate.getTime() + bulkSettings.gradeReleaseDuration * 24 * 60 * 60 * 1000);
      generatedWindows.push({
        windowType: 'grade_release' as WindowType,
        projectType,
        startDate: gradeReleaseStart,
        endDate: gradeReleaseEnd
      });
      currentDate = new Date(gradeReleaseEnd.getTime() + bulkSettings.gapBetweenPhases * 24 * 60 * 60 * 1000);
    }
    
    return generatedWindows;
  };

  // Auto-deselect invalid window types when project types change
  const handleProjectTypeChange = (projectType: ProjectType, isChecked: boolean) => {
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
        const isWorkflowAvailable = isWindowTypeAvailable(windowType, projType);
        
        // Check for existing windows
        const existingCheck = isWindowCombinationDisabled(windowType, projType, 
          windowType === 'assessment' ? windowForm.assessmentType as AssessmentType : undefined
        );
        
        return isWorkflowAvailable && !existingCheck.disabled;
      });
    });

    setWindowForm({
      ...windowForm,
      projectTypes: newProjectTypes,
      windowTypes: validWindowTypes
    });
  };

  const checkReleasedGrades = async () => {
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
  };

  // Check if grade release window is active for any project type
  const isGradeReleaseWindowActive = () => {
    const now = new Date();
    return windows.some(window => {
      const start = new Date(window.startDate);
      const end = new Date(window.endDate);
      return window.windowType === 'grade_release' && now >= start && now <= end;
    });
  };

  const handleEditWindow = (window: any) => {
    setEditingWindow(window);
    
    // Convert UTC dates to local datetime-local format
    // datetime-local expects format: YYYY-MM-DDTHH:mm
    const startDate = new Date(window.startDate);
    const endDate = new Date(window.endDate);
    
    // Format to local time for datetime-local input
    const formatToLocalDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setWindowForm({
      windowTypes: [window.windowType],
      projectTypes: [window.projectType],
      assessmentType: window.assessmentType || '',
      startDate: formatToLocalDateTime(startDate),
      endDate: formatToLocalDateTime(endDate),
      useCommonDates: true,
      individualDates: {},
      bulkSettings: {
        semesterStartDate: '',
        proposalDuration: 7,
        applicationDuration: 14,
        submissionDuration: 7,
        assessmentDuration: 14,
        gradeReleaseDuration: 3,
        gapBetweenPhases: 1,
        gapBetweenAssessments: 3
      }
    });
    setShowWindowForm(true);
  };

  const handleCreateWindow = async () => {
    if (creationMode === 'bulk' && !editingWindow) {
      return handleBulkWindowCreation();
    }
    
    // Validate window and project type selections
    if (windowForm.projectTypes.length === 0) {
      toast.error('Please select at least one project type');
      return;
    }

    if (windowForm.windowTypes.length === 0) {
      toast.error('Please select at least one window type');
      return;
    }

    // Additional validation: Check if selected combinations are still valid
    for (const windowType of windowForm.windowTypes) {
      for (const projectType of windowForm.projectTypes) {
        // Check workflow availability
        const isWorkflowAvailable = isWindowTypeAvailable(windowType, projectType);
        if (!isWorkflowAvailable) {
          toast.error(`${windowType.replace('_', ' ')} is not available for ${projectType} due to workflow prerequisites`);
          return;
        }

        // Check for existing windows
        const existingCheck = isWindowCombinationDisabled(windowType, projectType, 
          windowType === 'assessment' ? windowForm.assessmentType as AssessmentType : undefined
        );
        if (existingCheck.disabled) {
          toast.error(`Cannot create ${windowType.replace('_', ' ')} for ${projectType}: ${existingCheck.reason}`);
          return;
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
            proposedStartDate
          );
          
          if (!sequentialCheck.valid) {
            toast.error(`Sequential validation failed: ${sequentialCheck.reason}`);
            return;
          }
        }
      }
    }

    // Validate dates based on mode
    if (windowForm.useCommonDates) {
      // For common dates mode, validate the common date fields
      if (!windowForm.startDate || !windowForm.endDate) {
        toast.error('Please fill all required fields');
        return;
      }

      if (new Date(windowForm.endDate) <= new Date(windowForm.startDate)) {
        toast.error('End date must be after start date');
        return;
      }
    } else {
      // For individual dates mode, validate each window combination
      const windowCombinations = [];
      for (const windowType of windowForm.windowTypes) {
        for (const projectType of windowForm.projectTypes) {
          windowCombinations.push(`${windowType}-${projectType}`);
        }
      }
      
      for (const windowKey of windowCombinations) {
        const individualDate = windowForm.individualDates[windowKey];
        if (!individualDate || !individualDate.startDate || !individualDate.endDate) {
          toast.error(`Please set dates for ${windowKey.replace('-', ' - ')}`);
          return;
        }
        
        if (new Date(individualDate.endDate) <= new Date(individualDate.startDate)) {
          toast.error(`End date must be after start date for ${windowKey.replace('-', ' - ')}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Convert datetime-local values to ISO strings (only for common dates mode)
      let startDate, endDate;
      if (windowForm.useCommonDates) {
        const startDateObj = new Date(windowForm.startDate);
        const endDateObj = new Date(windowForm.endDate);
        startDate = startDateObj.toISOString();
        endDate = endDateObj.toISOString();
      }
      
      if (editingWindow) {
        // For editing, use single window approach (existing functionality)
        // When editing, we should always use common dates
        if (!windowForm.useCommonDates || !startDate || !endDate) {
          toast.error('Please use common dates mode when editing a window');
          return;
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
          setShowWindowForm(false);
          setEditingWindow(null);
          await fetchWindows();
          resetForm();
        } else {
          toast.error(response.error?.message || 'Failed to update window');
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
              const individualStart = new Date(windowForm.individualDates[windowKey].startDate);
              const individualEnd = new Date(windowForm.individualDates[windowKey].endDate);
              windowStartDate = individualStart.toISOString();
              windowEndDate = individualEnd.toISOString();
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
          setShowWindowForm(false);
          await fetchWindows();
          resetForm();
        } else {
          toast.error('Failed to create any windows');
        }
      }
    } catch (error: any) {
      console.error('Create window error:', error);
      toast.error(error.message || 'Failed to create window');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkWindowCreation = async () => {
    if (!windowForm.bulkSettings.semesterStartDate) {
      toast.error('Please select semester start date');
      return;
    }

    setLoading(true);
    try {
      const generatedWindows = generateBulkWindows();
      
      console.log(`Creating ${generatedWindows.length} windows for entire semester:`, generatedWindows);
      
      // Create all windows
      const results = await Promise.allSettled(
        generatedWindows.map(windowData => api.post('/control/windows', {
          ...windowData,
          startDate: windowData.startDate.toISOString(),
          endDate: windowData.endDate.toISOString()
        }))
      );
      
      // Count successful and failed creations
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
      
      const failed = results.length - successful;
      
      if (successful > 0) {
        if (failed === 0) {
          toast.success(`Successfully created all ${successful} windows for the semester! 🎉`);
        } else {
          toast.success(`Created ${successful} windows, ${failed} failed. Check existing windows.`);
        }
        setShowWindowForm(false);
        setShowCreationModeModal(false);
        await fetchWindows();
        resetForm();
      } else {
        toast.error('Failed to create semester windows. Check for existing windows.');
      }
    } catch (error: any) {
      console.error('Bulk window creation error:', error);
      toast.error(error.message || 'Failed to create semester windows');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get window combinations
  const getWindowCombinations = () => {
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
  };

  // Helper function to check workflow prerequisites for a window type
  const getWorkflowPrerequisites = (windowType: WindowType, assessmentType?: string): string[] => {
    const workflow: Record<WindowType, string[]> = {
      'proposal': [],
      'application': ['proposal'],
      'submission': ['proposal', 'application'],
      'assessment': ['proposal', 'application', 'submission'],
      'grade_release': ['proposal', 'application', 'submission', 'assessment']
    };

    let prerequisites: string[] = [...(workflow[windowType] || [])];

    // For CLA assessments, need to check sequential order
    if ((windowType === 'submission' || windowType === 'assessment') && assessmentType) {
      const claOrder: AssessmentType[] = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
      const currentIndex = claOrder.indexOf(assessmentType as AssessmentType);
      
      if (currentIndex > 0) {
        // Need previous CLA stages to be completed
        for (let i = 0; i < currentIndex; i++) {
          const prevAssessment = claOrder[i];
          if (prevAssessment) {
            prerequisites.push(`${windowType}-${prevAssessment}`);
          }
        }
      }
    }

    return prerequisites;
  };

  // Helper function to check if a window type is available based on existing windows
  const isWindowTypeAvailable = (windowType: WindowType, projectType: ProjectType, assessmentType?: string) => {
    if (editingWindow) return true; // Allow editing existing windows

    const prerequisites = getWorkflowPrerequisites(windowType, assessmentType);
    
    // Check if all prerequisites exist in the database
    for (const prereq of prerequisites) {
      if (prereq.includes('-')) {
        // This is a specific assessment type prerequisite
        const [prereqWindowType, prereqAssessmentType] = prereq.split('-');
        const hasPrereq = windows.some(w => 
          w.windowType === prereqWindowType && 
          w.projectType === projectType && 
          w.assessmentType === prereqAssessmentType
        );
        if (!hasPrereq) return false;
      } else {
        // This is a general window type prerequisite
        const hasPrereq = windows.some(w => 
          w.windowType === prereq && 
          w.projectType === projectType
        );
        if (!hasPrereq) return false;
      }
    }

    return true;
  };

  // Helper function to get available assessment types for submission/assessment
  const getAvailableAssessmentTypes = (windowType: WindowType, projectType: ProjectType) => {
    if (windowType !== 'submission' && windowType !== 'assessment') return [];

    const allTypes = ['CLA-1', 'CLA-2', 'CLA-3', 'External'];
    const availableTypes = [];

    for (const assessmentType of allTypes) {
      if (isWindowTypeAvailable(windowType, projectType, assessmentType)) {
        availableTypes.push(assessmentType);
      }
    }

    return availableTypes;
  };

  // Helper function to update individual dates
  const updateIndividualDate = (windowKey: string, field: 'startDate' | 'endDate', value: string) => {
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
  };

  // Helper function to copy common dates to all individual windows
  const copyCommonDatesToAll = () => {
    if (!windowForm.startDate || !windowForm.endDate) {
      toast.error('Please set common dates first');
      return;
    }
    
    const combinations = getWindowCombinations();
    const newIndividualDates: Record<string, { startDate: string; endDate: string }> = {};
    
    combinations.forEach(({ key }) => {
      newIndividualDates[key] = {
        startDate: windowForm.startDate,
        endDate: windowForm.endDate
      };
    });
    
    setWindowForm(prev => ({
      ...prev,
      individualDates: newIndividualDates
    }));
    
    toast.success('Common dates copied to all windows');
  };

  const resetForm = () => {
    setWindowForm({
      windowTypes: [],
      projectTypes: [],
      assessmentType: '',
      startDate: '',
      endDate: '',
      useCommonDates: true,
      individualDates: {},
      bulkSettings: {
        semesterStartDate: '',
        proposalDuration: 7,
        applicationDuration: 14,
        submissionDuration: 7,
        assessmentDuration: 14,
        gradeReleaseDuration: 3,
        gapBetweenPhases: 1,
        gapBetweenAssessments: 3
      }
    });
    setCreationMode('individual');
  };





  const handleUpdateWindowStatuses = async () => {
    try {
      const response = await api.post('/control/windows/update-statuses');

      if (response.success) {
        toast.success((response as any).message || 'Window statuses updated');
        await fetchWindows();
      } else {
        toast.error(response.error?.message || 'Failed to update window statuses');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update window statuses');
    }
  };

  const handleReleaseFinalGrades = async (projectType: ProjectType) => {
    if (releasedGrades[projectType]) {
      toast.error(`Final grades for ${projectType} have already been released.`);
      return;
    }

    setGradeReleaseProjectType(projectType);
    setShowGradeReleaseModal(true);
  };

  const confirmGradeRelease = async () => {
    if (!gradeReleaseProjectType) return;

    try {
      const response = await api.post('/control/grades/release-final', { projectType: gradeReleaseProjectType });

      if (response.success) {
        toast.success((response as any).message || 'Final grades released successfully');
        setReleasedGrades(prev => ({ ...prev, [gradeReleaseProjectType]: true }));
        fetchStats();
      } else {
        toast.error(response.error?.message || 'Failed to release final grades');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to release final grades');
    }
  };

  // Handle delete window request
  const handleDeleteWindow = (window: any) => {
    setWindowToDelete(window);
    setShowDeleteModal(true);
  };

  // Confirm delete window
  const confirmDeleteWindow = async () => {
    if (!windowToDelete) return;

    try {
      const response = await api.delete(`/windows/${windowToDelete._id}`);

      if (response.success) {
        toast.success('Window deleted successfully');
        await fetchWindows();
        setShowDeleteModal(false);
        setWindowToDelete(null);
      } else {
        toast.error(response.error?.message || 'Failed to delete window');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete window');
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setWindowToDelete(null);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Control Panel</h1>
          <p className="text-gray-600">
            Manage windows, release grades, and view statistics
          </p>
        </motion.div>

        {/* Statistics */}
        {statsLoading ? (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg animate-pulse">
                    <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold">{stats.overview.totalProjects}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Groups</p>
                  <p className="text-2xl font-bold">{stats.overview.totalGroups}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Applications</p>
                  <p className="text-2xl font-bold">{stats.overview.pendingApplications}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Graded Submissions</p>
                  <p className="text-2xl font-bold">{stats.overview.gradedSubmissions}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Grade Release Section - Only show when grade release window is active */}
        {isGradeReleaseWindowActive() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6" />
              Release Final Grades
            </h2>
            <p className="text-gray-600 mb-6">
              Release final grades to students. This will make all completed evaluations (CLA-1, CLA-2, CLA-3, and External) visible to students as their total score out of 100.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {(['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((projectType) => {
                const isReleased = releasedGrades[projectType];
                return (
                  <div key={projectType} className="p-6 border-2 border-gray-200 rounded-lg text-center">
                    <h3 className="font-bold text-lg mb-4">{projectType}</h3>
                    <button
                      onClick={() => handleReleaseFinalGrades(projectType)}
                      disabled={isReleased}
                      className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                        isReleased 
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isReleased ? 'Grades Released' : 'Release Final Grades'}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      {isReleased 
                        ? 'Final grades have been released to students' 
                        : 'Students will see their total score out of 100'
                      }
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Windows Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Manage Windows
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpdateWindowStatuses}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                title="Update window statuses based on current time"
              >
                <RefreshCw className="w-5 h-5" />
                Update Statuses
              </button>
              <button
                onClick={() => setShowCreationModeModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Window
              </button>
            </div>
          </div>

          {/* Window Form */}
          {showWindowForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">
                  {editingWindow ? 'Edit Window' : 
                   creationMode === 'bulk' ? 'Create Entire Semester Windows' : 'Create New Window'}
                </h3>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Current Time: </span>
                  <span>{new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</span>
                </div>
              </div>

              {/* Mode indicator */}
              {!editingWindow && (
                <div className={`mb-4 p-3 border rounded-lg ${
                  creationMode === 'bulk' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className={`w-5 h-5 mt-0.5 ${
                        creationMode === 'bulk' ? 'text-green-400' : 'text-blue-400'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className={`text-sm font-medium ${
                        creationMode === 'bulk' ? 'text-green-800' : 'text-blue-800'
                      }`}>
                        {creationMode === 'bulk' ? 'Bulk Creation Mode' : 'Individual Creation Mode'}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        creationMode === 'bulk' ? 'text-green-700' : 'text-blue-700'
                      }`}>
                        {creationMode === 'bulk' ? (
                          <>
                            This will create all windows for the entire semester in the correct sequence:
                            <br />• IDP Proposal → UROP/CAPSTONE Proposals → All Applications
                            <br />• CLA-1 → CLA-2 → CLA-3 → External (each with submission + assessment)
                            <br />• Grade Release for all project types
                          </>
                        ) : (
                          <>
                            • <strong>Select project types first</strong> to enable window type selection
                            <br />• Only one active or upcoming window allowed per combination
                            <br />• Workflow sequence enforced: Proposal → Application → Submission → Assessment → Grade Release
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {creationMode === 'bulk' && !editingWindow ? (
                /* Bulk Creation Form */
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Semester Start Date *
                      </label>
                      <input
                        type="date"
                        value={windowForm.bulkSettings.semesterStartDate}
                        onChange={(e) => setWindowForm({
                          ...windowForm,
                          bulkSettings: {
                            ...windowForm.bulkSettings,
                            semesterStartDate: e.target.value
                          }
                        })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        IDP proposal will start on this date
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-white">
                    <h4 className="font-medium text-gray-900 mb-4">Duration Settings (in days)</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-medium">Proposal Duration</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={windowForm.bulkSettings.proposalDuration}
                          onChange={(e) => setWindowForm({
                            ...windowForm,
                            bulkSettings: {
                              ...windowForm.bulkSettings,
                              proposalDuration: parseInt(e.target.value) || 7
                            }
                          })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium">Application Duration</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={windowForm.bulkSettings.applicationDuration}
                          onChange={(e) => setWindowForm({
                            ...windowForm,
                            bulkSettings: {
                              ...windowForm.bulkSettings,
                              applicationDuration: parseInt(e.target.value) || 14
                            }
                          })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium">Submission Duration</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={windowForm.bulkSettings.submissionDuration}
                          onChange={(e) => setWindowForm({
                            ...windowForm,
                            bulkSettings: {
                              ...windowForm.bulkSettings,
                              submissionDuration: parseInt(e.target.value) || 7
                            }
                          })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium">Assessment Duration</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={windowForm.bulkSettings.assessmentDuration}
                          onChange={(e) => setWindowForm({
                            ...windowForm,
                            bulkSettings: {
                              ...windowForm.bulkSettings,
                              assessmentDuration: parseInt(e.target.value) || 14
                            }
                          })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium">Grade Release Duration</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={windowForm.bulkSettings.gradeReleaseDuration}
                          onChange={(e) => setWindowForm({
                            ...windowForm,
                            bulkSettings: {
                              ...windowForm.bulkSettings,
                              gradeReleaseDuration: parseInt(e.target.value) || 3
                            }
                          })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium">Gap Between Phases</label>
                        <input
                          type="number"
                          min="0"
                          max="7"
                          value={windowForm.bulkSettings.gapBetweenPhases}
                          onChange={(e) => setWindowForm({
                            ...windowForm,
                            bulkSettings: {
                              ...windowForm.bulkSettings,
                              gapBetweenPhases: parseInt(e.target.value) || 1
                            }
                          })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Individual Creation Form - existing form content */

              <div className="grid md:grid-cols-2 gap-4">
                {/* Window Types Multi-Select */}
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    Window Type{editingWindow ? '' : 's'} * 
                    {!editingWindow && <span className="text-xs text-gray-500 ml-1">(Select one or more)</span>}
                  </label>
                  {editingWindow ? (
                    // Single select for editing
                    <select
                      value={windowForm.windowTypes[0] || ''}
                      onChange={(e) => setWindowForm({ ...windowForm, windowTypes: [e.target.value as WindowType] })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="proposal">Proposal</option>
                      <option value="application">Application</option>
                      <option value="submission">Submission</option>
                      <option value="assessment">Assessment</option>
                      <option value="grade_release">Grade Release</option>
                    </select>
                  ) : (
                    // Multi-select for creating with workflow validation
                    <div className="space-y-2">
                      {windowForm.projectTypes.length === 0 ? (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                          <p className="text-sm text-gray-500">
                            Please select project type(s) first to enable window type selection
                          </p>
                        </div>
                      ) : (
                        (['proposal', 'application', 'submission', 'assessment', 'grade_release'] as WindowType[]).map((type) => {
                          // Check workflow availability
                          const isWorkflowAvailable = windowForm.projectTypes.some(projectType => 
                            isWindowTypeAvailable(type, projectType)
                          );
                          
                          // Check for existing windows for each selected project type
                          let existingWindowInfo = null;
                          let hasExistingWindow = false;
                          
                          for (const projectType of windowForm.projectTypes) {
                            const checkResult = isWindowCombinationDisabled(type, projectType, 
                              type === 'assessment' ? windowForm.assessmentType as AssessmentType : undefined
                            );
                            if (checkResult.disabled) {
                              hasExistingWindow = true;
                              existingWindowInfo = checkResult;
                              break;
                            }
                          }
                          
                          const isDisabled = !isWorkflowAvailable || hasExistingWindow;
                          
                          return (
                            <label 
                              key={type} 
                              className={`flex items-center space-x-2 ${
                                isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={windowForm.windowTypes.includes(type)}
                                disabled={isDisabled}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setWindowForm({ 
                                      ...windowForm, 
                                      windowTypes: [...windowForm.windowTypes, type] 
                                    });
                                  } else {
                                    setWindowForm({ 
                                      ...windowForm, 
                                      windowTypes: windowForm.windowTypes.filter(t => t !== type) 
                                    });
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                              <span className={`text-sm capitalize ${isDisabled ? 'text-gray-400' : ''}`}>
                                {type.replace('_', ' ')}
                                {!isWorkflowAvailable && (
                                  <span className="text-xs text-red-500 ml-1">
                                    (Prerequisites missing)
                                  </span>
                                )}
                                {hasExistingWindow && existingWindowInfo && (
                                  <span className="text-xs text-amber-600 ml-1">
                                    ({existingWindowInfo.reason})
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Project Types Multi-Select */}
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    Project Type{editingWindow ? '' : 's'} * 
                    {!editingWindow && <span className="text-xs text-gray-500 ml-1">(Select one or more)</span>}
                  </label>
                  {editingWindow ? (
                    // Single select for editing
                    <select
                      value={windowForm.projectTypes[0] || ''}
                      onChange={(e) => setWindowForm({ ...windowForm, projectTypes: [e.target.value as ProjectType] })}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="IDP">IDP</option>
                      <option value="UROP">UROP</option>
                      <option value="CAPSTONE">CAPSTONE</option>
                    </select>
                  ) : (
                    // Multi-select for creating
                    <div className="space-y-2">
                      {(['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((type) => {
                        // Check for existing windows for each selected window type
                        let existingWindowInfo = null;
                        let hasExistingWindow = false;
                        
                        if (windowForm.windowTypes.length > 0) {
                          for (const windowType of windowForm.windowTypes) {
                            const checkResult = isWindowCombinationDisabled(windowType, type, 
                              windowType === 'assessment' ? windowForm.assessmentType as AssessmentType : undefined
                            );
                            if (checkResult.disabled) {
                              hasExistingWindow = true;
                              existingWindowInfo = checkResult;
                              break;
                            }
                          }
                        }
                        
                        return (
                          <label 
                            key={type} 
                            className={`flex items-center space-x-2 ${
                              hasExistingWindow ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={windowForm.projectTypes.includes(type)}
                              disabled={hasExistingWindow}
                              onChange={(e) => handleProjectTypeChange(type, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className={`text-sm ${hasExistingWindow ? 'text-gray-400' : ''}`}>
                              {type}
                              {hasExistingWindow && existingWindowInfo && (
                                <span className="text-xs text-amber-600 ml-1">
                                  ({existingWindowInfo.reason})
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Assessment Type - Show if any selected window type needs it */}
                {(windowForm.windowTypes.some(type => type === 'submission' || type === 'assessment')) && (
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium">
                      Assessment Type
                      {!editingWindow && (
                        <span className="text-xs text-gray-500 ml-1">
                          (Only available types shown based on workflow)
                        </span>
                      )}
                    </label>
                    {editingWindow ? (
                      <select
                        value={windowForm.assessmentType}
                        onChange={(e) => setWindowForm({ ...windowForm, assessmentType: e.target.value as AssessmentType })}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Select...</option>
                        <option value="CLA-1">CLA-1</option>
                        <option value="CLA-2">CLA-2</option>
                        <option value="CLA-3">CLA-3</option>
                        <option value="External">External</option>
                      </select>
                    ) : (
                      <select
                        value={windowForm.assessmentType}
                        onChange={(e) => setWindowForm({ ...windowForm, assessmentType: e.target.value as AssessmentType })}
                        className="w-full px-4 py-2 border rounded-lg"
                      >
                        <option value="">Select...</option>
                        {/* Show only available assessment types based on workflow */}
                        {windowForm.projectTypes.length > 0 && 
                          windowForm.windowTypes.some(type => type === 'submission' || type === 'assessment') && 
                          (() => {
                            // Get intersection of available types across all selected project types
                            const availableTypes = windowForm.projectTypes.reduce((acc, projectType) => {
                              const typesForProject = windowForm.windowTypes
                                .filter(wt => wt === 'submission' || wt === 'assessment')
                                .flatMap(wt => getAvailableAssessmentTypes(wt, projectType));
                              
                              if (acc.length === 0) return typesForProject;
                              return acc.filter(type => typesForProject.includes(type));
                            }, [] as string[]);
                            
                            return [...new Set(availableTypes)].map(type => (
                              <option key={type} value={type}>{type}</option>
                            ));
                          })()
                        }
                      </select>
                    )}
                  </div>
                )}

                {/* Date and Time Configuration */}
                <div className="md:col-span-2">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Date & Time Configuration</h4>
                      {!editingWindow && windowForm.windowTypes.length > 1 || windowForm.projectTypes.length > 1 ? (
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="dateMode"
                              checked={windowForm.useCommonDates}
                              onChange={() => setWindowForm({ ...windowForm, useCommonDates: true })}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">Common dates</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="dateMode"
                              checked={!windowForm.useCommonDates}
                              onChange={() => setWindowForm({ ...windowForm, useCommonDates: false })}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">Individual dates</span>
                          </label>
                        </div>
                      ) : null}
                    </div>

                    {/* Common Dates Section */}
                    {(editingWindow || windowForm.useCommonDates) && (
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <SmartDateTimeInput
                          value={windowForm.startDate}
                          onChange={(value) => setWindowForm({ ...windowForm, startDate: value })}
                          label={windowForm.useCommonDates ? "Common Start Date" : "Start Date"}
                        />
                        <SmartDateTimeInput
                          value={windowForm.endDate}
                          onChange={(value) => setWindowForm({ ...windowForm, endDate: value })}
                          label={windowForm.useCommonDates ? "Common End Date" : "End Date"}
                          minDateTime={windowForm.startDate}
                        />
                      </div>
                    )}

                    {/* Individual Dates Section */}
                    {!editingWindow && !windowForm.useCommonDates && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium text-gray-700">Individual Window Dates</h5>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={copyCommonDatesToAll}
                              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              disabled={!windowForm.startDate || !windowForm.endDate}
                            >
                              Copy from common dates
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const combinations = getWindowCombinations();
                                const newIndividualDates: Record<string, { startDate: string; endDate: string }> = {};
                                
                                // Set sequential dates (each window starts when the previous ends)
                                const baseStart = new Date();
                                baseStart.setHours(baseStart.getHours() + 1); // Start 1 hour from now
                                
                                combinations.forEach(({ key }, index) => {
                                  const startTime = new Date(baseStart.getTime() + (index * 7 * 24 * 60 * 60 * 1000)); // 1 week apart
                                  const endTime = new Date(startTime.getTime() + (5 * 24 * 60 * 60 * 1000)); // 5 days duration
                                  
                                  const formatToLocalDateTime = (date: Date) => {
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const hours = String(date.getHours()).padStart(2, '0');
                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                                  };
                                  
                                  newIndividualDates[key] = {
                                    startDate: formatToLocalDateTime(startTime),
                                    endDate: formatToLocalDateTime(endTime)
                                  };
                                });
                                
                                setWindowForm(prev => ({
                                  ...prev,
                                  individualDates: newIndividualDates
                                }));
                                
                                toast.success('Sequential dates set (1 week apart, 5 days each)');
                              }}
                              className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Quick Fill Sequential
                            </button>
                          </div>
                        </div>
                        
                        {getWindowCombinations().map(({ key, label }) => (
                          <div key={key} className="border rounded p-3 bg-white">
                            <h6 className="text-sm font-medium text-gray-800 mb-3 capitalize">{label}</h6>
                            <div className="grid md:grid-cols-2 gap-3">
                              <SmartDateTimeInput
                                value={windowForm.individualDates[key]?.startDate || ''}
                                onChange={(value) => updateIndividualDate(key, 'startDate', value)}
                                label="Start Date"
                              />
                              <SmartDateTimeInput
                                value={windowForm.individualDates[key]?.endDate || ''}
                                onChange={(value) => updateIndividualDate(key, 'endDate', value)}
                                label="End Date"
                                minDateTime={windowForm.individualDates[key]?.startDate}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* Show preview of windows to be created */}
              {!editingWindow && windowForm.windowTypes.length > 0 && windowForm.projectTypes.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Windows to be created: {windowForm.windowTypes.length * windowForm.projectTypes.length}
                  </h4>
                  <div className="text-xs text-blue-600 space-y-2">
                    {getWindowCombinations().map(({ key, windowType, projectType }) => {
                      const individualDate = windowForm.individualDates[key];
                      const hasIndividualDate = !windowForm.useCommonDates && individualDate?.startDate && individualDate?.endDate;
                      
                      return (
                        <div key={key} className="border-l-2 border-blue-300 pl-2">
                          <div className="font-medium">
                            • {windowType.replace('_', ' ')} - {projectType}
                            {windowForm.assessmentType && (windowType === 'submission' || windowType === 'assessment') && 
                              ` (${windowForm.assessmentType})`
                            }
                          </div>
                          {hasIndividualDate && (
                            <div className="text-blue-500 ml-2 mt-1">
                              {new Date(individualDate.startDate).toLocaleString('en-IN', { 
                                dateStyle: 'short', 
                                timeStyle: 'short',
                                hour12: true 
                              })} → {new Date(individualDate.endDate).toLocaleString('en-IN', { 
                                dateStyle: 'short', 
                                timeStyle: 'short',
                                hour12: true 
                              })}
                            </div>
                          )}
                          {windowForm.useCommonDates && windowForm.startDate && windowForm.endDate && (
                            <div className="text-blue-500 ml-2 mt-1">
                              {new Date(windowForm.startDate).toLocaleString('en-IN', { 
                                dateStyle: 'short', 
                                timeStyle: 'short',
                                hour12: true 
                              })} → {new Date(windowForm.endDate).toLocaleString('en-IN', { 
                                dateStyle: 'short', 
                                timeStyle: 'short',
                                hour12: true 
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Date mode indicator */}
                  <div className="mt-3 pt-2 border-t border-blue-200">
                    <span className="text-xs font-medium text-blue-700">
                      {windowForm.useCommonDates ? '📅 Using common dates for all windows' : '🗓️ Using individual dates per window'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleCreateWindow}
                  disabled={loading}
                  className={`px-6 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 ${
                    creationMode === 'bulk' ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                >
                  {loading ? (
                    editingWindow ? 'Updating...' : 
                    creationMode === 'bulk' ? 'Creating Semester...' : 'Creating...'
                  ) : (
                    editingWindow ? 'Update Window' : 
                    creationMode === 'bulk' ? 'Create All Semester Windows' : 'Create Window'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowWindowForm(false);
                    setEditingWindow(null);
                    setShowCreationModeModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Windows List */}
          <div className="space-y-6">
            {/* Show/Hide Inactive Windows Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Window Display Options:</span>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Show inactive windows</span>
                  {/* Toggle Switch */}
                  <button
                    onClick={() => setShowInactiveWindows(!showInactiveWindows)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      showInactiveWindows ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showInactiveWindows ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {windows.filter(w => {
                  const now = new Date();
                  const start = new Date(w.startDate);
                  const end = new Date(w.endDate);
                  const isActive = now >= start && now <= end;
                  const hasEnded = now > end;
                  return showInactiveWindows || isActive || !hasEnded;
                }).length} of {windows.length} windows shown
              </div>
            </div>

            {/* Windows organized by project type */}
            {['IDP', 'UROP', 'CAPSTONE'].map(projectType => {
              const projectWindows = windows
                .filter(window => {
                  const now = new Date();
                  const start = new Date(window.startDate);
                  const end = new Date(window.endDate);
                  const isActive = now >= start && now <= end;
                  const hasEnded = now > end;
                  
                  // Filter by project type and visibility
                  return window.projectType === projectType && 
                         (showInactiveWindows || isActive || !hasEnded);
                })
                .sort((a, b) => {
                  const now = new Date();
                  const aStart = new Date(a.startDate);
                  const aEnd = new Date(a.endDate);
                  const bStart = new Date(b.startDate);
                  const bEnd = new Date(b.endDate);
                  
                  const aIsActive = now >= aStart && now <= aEnd;
                  const aIsUpcoming = now < aStart;
                  
                  const bIsActive = now >= bStart && now <= bEnd;
                  const bIsUpcoming = now < bStart;
                  
                  // Priority: Active > Upcoming > Inactive
                  const aStatus = aIsActive ? 3 : aIsUpcoming ? 2 : 1;
                  const bStatus = bIsActive ? 3 : bIsUpcoming ? 2 : 1;
                  
                  if (aStatus !== bStatus) {
                    return bStatus - aStatus; // Higher status first
                  }
                  
                  // Within same status, sort by start time (latest first - descending order)
                  return bStart.getTime() - aStart.getTime();
                });

              if (projectWindows.length === 0) return null;

              return (
                <div key={projectType} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-gray-800">{projectType}</h2>
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                      {projectWindows.length} window{projectWindows.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {projectWindows.map((window) => {
                      const now = new Date();
                      const start = new Date(window.startDate);
                      const end = new Date(window.endDate);
                      const isActive = now >= start && now <= end;
                      const hasEnded = now > end;
                      const isUpcoming = now < start;
                      
                      return (
                        <div
                          key={window._id}
                          className={`p-4 border-2 rounded-lg ${
                            isActive 
                              ? 'border-green-500 bg-green-50' 
                              : hasEnded 
                              ? 'border-gray-300 bg-gray-50' 
                              : 'border-blue-300 bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold capitalize">
                                  {window.windowType.replace('_', ' ')}
                                </h3>
                                {window.assessmentType && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                    {window.assessmentType}
                                  </span>
                                )}
                                {isActive && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Active
                                  </span>
                                )}
                                {hasEnded && (
                                  <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-sm font-medium">
                                    Inactive
                                  </span>
                                )}
                                {isUpcoming && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                    Upcoming
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>Start: {new Date(window.startDate).toLocaleString('en-IN', { 
                                  dateStyle: 'medium', 
                                  timeStyle: 'short',
                                  hour12: true 
                                })}</p>
                                <p>End: {new Date(window.endDate).toLocaleString('en-IN', { 
                                  dateStyle: 'medium', 
                                  timeStyle: 'short',
                                  hour12: true 
                                })}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditWindow(window)}
                                disabled={hasEnded}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                title={hasEnded ? 'Cannot edit ended window' : 'Edit window'}
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteWindow(window)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                title="Delete window"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {windows.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No windows created yet. Create your first window to get started.
              </p>
            )}
          </div>
        </motion.div>

        {/* Creation Mode Selection Modal */}
        {showCreationModeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Choose Window Creation Method</h3>
                  <p className="text-sm text-gray-500">Select how you want to create windows</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Individual Creation */}
                <div 
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    creationMode === 'individual' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCreationMode('individual')}
                >
                  <div className="flex items-center mb-4">
                    <input
                      type="radio"
                      name="creationMode"
                      checked={creationMode === 'individual'}
                      onChange={() => setCreationMode('individual')}
                      className="text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <h4 className="text-lg font-semibold text-gray-900">Create Individually</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Create specific windows manually with full control over timing and selection.
                  </p>
                  <div className="text-xs text-gray-500">
                    <strong>Best for:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Creating specific windows as needed</li>
                      <li>Custom timing requirements</li>
                      <li>Partial semester scheduling</li>
                      <li>Testing or special cases</li>
                    </ul>
                  </div>
                </div>

                {/* Bulk Creation */}
                <div 
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    creationMode === 'bulk' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCreationMode('bulk')}
                >
                  <div className="flex items-center mb-4">
                    <input
                      type="radio"
                      name="creationMode"
                      checked={creationMode === 'bulk'}
                      onChange={() => setCreationMode('bulk')}
                      className="text-green-600 focus:ring-green-500 mr-3"
                    />
                    <h4 className="text-lg font-semibold text-gray-900">Create Entire Semester</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Automatically create all windows for the entire semester with proper sequencing.
                  </p>
                  <div className="text-xs text-gray-500">
                    <strong>Best for:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Beginning of semester setup</li>
                      <li>Complete workflow automation</li>
                      <li>Consistent timing across all projects</li>
                      <li>Set-and-forget scheduling</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-amber-800">Sequential Window Order</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      {creationMode === 'bulk' ? (
                        <>
                          <strong>Bulk creation follows this sequence:</strong><br />
                          1. IDP Proposal → 2. UROP/CAPSTONE Proposals → 3. All Applications → 
                          4. CLA-1 (Submission + Assessment) → 5. CLA-2 → 6. CLA-3 → 7. External → 8. Grade Release
                        </>
                      ) : (
                        <>
                          <strong>Individual creation enforces:</strong><br />
                          • Proposal must come first • Application after proposal ends • 
                          Submissions in CLA order • Assessments after submissions • Grade release at the end
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreationModeModal(false);
                    setCreationMode('individual');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCreationModeModal(false);
                    setShowWindowForm(true);
                  }}
                  className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    creationMode === 'individual' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Continue with {creationMode === 'individual' ? 'Individual' : 'Bulk'} Creation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Window</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-amber-800">Critical Warning</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Deleting this window will <strong>permanently remove it from the database</strong> and may affect the workflow validation logic that has been implemented. 
                        This could impact the sequential window creation process and break the established workflow dependencies.
                      </p>
                    </div>
                  </div>
                </div>
                
                {windowToDelete && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600 mb-2">You are about to delete:</p>
                    <p className="font-medium text-gray-900">
                      {windowToDelete.windowType.replace('_', ' ')} - {windowToDelete.projectType}
                      {windowToDelete.assessmentType && ` (${windowToDelete.assessmentType})`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(windowToDelete.startDate).toLocaleString('en-IN', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short',
                        hour12: true 
                      })} - {new Date(windowToDelete.endDate).toLocaleString('en-IN', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short',
                        hour12: true 
                      })}
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-600">
                  <strong>Please continue only if you are fully aware of the implications.</strong> 
                  If you are unsure about the impact on the workflow system, please contact the developer before proceeding.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteWindow}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Yes, Delete Window
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grade Release Confirmation Modal */}
        <ConfirmationModal
          isOpen={showGradeReleaseModal}
          onClose={() => {
            setShowGradeReleaseModal(false);
            setGradeReleaseProjectType(null);
          }}
          onConfirm={confirmGradeRelease}
          title="Release Final Grades"
          message={`Are you sure you want to release FINAL grades for ${gradeReleaseProjectType}?`}
          details="This will make all completed evaluations (CLA-1, CLA-2, CLA-3, and External) visible to students. This action cannot be undone."
          confirmText="Yes, Release Grades"
          cancelText="Cancel"
          type="warning"
        />
      </div>
    </div>
  );
}