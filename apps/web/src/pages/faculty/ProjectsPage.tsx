import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard, GlowButton } from '../../components/ui';
import toast from 'react-hot-toast';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    brief: '',
    prerequisites: '',
    department: user?.profile?.department || '',
    projectType: 'IDP' as 'IDP' | 'UROP' | 'CAPSTONE'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/v1/projects/faculty`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        }
      });
      const result = await response.json();
      if (result.success && result.data) {
        setProjects(result.data);
      } else {
        setProjects([]);
      }
    } catch (error) {
      toast.error('Failed to fetch projects');
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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const url = editingProject
        ? `${baseUrl}/api/v1/projects/${editingProject._id}`
        : `${baseUrl}/api/v1/projects`;

      const response = await fetch(url, {
        method: editingProject ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        },
        body: JSON.stringify({
          title: formData.title,
          brief: formData.brief,
          prerequisites: formData.prerequisites,
          type: formData.projectType,
          department: formData.department
        })
      });

      if (response.ok) {
        toast.success(editingProject ? 'Project updated successfully' : 'Project created successfully');
        setShowModal(false);
        resetForm();
        fetchProjects();
      } else {
        const error = await response.json();
        toast.error(error.error?.message || 'Failed to save project');
      }
    } catch (error) {
      toast.error('Failed to save project');
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/v1/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        }
      });

      if (response.ok) {
        toast.success('Project deleted successfully');
        fetchProjects();
      } else {
        toast.error('Failed to delete project');
      }
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      brief: '',
      prerequisites: '',
      department: user?.profile?.department || '',
      projectType: 'IDP'
    });
    setEditingProject(null);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      published: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      frozen: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      assigned: 'bg-green-500/20 text-green-300 border-green-500/30'
    };

    const icons = {
      draft: Clock,
      published: Eye,
      frozen: Clock,
      assigned: CheckCircle
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${styles[status as keyof typeof styles] || styles.draft}`}>
        <Icon className="w-3 h-3" />
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
            disabled={projects.length >= 5}
            variant="primary"
            glow
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </GlowButton>
        </div>

        {/* Projects List */}
        {loading && projects.length === 0 ? (
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
                variant="primary"
                glow
              >
                Create Project
              </GlowButton>
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
                        <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs font-medium rounded-lg border border-secondary/30">
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
                        disabled={project.status === 'assigned'}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit project"
                      >
                        <Edit2 className="w-4 h-4 text-text" />
                      </button>
                      <button
                        onClick={() => handleDelete(project._id)}
                        disabled={project.status === 'assigned'}
                        className="p-2 hover:bg-error/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete project"
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
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['IDP', 'UROP', 'CAPSTONE'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, projectType: type })}
                          className={`px-4 py-2 rounded-lg transition-all border-2 ${formData.projectType === type
                            ? 'bg-blue-100 border-blue-500 text-blue-700 font-semibold'
                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brief Description *
                    </label>
                    <textarea
                      value={formData.brief}
                      onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      required
                      maxLength={1000}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prerequisites (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.prerequisites}
                      onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Python, Machine Learning basics"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-lg text-gray-700 transition-all font-medium"
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
