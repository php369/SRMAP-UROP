import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, GlowButton } from '../../components/ui';
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations';
import { apiClient } from '../../utils/api';

interface Course {
  _id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  semester: number;
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  status: 'active' | 'inactive';
  createdAt: string;
}

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    credits: 3,
    department: '',
    semester: 1,
    type: 'IDP' as 'IDP' | 'UROP' | 'CAPSTONE'
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/admin/courses');

      if (response.success && response.data) {
        setCourses(response.data.courses || []);
      } else {
        setError(response.error?.message || 'Failed to fetch courses');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    setCreating(true);
    setError(null);

    try {
      const response = await apiClient.post('/admin/courses', formData);

      if (response.success) {
        await fetchCourses();
        setShowCreateModal(false);
        setFormData({
          code: '',
          name: '',
          credits: 3,
          department: '',
          semester: 1,
          type: 'IDP'
        });
      } else {
        setError(response.error?.message || 'Failed to create course');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'IDP': return 'bg-primary/20 text-primary border-primary/30';
      case 'UROP': return 'bg-secondary/20 text-secondary border-secondary/30';
      case 'CAPSTONE': return 'bg-info/20 text-info border-info/30';
      default: return 'bg-white/10 text-textSecondary border-white/20';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active'
      ? 'bg-success/20 text-success border-success/30'
      : 'bg-white/10 text-textSecondary border-white/20';
  };

  return (
    <div className="min-h-screen p-8">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Course Management</h1>
            <p className="text-textSecondary">Manage courses and curriculum</p>
          </div>
          <GlowButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            glow
          >
            Create Course
          </GlowButton>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div variants={staggerItem}>
            <GlassCard variant="elevated" className="p-4 bg-error/10 border-error/30">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-error">{error}</p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Courses Table */}
        <motion.div variants={staggerItem}>
          <GlassCard variant="elevated" className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-textSecondary mt-4">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-textSecondary">No courses found. Create your first course to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Code</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Credits</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Department</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Semester</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course._id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-text font-mono text-sm">{course.code}</td>
                        <td className="py-3 px-4 text-text">{course.name}</td>
                        <td className="py-3 px-4 text-textSecondary">{course.credits}</td>
                        <td className="py-3 px-4 text-textSecondary text-sm">{course.department}</td>
                        <td className="py-3 px-4 text-textSecondary">{course.semester}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getTypeBadgeColor(course.type)}`}>
                            {course.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeColor(course.status)}`}>
                            {course.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface border border-white/10 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-text mb-4">Create New Course</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Course Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CS101"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Course Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Introduction to Programming"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Credits</label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                    min={1}
                    max={10}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Computer Science"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Semester</label>
                  <input
                    type="number"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                    min={1}
                    max={8}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="IDP">IDP</option>
                    <option value="UROP">UROP</option>
                    <option value="CAPSTONE">CAPSTONE</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      code: '',
                      name: '',
                      credits: 3,
                      department: '',
                      semester: 1,
                      type: 'IDP'
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 text-text rounded-lg hover:bg-white/10 transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={creating || !formData.code || !formData.name || !formData.department}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
