import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Award, Users, FileText, Plus, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

type WindowType = 'proposal' | 'application' | 'submission' | 'assessment' | 'grade_release';
type ProjectType = 'IDP' | 'UROP' | 'CAPSTONE';
type AssessmentType = 'CLA-1' | 'CLA-2' | 'CLA-3' | 'External';

export function ControlPanel() {
  const [windows, setWindows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [releasedGrades, setReleasedGrades] = useState<Record<ProjectType, boolean>>({
    'IDP': false,
    'UROP': false,
    'CAPSTONE': false
  });
  const [showWindowForm, setShowWindowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingWindow, setEditingWindow] = useState<any>(null);

  const [windowForm, setWindowForm] = useState({
    windowType: 'proposal' as WindowType,
    projectType: 'IDP' as ProjectType,
    assessmentType: '' as AssessmentType | '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchWindows();
    fetchStats();
    checkReleasedGrades();
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
      windowType: window.windowType,
      projectType: window.projectType,
      assessmentType: window.assessmentType || '',
      startDate: formatToLocalDateTime(startDate),
      endDate: formatToLocalDateTime(endDate)
    });
    setShowWindowForm(true);
  };

  const handleCreateWindow = async () => {
    if (!windowForm.startDate || !windowForm.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    if (new Date(windowForm.endDate) <= new Date(windowForm.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      // Log the raw input values
      console.log('Raw form values:', {
        startDate: windowForm.startDate,
        endDate: windowForm.endDate
      });
      
      // Convert datetime-local values to ISO strings
      // datetime-local format: "2025-12-08T06:01" (no timezone info)
      // JavaScript interprets this as LOCAL time, then toISOString converts to UTC
      const startDateObj = new Date(windowForm.startDate);
      const endDateObj = new Date(windowForm.endDate);
      
      console.log('Parsed as Date objects:', {
        start: startDateObj.toString(),
        end: endDateObj.toString()
      });
      
      const startDate = startDateObj.toISOString();
      const endDate = endDateObj.toISOString();
      
      console.log('Converted to ISO (UTC):', {
        startDate,
        endDate
      });
      
      const payload = {
        windowType: windowForm.windowType,
        projectType: windowForm.projectType,
        assessmentType: windowForm.assessmentType || undefined,
        startDate,
        endDate
      };
      
      console.log(editingWindow ? 'Updating window' : 'Creating window', 'with payload:', payload);
      
      const response = editingWindow
        ? await api.put(`/control/windows/${editingWindow._id}`, payload)
        : await api.post('/control/windows', payload);

      console.log('Response:', response);
      
      if (response.success) {
        toast.success(editingWindow ? 'Window updated successfully' : 'Window created successfully');
        console.log('Window saved, updated data:', response.data);
        setShowWindowForm(false);
        setEditingWindow(null);
        // Refresh windows list
        await fetchWindows();
        // Reset form
        setWindowForm({
          windowType: 'proposal',
          projectType: 'IDP',
          assessmentType: '',
          startDate: '',
          endDate: ''
        });
      } else {
        console.error('Server error:', response.error);
        toast.error(response.error?.message || `Failed to ${editingWindow ? 'update' : 'create'} window`);
      }
    } catch (error: any) {
      console.error('Request error:', error);
      toast.error(error.message || 'Failed to create window');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWindow = async (windowId: string) => {
    if (!confirm('Are you sure you want to delete this window?')) {
      return;
    }

    try {
      const response = await api.delete(`/control/windows/${windowId}`);

      if (response.success) {
        toast.success('Window deleted successfully');
        fetchWindows();
      } else {
        toast.error(response.error?.message || 'Failed to delete window');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete window');
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
        {stats && (
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
            <button
              onClick={() => setShowWindowForm(!showWindowForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Window
            </button>
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
                <div>
                  <label className="block mb-2 text-sm font-medium">Window Type *</label>
                  <select
                    value={windowForm.windowType}
                    onChange={(e) => setWindowForm({ ...windowForm, windowType: e.target.value as WindowType })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="proposal">Proposal</option>
                    <option value="application">Application</option>
                    <option value="submission">Submission</option>
                    <option value="assessment">Assessment</option>
                    <option value="grade_release">Grade Release</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Project Type *</label>
                  <select
                    value={windowForm.projectType}
                    onChange={(e) => setWindowForm({ ...windowForm, projectType: e.target.value as ProjectType })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="IDP">IDP</option>
                    <option value="UROP">UROP</option>
                    <option value="CAPSTONE">CAPSTONE</option>
                  </select>
                </div>

                {(windowForm.windowType === 'submission' || windowForm.windowType === 'assessment') && (
                  <div>
                    <label className="block mb-2 text-sm font-medium">Assessment Type</label>
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
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm font-medium">Start Date *</label>
                  <input
                    type="datetime-local"
                    value={windowForm.startDate}
                    onChange={(e) => setWindowForm({ ...windowForm, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">End Date *</label>
                  <input
                    type="datetime-local"
                    value={windowForm.endDate}
                    onChange={(e) => setWindowForm({ ...windowForm, endDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

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
                    setWindowForm({
                      windowType: 'proposal',
                      projectType: 'IDP',
                      assessmentType: '',
                      startDate: '',
                      endDate: ''
                    });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Windows List */}
          <div className="space-y-4">
            {windows.map((window) => {
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
                          {window.windowType.replace('_', ' ')} - {window.projectType}
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
                        onClick={() => handleDeleteWindow(window._id)}
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
