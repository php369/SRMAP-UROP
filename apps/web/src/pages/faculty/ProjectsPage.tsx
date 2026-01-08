import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard, GlowButton } from '../../components/ui';
import toast from 'react-hot-toast';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import { api } from '../../utils/api';

interface Project {
  _id: string;
  projectId: string;
  title: string;
  brief: string;
  prerequisites?: string;
  department: string;
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  status: 'draft' | 'published' | 'frozen' | 'assigned';
  facultyId: string;
  facultyName: string;
  facultyIdNumber: string;
  createdAt: string;
}

export function FacultyProjectsPage() {
  const { user } = useAuth();
  const { isProposalOpen, loading: windowLoading, windows } = useWindowStatus();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [initializing, setInitializing] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    brief: '',
    prerequisites: '',
    department: user?.profile?.department || '',
    projectType: 'IDP' as 'IDP' | 'UROP' | 'CAPSTONE'
  });

  // Check if proposal window is open for current project type
  const canCreateProject = isProposalOpen(formData.projectType);

  // Get all active proposal windows to determine which project types are available
  const activeProposalWindows = windows.filter(
    w => w.windowType === 'proposal' && isProposalOpen(w.projectType)
  );

  // Helper to check if a project type has an active proposal window
  const isProjectTypeAvailable = (type: 'IDP' | 'UROP' | 'CAPSTONE') => {
    return activeProposalWindows.some(w => w.projectType === type);
  };

  useEffect(() => {
    const initializeData = async () => {
      setInitializing(true);
      try {
        await fetchProjects();
      } catch (error) {
        console.error('Error initializing projects data:', error);
      } finally {
        setInitializing(false);
      }
    };

    initializeData();
  }, []);

  // Auto-select first available project type when windows load
  useEffect(() => {
    if (!windowLoading && activeProposalWindows.length > 0) {
      const currentTypeAvailable = isProjectTypeAvailable(formData.projectType);
      if (!currentTypeAvailable) {
        // Set to first available type
        const firstAvailable = activeProposalWindows[0]?.projectType;
        if (firstAvailable) {
          setFormData(prev => ({ ...prev, projectType: firstAvailable }));
        }
      }
    }
  }, [windowLoading, activeProposalWindows.length]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/projects/faculty');
      if (response.success && response.data) {
        const projectsData = Array.isArray(response.data) ? response.data : [];
        setProjects(projectsData);
        console.log('Projects fetched:', projectsData.length);
      } else {
        setProjects([]);
        console.log('No projects found');
      }
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      // Don't show error toast for rate limiting
      if (!error.message?.includes('Too many requests')) {
        toast.error('Failed to fetch projects');
      }
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (projects.length >= 5 && !editingProject) {
      toast.error('You can only create up to 5 projects');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        brief: formData.brief,
        prerequisites: formData.prerequisites,
        type: formData.projectType,
        department: formData.department
      };

      const response = editingProject
        ? await api.put(`/projects/${editingProject._id}`, payload)
        : await api.post('/projects', payload);

      if (response.success) {
        toast.success(editingProject ? 'Project updated successfully' : 'Project created successfully');
        setShowModal(false);
        resetForm();
        fetchProjects();
      } else {
        toast.error(response.error?.message || 'Failed to save project');
      }
    } catch (error: any) {
      console.error('Failed to save project:', error);
      toast.error(error.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      brief: project.brief,
      prerequisites: project.prerequisites || '',
      department: project.department,
      projectType: project.type
    });
    setShowModal(true);
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await api.delete(`/projects/${projectId}`);

      if (response.success) {
        toast.success('Project deleted successfully');
        fetchProjects();
      } else {
        toast.error(response.error?.message || 'Failed to delete project');
      }
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      toast.error(error.message || 'Failed to delete project');
    }
  };

  const resetForm = () => {
    // Default to first available open project type, fallback to IDP
    const firstAvailableType = activeProposalWindows[0]?.projectType || 'IDP';

    setFormData({
      title: '',
      brief: '',
      prerequisites: '',
      department: user?.profile?.department || '',
      projectType: firstAvailableType
    });
    setEditingProject(null);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-500/20 dark:bg-gray-500/30 text-gray-700 dark:text-gray-300 border-gray-500/40 dark:border-gray-500/30',
      published: 'bg-blue-500/20 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 border-blue-500/40 dark:border-blue-500/30',
      frozen: 'bg-yellow-500/20 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300 border-yellow-500/40 dark:border-yellow-500/30',
      assigned: 'bg-green-500/20 dark:bg-green-500/30 text-green-700 dark:text-green-300 border-green-500/40 dark:border-green-500/30'
    };

    const icons = {
      draft: Clock,
      published: Eye,
      frozen: Clock,
      assigned: CheckCircle
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.draft}`}>
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text">My Projects</h1>
            <p className="text-textSecondary mt-1">
              Manage your project proposals ({projects.length}/5)
            </p>
          </div>
          <GlowButton
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            disabled={projects.length >= 5 || !canCreateProject || windowLoading}
            variant="primary"
            glow
            title={!canCreateProject ? 'Proposal window is not open' : projects.length >= 5 ? 'Maximum projects reached' : 'Create new project'}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </GlowButton>
        </div>

        {/* Window Status Alert */}
        {!windowLoading && !canCreateProject && (
          <GlassCard className="p-4 border-l-4 border-warning">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text mb-1">
                  Project Proposal Window Not Open
                </h3>
                <p className="text-sm text-textSecondary">
                  The proposal window is not currently open. You cannot create new projects at this time. Please contact the coordinator for more information.
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Projects List */}
        {(initializing || windowLoading) ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : projects.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">No Projects Yet</h3>
              <p className="text-textSecondary mb-6">
                Create your first project proposal to get started
              </p>
              <GlowButton
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                disabled={!canCreateProject || windowLoading}
                variant="primary"
                glow
              >
                Create Project
              </GlowButton>
              {!canCreateProject && (
                <p className="text-sm text-warning mt-2">
                  Proposal window is not open
                </p>
              )}
            </div>
          </GlassCard>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-6 hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-text">{project.title}</h3>
                        {getStatusBadge(project.status)}
                        <span className="px-2 py-1 bg-blue-100 dark:bg-secondary/30 text-blue-800 dark:text-secondary text-xs font-medium rounded-lg border border-blue-300 dark:border-secondary/30">
                          {project.type}
                        </span>
                      </div>
                      <p className="text-textSecondary text-sm mb-3">{project.brief}</p>
                      {project.prerequisites && (
                        <div className="mb-3">
                          <span className="text-xs font-medium text-text">Prerequisites: </span>
                          <span className="text-xs text-textSecondary">{project.prerequisites}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-textSecondary">
                        <span>ID: {project.projectId}</span>
                        <span>•</span>
                        <span>{project.department}</span>
                        <span>•</span>
                        <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(project)}
                        disabled={project.status === 'assigned' || !isProposalOpen(project.type)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isProposalOpen(project.type) ? 'Proposal window has closed' : project.status === 'assigned' ? 'Cannot edit assigned project' : 'Edit project'}
                      >
                        <Edit2 className="w-4 h-4 text-text" />
                      </button>
                      <button
                        onClick={() => handleDelete(project._id)}
                        disabled={project.status === 'assigned' || !isProposalOpen(project.type)}
                        className="p-2 hover:bg-error/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isProposalOpen(project.type) ? 'Proposal window has closed' : project.status === 'assigned' ? 'Cannot delete assigned project' : 'Delete project'}
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <div className="bg-surface border border-border/50 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
                <h2 className="text-2xl font-bold text-text mb-6">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Window Status Warning in Modal */}
                  {!editingProject && !canCreateProject && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Proposal window is currently closed</p>
                        <p className="text-xs mt-1">You can still draft the project, but it cannot be published until the window opens.</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Project Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['IDP', 'UROP', 'CAPSTONE'] as const).map((type) => {
                        const isAvailable = isProjectTypeAvailable(type);
                        const isDisabled = editingProject !== null || !isAvailable;

                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => isAvailable && setFormData({ ...formData, projectType: type })}
                            disabled={isDisabled}
                            title={!isAvailable ? `${type} proposal window is not open` : ''}
                            className={`px-4 py-2 rounded-lg transition-all border-2 disabled:opacity-50 disabled:cursor-not-allowed ${formData.projectType === type
                                ? 'bg-blue-100 border-blue-500 text-blue-700 font-semibold'
                                : isAvailable
                                  ? 'bg-surface border-border text-text hover:bg-hover'
                                  : 'bg-surface/50 border-border/50 text-textSecondary/50 bg-stripe-disabled'
                              }`}
                          >
                            {type}
                            {!isAvailable && <span className="ml-1 text-xs">🔒</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Brief Description *
                    </label>
                    <textarea
                      value={formData.brief}
                      onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      rows={4}
                      required
                      maxLength={1000}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Prerequisites (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.prerequisites}
                      onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="e.g., Python, Machine Learning basics"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 bg-surface hover:bg-hover border border-border rounded-xl text-text transition-all font-medium"
                    >
                      Cancel
                    </button>
                    <GlowButton
                      type="submit"
                      loading={loading}
                      disabled={loading}
                      variant="primary"
                      glow
                      className="flex-1"
                    >
                      {editingProject ? 'Update Project' : 'Create Project'}
                    </GlowButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
