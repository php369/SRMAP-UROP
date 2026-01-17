import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertCircle, CalendarClock, BookOpen, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import { api } from '../../utils/api';
import { Project } from './types';
import { ProjectCard } from './components/ProjectCard';
import { ProjectForm } from './components/ProjectForm';
import { PhaseEmptyState } from './components/PhaseEmptyState';
import { ProjectDetailsModal } from './components/ProjectDetailsModal';
import { ActiveProposalEmptyState } from './components/ActiveProposalEmptyState';

export function FacultyProjectsPage() {
  const { user } = useAuth();
  const { isProposalOpen, loading: windowLoading, windows } = useWindowStatus();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Get active proposal windows
  // Memoize to prevent re-renders if the underlying windows object changes reference but not content
  const activeProposalWindows = useMemo(() => windows.filter(
    w => w.windowType === 'proposal' && isProposalOpen(w.projectType)
  ), [windows, isProposalOpen]);

  const availableTypes = useMemo(() => activeProposalWindows.map(w => w.projectType), [activeProposalWindows]);
  const hasActiveWindow = activeProposalWindows.length > 0;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/projects/faculty');
      if (response.success && response.data) {
        const projectsData = Array.isArray(response.data) ? response.data : [];
        setProjects(projectsData);
      } else {
        setProjects([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      if (!error.message?.includes('Too many requests')) {
        toast.error('Failed to fetch projects');
      }
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, [fetchProjects]);

  const handleCreateProject = async (data: any) => {
    if (projects.length >= 5 && !editingProject) {
      toast.error('You can only create up to 5 projects');
      return;
    }

    try {
      const payload = {
        title: data.title,
        brief: data.brief,
        prerequisites: data.prerequisites, // Fix: Changed typo in previous implementation plan if any
        type: data.projectType,
        department: data.department
      };

      const response = editingProject
        ? await api.put(`/projects/${editingProject._id}`, payload)
        : await api.post('/projects', payload);

      if (response.success) {
        toast.success(editingProject ? 'Project updated successfully' : 'Project created successfully');
        setShowModal(false);
        setEditingProject(null);
        fetchProjects();
      } else {
        toast.error(response.error?.message || 'Failed to save project');
      }
    } catch (error: any) {
      console.error('Failed to save project:', error);
      toast.error(error.message || 'Failed to save project');
    }
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

  const handleOpenCreateModal = () => {
    if (!hasActiveWindow) {
      // Just a safeguard, button should be disabled
      toast.error('Proposal window is closed');
      return;
    }
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  // Loading Skeleton
  if (initializing || windowLoading) {
    return (
      <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!hasActiveWindow && projects.length === 0 && !initializing && !windowLoading && !loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center -m-8 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] overflow-hidden bg-transparent">
        <PhaseEmptyState />
        <ProjectForm
          open={showModal}
          onOpenChange={setShowModal}
          project={editingProject}
          onSubmit={handleCreateProject}
          loading={loading}
          userDepartment={user?.profile?.department}
          availableTypes={availableTypes}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full min-h-full relative">
      <div className="flex-1 w-full flex flex-col p-6 space-y-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col"
        >
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
                Project Proposals
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Manage your research projects for student applications
              </p>
            </div>

            <Button
              onClick={handleOpenCreateModal}
              disabled={projects.length >= 5 || !hasActiveWindow}
              className={`
                shadow-lg transition-transform hover:scale-105 active:scale-95
                ${hasActiveWindow
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200 dark:shadow-none'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                }
              `}
            >
              {hasActiveWindow ? (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </>
              ) : (
                <>
                  <CalendarClock className="w-4 h-4 mr-2" />
                  Window Closed
                </>
              )}
            </Button>
          </div>

          {/* Status Banners */}
          <AnimatePresence>



          </AnimatePresence>

          {/* Content */}
          <div className={cn(
            "w-full flex flex-col",
            (hasActiveWindow || projects.length > 0) ? "mt-8 flex-1" : "items-center justify-center flex-1"
          )}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
              </div>
            ) : projects.length === 0 ? (
              !hasActiveWindow ? (
                <PhaseEmptyState />
              ) : (
                <ActiveProposalEmptyState onCreate={handleOpenCreateModal} />
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={(project) => {
                      setViewingProject(project);
                      setShowDetailsModal(true);
                    }}
                    isProposalOpen={hasActiveWindow}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <ProjectForm
        open={showModal}
        onOpenChange={setShowModal}
        project={editingProject}
        onSubmit={handleCreateProject}
        loading={loading}
        userDepartment={user?.profile?.department}
        availableTypes={availableTypes}
      />

      <ProjectDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        project={viewingProject}
      />
    </div>
  );
}
