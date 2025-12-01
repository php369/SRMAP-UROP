import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Award, TrendingUp, Users, FileText, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

type WindowType = 'proposal' | 'application' | 'submission' | 'assessment' | 'grade_release';
type ProjectType = 'IDP' | 'UROP' | 'CAPSTONE';
type AssessmentType = 'A1' | 'A2' | 'A3' | 'External';

export function ControlPanel() {
  const [windows, setWindows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showWindowForm, setShowWindowForm] = useState(false);
  const [loading, setLoading] = useState(false);

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
  }, []);

  const fetchWindows = async () => {
    try {
      const response = await fetch('/api/v1/control/windows');
      const data = await response.json();
      setWindows(data);
    } catch (error) {
      console.error('Error fetching windows:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/control/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
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
      const response = await fetch('/api/v1/control/windows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...windowForm,
          assessmentType: windowForm.assessmentType || undefined
        })
      });

      if (response.ok) {
        toast.success('Window created successfully');
        setShowWindowForm(false);
        fetchWindows();
        // Reset form
        setWindowForm({
          windowType: 'proposal',
          projectType: 'IDP',
          assessmentType: '',
          startDate: '',
          endDate: ''
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create window');
      }
    } catch (error) {
      toast.error('Failed to create window');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWindow = async (windowId: string) => {
    if (!confirm('Are you sure you want to delete this window?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/control/windows/${windowId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Window deleted successfully');
        fetchWindows();
      } else {
        toast.error('Failed to delete window');
      }
    } catch (error) {
      toast.error('Failed to delete window');
    }
  };

  const handleReleaseGrades = async (projectType: ProjectType, assessmentType?: AssessmentType) => {
    if (!confirm(`Are you sure you want to release grades for ${projectType}${assessmentType ? ` - ${assessmentType}` : ''}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/v1/control/grades/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectType, assessmentType })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchStats();
      } else {
        toast.error('Failed to release grades');
      }
    } catch (error) {
      toast.error('Failed to release grades');
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

        {/* Grade Release Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-6 h-6" />
            Release Grades
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((projectType) => (
              <div key={projectType} className="p-4 border rounded-lg">
                <h3 className="font-bold mb-3">{projectType}</h3>
                <div className="space-y-2">
                  {(['A1', 'A2', 'A3', 'External'] as AssessmentType[]).map((assessmentType) => (
                    <button
                      key={assessmentType}
                      onClick={() => handleReleaseGrades(projectType, assessmentType)}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Release {assessmentType}
                    </button>
                  ))}
                  <button
                    onClick={() => handleReleaseGrades(projectType)}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    Release All
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

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
              <h3 className="font-bold mb-4">Create New Window</h3>
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
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="A3">A3</option>
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
                  {loading ? 'Creating...' : 'Create Window'}
                </button>
                <button
                  onClick={() => setShowWindowForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Windows List */}
          <div className="space-y-4">
            {windows.map((window) => (
              <div
                key={window._id}
                className={`p-4 border-2 rounded-lg ${
                  window.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold capitalize">
                        {window.windowType.replace('_', ' ')} - {window.projectType}
                      </h3>
                      {window.assessmentType && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {window.assessmentType}
                        </span>
                      )}
                      {window.isActive && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Start: {new Date(window.startDate).toLocaleString()}</p>
                      <p>End: {new Date(window.endDate).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWindow(window._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

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
