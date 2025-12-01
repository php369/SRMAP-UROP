import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, GlowButton } from '../../components/ui';
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations';
import { apiClient } from '../../utils/api';

interface Cohort {
  _id: string;
  name: string;
  year: number;
  semester: number;
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  status: 'active' | 'inactive';
  createdAt: string;
}

export function AdminCohortsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    department: 'Computer Science'
  });

  useEffect(() => {
    fetchCohorts();
  }, []);

  const fetchCohorts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/admin/cohorts');

      if (response.success && response.data) {
        setCohorts(response.data.cohorts || []);
      } else {
        setError(response.error?.message || 'Failed to fetch cohorts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch cohorts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCohort = async () => {
    setCreating(true);
    setError(null);

    try {
      const response = await apiClient.post('/admin/cohorts', formData);

      if (response.success) {
        await fetchCohorts();
        setShowCreateModal(false);
        setFormData({
          name: '',
          year: new Date().getFullYear(),
          department: 'Computer Science'
        });
      } else {
        setError(response.error?.message || 'Failed to create cohort');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create cohort');
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
            <h1 className="text-3xl font-bold text-text mb-2">Cohort Management</h1>
            <p className="text-textSecondary">Manage student cohorts and groups</p>
          </div>
          <GlowButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            glow
          >
            Create Cohort
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

        {/* Cohorts Grid */}
        <motion.div variants={staggerItem}>
          {loading ? (
            <GlassCard variant="elevated" className="p-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-textSecondary mt-4">Loading cohorts...</p>
              </div>
            </GlassCard>
          ) : cohorts.length === 0 ? (
            <GlassCard variant="elevated" className="p-12">
              <div className="text-center">
                <p className="text-textSecondary">No cohorts found. Create your first cohort to get started.</p>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cohorts.map((cohort) => (
                <GlassCard key={cohort._id} variant="elevated" className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text">{cohort.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(cohort.status)}`}>
                      {cohort.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textSecondary">Year:</span>
                      <span className="text-text font-medium">{cohort.year}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textSecondary">Semester:</span>
                      <span className="text-text font-medium">{cohort.semester}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-textSecondary">Type:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getTypeBadgeColor(cohort.type)}`}>
                        {cohort.type}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-textSecondary">
                    Created: {new Date(cohort.createdAt).toLocaleDateString()}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>

        {/* Create Cohort Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface border border-white/10 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-text mb-4">Create New Cohort</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Cohort Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., CS 2024 Spring IDP"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min={2020}
                    max={2030}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics and Communication">Electronics and Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                    <option value="Biotechnology">Biotechnology</option>
                    <option value="Management Studies">Management Studies</option>
                    <option value="Liberal Arts">Liberal Arts</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      name: '',
                      year: new Date().getFullYear(),
                      department: 'Computer Science'
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-white/5 text-text rounded-lg hover:bg-white/10 transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCohort}
                  disabled={creating || !formData.name}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Cohort'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
