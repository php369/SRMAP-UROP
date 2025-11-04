import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Filter, CheckSquare, Square } from 'lucide-react';
import { Project } from '../../types';
import { ProjectService } from '../../services/projectService';
import { GlowButton, GlassCard } from '../../components/ui';

export function CoordinatorApprovalsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<'all' | 'IDP' | 'UROP' | 'CAPSTONE'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    loadPendingProjects();
    loadDepartments();
  }, [typeFilter, departmentFilter]);

  const loadPendingProjects = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (typeFilter !== 'all') {
        filters.type = typeFilter;
      }
      
      if (departmentFilter !== 'all') {
        filters.department = departmentFilter;
      }

      const response = await ProjectService.getPendingProjects(filters);
      
      if (response.success && response.data) {
        setProjects(response.data);
        // Clear selection when projects change
        setSelectedProjects(new Set());
      } else {
        setError('Failed to load pending projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending projects');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await ProjectService.getDepartments();
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const handleApproveProject = async (projectId: string) => {
    try {
      const response = await ProjectService.approveProject(projectId);
      
      if (response.success) {
        setProjects(prev => prev.filter(p => p._id !== projectId));
        setSelectedProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
      } else {
        setError('Failed to approve project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve project');
    }
  };

  const handleRejectProject = async (projectId: string, reason?: string) => {
    try {
      const response = await ProjectService.rejectProject(projectId, reason);
      
      if (response.success) {
        setProjects(prev => prev.filter(p => p._id !== projectId));
        setSelectedProjects(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
        setShowRejectModal(null);
        setRejectReason('');
      } else {
        setError('Failed to reject project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject project');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedProjects.size === 0) return;

    if (!confirm(`Are you sure you want to approve ${selectedProjects.size} selected projects?`)) return;

    try {
      const projectIds = Array.from(selectedProjects);
      const response = await ProjectService.bulkApproveProjects(projectIds);
      
      if (response.success) {
        setProjects(prev => prev.filter(p => !selectedProjects.has(p._id)));
        setSelectedProjects(new Set());
      } else {
        setError('Failed to perform bulk approval');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform bulk approval');
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map(p => p._id)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-textSecondary">Loading pending projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-textPrimary mb-2">Project Approvals</h1>
            <p className="text-textSecondary">
              Review and approve pending project submissions
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-textSecondary" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Types</option>
                <option value="IDP">IDP</option>
                <option value="UROP">UROP</option>
                <option value="CAPSTONE">CAPSTONE</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedProjects.size > 0 && (
              <GlowButton onClick={handleBulkApprove}>
                <Check className="w-4 h-4 mr-2" />
                Approve Selected ({selectedProjects.size})
              </GlowButton>
            )}
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-200 text-sm mt-1"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Projects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {projects.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-textPrimary mb-2">No Pending Projects</h3>
              <p className="text-textSecondary">
                All projects have been reviewed. Check back later for new submissions.
              </p>
            </GlassCard>
          ) : (
            <GlassCard className="overflow-hidden">
              {/* Table Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center space-x-2 text-textSecondary hover:text-textPrimary transition-colors"
                  >
                    {selectedProjects.size === projects.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span className="text-sm">Select All</span>
                  </button>
                  <span className="text-sm text-textSecondary">
                    {projects.length} pending projects
                  </span>
                </div>
              </div>

              {/* Projects */}
              <div className="divide-y divide-border">
                {projects.map((project) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => toggleProjectSelection(project._id)}
                        className="mt-1 text-textSecondary hover:text-textPrimary transition-colors"
                      >
                        {selectedProjects.has(project._id) ? (
                          <CheckSquare className="w-5 h-5 text-accent" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-textPrimary mb-1">
                              {project.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-textSecondary">
                              <span className="bg-accent/20 text-accent px-2 py-1 rounded-full">
                                {project.type}
                              </span>
                              <span>{project.department}</span>
                              <span>by {project.facultyName}</span>
                              <span>Capacity: {project.capacity || 1}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleApproveProject(project._id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setShowRejectModal(project._id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-textSecondary mb-3 line-clamp-2">
                          {project.brief}
                        </p>

                        {project.description && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-textPrimary mb-1">Description:</h4>
                            <p className="text-sm text-textSecondary line-clamp-3">
                              {project.description}
                            </p>
                          </div>
                        )}

                        {project.prerequisites && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-textPrimary mb-1">Prerequisites:</h4>
                            <p className="text-sm text-textSecondary line-clamp-2">
                              {project.prerequisites}
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-textSecondary">
                          Submitted: {new Date(project.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}
        </motion.div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-textPrimary mb-4">
                Reject Project
              </h3>
              <p className="text-textSecondary mb-4">
                Are you sure you want to reject this project? You can optionally provide a reason.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)"
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent mb-4"
                rows={3}
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-textSecondary hover:text-textPrimary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRejectProject(showRejectModal, rejectReason)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Reject Project
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}