import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Send } from 'lucide-react';
import { Project } from '../../types';
import { ProjectService, CreateProjectData, UpdateProjectData } from '../../services/projectService';
import { GlowButton, GlassCard } from '../../components/ui';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';

interface ProjectFormData extends CreateProjectData {}

export function FacultyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    brief: '',
    description: '',
    type: 'IDP',
    department: '',
    prerequisites: '',
    capacity: 1
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'pending' | 'published' | 'archived'>('all');

  const { user } = useAuthStore();

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const response = await ProjectService.getFacultyProjects(filters);
      
      if (response.success && response.data) {
        setProjects(response.data);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await ProjectService.createProject(formData);
      
      if (response.success && response.data) {
        setProjects(prev => [response.data!, ...prev]);
        setShowCreateForm(false);
        resetForm();
      } else {
        setError('Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      const updateData: UpdateProjectData = { ...formData };
      const response = await ProjectService.updateProject(editingProject._id, updateData);
      
      if (response.success && response.data) {
        setProjects(prev => prev.map(p => 
          p._id === editingProject._id ? response.data! : p
        ));
        setEditingProject(null);
        resetForm();
      } else {
        setError('Failed to update project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await ProjectService.deleteProject(projectId);
      
      if (response.success) {
        setProjects(prev => prev.filter(p => p._id !== projectId));
      } else {
        setError('Failed to delete project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleSubmitProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to submit this project for approval? You will not be able to edit it after submission.')) return;

    try {
      const response = await ProjectService.submitProject(projectId);
      
      if (response.success && response.data) {
        setProjects(prev => prev.map(p => 
          p._id === projectId ? response.data! : p
        ));
      } else {
        setError('Failed to submit project for approval');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit project for approval');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      brief: '',
      description: '',
      type: 'IDP',
      department: user?.profile?.department || '',
      prerequisites: '',
      capacity: 1
    });
  };

  const startEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      brief: project.brief,
      description: project.description || '',
      type: project.type,
      department: project.department,
      prerequisites: project.prerequisites || '',
      capacity: project.capacity || 1
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setShowCreateForm(false);
    resetForm();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-yellow-500';
      case 'pending': return 'text-orange-500';
      case 'published': return 'text-green-500';
      case 'archived': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return '📝';
      case 'pending': return '⏳';
      case 'published': return '✅';
      case 'archived': return '📦';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-textSecondary">Loading projects...</p>
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
            <h1 className="text-3xl font-bold text-textPrimary mb-2">My Projects</h1>
            <p className="text-textSecondary">
              Create and manage your research projects
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Projects</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending Approval</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <GlowButton onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </GlowButton>
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

        {/* Create/Edit Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold text-textPrimary mb-4">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              
              <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-1">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    >
                      <option value="IDP">IDP</option>
                      <option value="UROP">UROP</option>
                      <option value="CAPSTONE">CAPSTONE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-1">
                      Department *
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-1">
                    Brief Description *
                  </label>
                  <textarea
                    value={formData.brief}
                    onChange={(e) => setFormData(prev => ({ ...prev, brief: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                    rows={3}
                    required
                    maxLength={500}
                  />
                  <p className="text-xs text-textSecondary mt-1">
                    {formData.brief.length}/500 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-1">
                    Detailed Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                    rows={4}
                    maxLength={2000}
                  />
                  <p className="text-xs text-textSecondary mt-1">
                    {formData.description?.length || 0}/2000 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-1">
                    Prerequisites
                  </label>
                  <textarea
                    value={formData.prerequisites}
                    onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                    rows={2}
                    maxLength={1000}
                  />
                  <p className="text-xs text-textSecondary mt-1">
                    {formData.prerequisites?.length || 0}/1000 characters
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 text-textSecondary hover:text-textPrimary transition-colors"
                  >
                    Cancel
                  </button>
                  <GlowButton type="submit">
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </GlowButton>
                </div>
              </form>
            </GlassCard>
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
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-textPrimary mb-2">No Projects Yet</h3>
              <p className="text-textSecondary mb-6">
                Create your first project to get started with the portal.
              </p>
              <GlowButton onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </GlowButton>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <GlassCard className="p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getStatusIcon(project.status)}</span>
                        <span className={cn('text-sm font-medium', getStatusColor(project.status))}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                        {project.type}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-textPrimary mb-2 line-clamp-2">
                      {project.title}
                    </h3>

                    <p className="text-textSecondary text-sm mb-4 line-clamp-3 flex-grow">
                      {project.brief}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs text-textSecondary">
                        <span>Department:</span>
                        <span>{project.department}</span>
                      </div>
                      {project.capacity && (
                        <div className="flex items-center justify-between text-xs text-textSecondary">
                          <span>Capacity:</span>
                          <span>{project.capacity} students</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-textSecondary">
                        <span>Created:</span>
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(project)}
                          className={cn(
                            "p-2 transition-colors",
                            project.status === 'draft' 
                              ? "text-textSecondary hover:text-accent" 
                              : "text-gray-400 cursor-not-allowed"
                          )}
                          title={project.status === 'draft' ? "Edit project" : "Cannot edit submitted project"}
                          disabled={project.status !== 'draft'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project._id)}
                          className={cn(
                            "p-2 transition-colors",
                            project.status === 'draft' 
                              ? "text-textSecondary hover:text-red-400" 
                              : "text-gray-400 cursor-not-allowed"
                          )}
                          title={project.status === 'draft' ? "Delete project" : "Cannot delete submitted project"}
                          disabled={project.status !== 'draft'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {project.status === 'draft' && (
                        <button
                          onClick={() => handleSubmitProject(project._id)}
                          className="flex items-center space-x-1 text-xs text-accent hover:text-accent/80 transition-colors"
                          title="Submit for approval"
                        >
                          <Send className="w-3 h-3" />
                          <span>Submit</span>
                        </button>
                      )}
                      
                      {project.status === 'pending' && (
                        <div className="flex items-center space-x-1 text-xs text-orange-500">
                          <span className="animate-pulse">⏳</span>
                          <span>Awaiting Approval</span>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}