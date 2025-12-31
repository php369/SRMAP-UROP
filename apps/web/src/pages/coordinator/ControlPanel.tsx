import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Award, Users, FileText, Plus, Edit2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { SmartDateTimeInput } from '../../components/ui/SmartDateTimeInput';

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
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [editingWindow, setEditingWindow] = useState<any>(null);

  const [windowForm, setWindowForm] = useState({
    windowTypes: ['proposal'] as WindowType[],
    projectTypes: ['IDP'] as ProjectType[],
    assessmentType: '' as AssessmentType | '',
    startDate: '',
    endDate: '',
    useCommonDates: true, // Toggle between common and individual dates
    individualDates: {} as Record<string, { startDate: string; endDate: string }> // Individual dates for each combination
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
      individualDates: {}
    });
    setShowWindowForm(true);
  };

  const handleCreateWindow = async () => {
    // Validate window and project type selections
    if (windowForm.windowTypes.length === 0 || windowForm.projectTypes.length === 0) {
      toast.error('Please select at least one window type and one project type');
      return;
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
      windowTypes: ['proposal'],
      projectTypes: ['IDP'],
      assessmentType: '',
      startDate: '',
      endDate: '',
      useCommonDates: true,
      individualDates: {}
    });
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

    if (!confirm(`Are you sure you want to release FINAL grades for ${projectType}? This will make all completed evaluations (CLA-1, CLA-2, CLA-3, and External) visible to students.`)) {
      return;
    }

    try {
      const response = await api.post('/control/grades/release-final', { projectType });

      if (response.success) {
        toast.success((response as any).message || 'Final grades released successfully');
        setReleasedGrades(prev => ({ ...prev, [projectType]: true }));
        fetchStats();
      } else {
        toast.error(response.error?.message || 'Failed to release final grades');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to release final grades');
    }
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
                onClick={() => setShowWindowForm(!showWindowForm)}
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
                <h3 className="font-bold">{editingWindow ? 'Edit Window' : 'Create New Window'}</h3>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Current Time: </span>
                  <span>{new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</span>
                </div>
              </div>
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
                      {(['proposal', 'application', 'submission', 'assessment', 'grade_release'] as WindowType[]).map((type) => {
                        // Check if this window type is available for any selected project type
                        const isAvailable = windowForm.projectTypes.length === 0 || 
                          windowForm.projectTypes.some(projectType => 
                            isWindowTypeAvailable(type, projectType)
                          );
                        
                        return (
                          <label 
                            key={type} 
                            className={`flex items-center space-x-2 ${
                              isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={windowForm.windowTypes.includes(type)}
                              disabled={!isAvailable}
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
                            <span className={`text-sm capitalize ${!isAvailable ? 'text-gray-400' : ''}`}>
                              {type.replace('_', ' ')}
                              {!isAvailable && (
                                <span className="text-xs text-red-500 ml-1">
                                  (Prerequisites missing)
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
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
                      {(['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((type) => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={windowForm.projectTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWindowForm({ 
                                  ...windowForm, 
                                  projectTypes: [...windowForm.projectTypes, type] 
                                });
                              } else {
                                setWindowForm({ 
                                  ...windowForm, 
                                  projectTypes: windowForm.projectTypes.filter(t => t !== type) 
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
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
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? (editingWindow ? 'Updating...' : 'Creating...') : (editingWindow ? 'Update Window' : 'Create Window')}
                </button>
                <button
                  onClick={() => {
                    setShowWindowForm(false);
                    setEditingWindow(null);
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
                  
                  // Within same status, sort by start time (latest first)
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
      </div>
    </div>
  );
}