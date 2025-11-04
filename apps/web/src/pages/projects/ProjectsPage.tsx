import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Project, ProjectFilter, User } from '../../types';
import { ProjectMasonryGrid } from '../../components/projects/ProjectMasonryGrid';
import { ProjectFilters } from '../../components/projects/ProjectFilters';
import { KanbanBoard } from '../../components/projects/KanbanBoard';
import { GlowButton, GlassCard } from '../../components/ui';
import { cn } from '../../utils/cn';

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@srmap.edu.in',
    role: 'student',
    profile: { department: 'Computer Science', year: 3 },
    preferences: { theme: 'dark', notifications: true },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@srmap.edu.in',
    role: 'student',
    profile: { department: 'Computer Science', year: 2 },
    preferences: { theme: 'light', notifications: true },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Carol Davis',
    email: 'carol@srmap.edu.in',
    role: 'faculty',
    profile: { department: 'Computer Science' },
    preferences: { theme: 'dark', notifications: true },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'AI-Powered Student Portal',
    description: 'Developing an intelligent student portal with machine learning capabilities for personalized learning experiences and automated administrative tasks.',
    status: 'in-progress',
    priority: 'high',
    category: 'Web Development',
    tags: ['React', 'TypeScript', 'AI', 'Machine Learning', 'Education'],
    assignedTo: [mockUsers[0], mockUsers[1]],
    createdBy: '3',
    createdByName: 'Carol Davis',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    dueDate: '2024-03-15T00:00:00Z',
    progress: 65,
    artifacts: [],
    timeline: [],
    collaborators: [],
    coverImage: '/images/ai-portal.jpg',
    color: '#3B82F6',
  },
  {
    id: '2',
    title: 'Mobile Learning App',
    description: 'Cross-platform mobile application for interactive learning with offline capabilities and gamification elements.',
    status: 'review',
    priority: 'medium',
    category: 'Mobile Development',
    tags: ['React Native', 'Mobile', 'Gamification', 'Offline'],
    assignedTo: [mockUsers[1]],
    createdBy: '3',
    createdByName: 'Carol Davis',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-25T00:00:00Z',
    dueDate: '2024-02-28T00:00:00Z',
    progress: 90,
    artifacts: [],
    timeline: [],
    collaborators: [],
    color: '#10B981',
  },
  {
    id: '3',
    title: 'Research Data Analytics',
    description: 'Advanced analytics platform for processing and visualizing research data with interactive dashboards and automated reporting.',
    status: 'done',
    priority: 'high',
    category: 'Data Science',
    tags: ['Python', 'Data Analytics', 'Visualization', 'Research'],
    assignedTo: [mockUsers[0], mockUsers[2]],
    createdBy: '3',
    createdByName: 'Carol Davis',
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    completedAt: '2024-01-15T00:00:00Z',
    progress: 100,
    artifacts: [],
    timeline: [],
    collaborators: [],
    color: '#8B5CF6',
  },
  {
    id: '4',
    title: 'IoT Campus Monitoring',
    description: 'Internet of Things solution for monitoring campus facilities including air quality, energy consumption, and security systems.',
    status: 'backlog',
    priority: 'low',
    category: 'IoT',
    tags: ['IoT', 'Sensors', 'Monitoring', 'Arduino', 'Raspberry Pi'],
    assignedTo: [mockUsers[1], mockUsers[2]],
    createdBy: '3',
    createdByName: 'Carol Davis',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    dueDate: '2024-06-30T00:00:00Z',
    progress: 10,
    artifacts: [],
    timeline: [],
    collaborators: [],
    color: '#F59E0B',
  },
  {
    id: '5',
    title: 'Blockchain Certificate System',
    description: 'Decentralized system for issuing and verifying academic certificates using blockchain technology.',
    status: 'in-progress',
    priority: 'urgent',
    category: 'Blockchain',
    tags: ['Blockchain', 'Certificates', 'Security', 'Ethereum'],
    assignedTo: [mockUsers[0]],
    createdBy: '3',
    createdByName: 'Carol Davis',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-28T00:00:00Z',
    dueDate: '2024-02-15T00:00:00Z',
    progress: 45,
    artifacts: [],
    timeline: [],
    collaborators: [],
    color: '#EF4444',
  },
  {
    id: '6',
    title: 'Virtual Reality Lab',
    description: 'Immersive VR environment for conducting virtual experiments and simulations in various scientific disciplines.',
    status: 'review',
    priority: 'medium',
    category: 'VR/AR',
    tags: ['VR', 'Unity', 'Education', 'Simulation', '3D'],
    assignedTo: [mockUsers[2]],
    createdBy: '3',
    createdByName: 'Carol Davis',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z',
    dueDate: '2024-04-01T00:00:00Z',
    progress: 75,
    artifacts: [],
    timeline: [],
    collaborators: [],
    color: '#06B6D4',
  },
];

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [filters, setFilters] = useState<ProjectFilter>({});
  const [viewMode, setViewMode] = useState<'masonry' | 'kanban' | 'list'>('masonry');

  // Extract filter options from projects
  const filterOptions = useMemo(() => {
    const categories = [...new Set(projects.map(p => p.category))];
    const tags = [...new Set(projects.flatMap(p => p.tags))];
    const assignees = [...new Set(projects.flatMap(p => p.assignedTo))]
      .map(user => ({ id: user.id, name: user.name }));

    return { categories, tags, assignees };
  }, [projects]);

  // Filter projects based on current filters
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Status filter
      if (filters.status?.length && !filters.status.includes(project.status)) {
        return false;
      }

      // Priority filter
      if (filters.priority?.length && !filters.priority.includes(project.priority)) {
        return false;
      }

      // Category filter
      if (filters.category?.length && !filters.category.includes(project.category)) {
        return false;
      }

      // Tags filter
      if (filters.tags?.length && !filters.tags.some(tag => project.tags.includes(tag))) {
        return false;
      }

      // Assigned to filter
      if (filters.assignedTo?.length && !filters.assignedTo.some(userId => 
        project.assignedTo.some(user => user.id === userId)
      )) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableText = [
          project.title,
          project.description,
          project.category,
          ...project.tags,
          project.createdByName,
          ...project.assignedTo.map(u => u.name),
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const projectDate = new Date(project.createdAt);
        if (filters.dateRange.start && projectDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && projectDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }

      return true;
    });
  }, [projects, filters]);

  const handleStatusChange = (projectId: string, status: Project['status']) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, status, updatedAt: new Date().toISOString() }
        : project
    ));
  };

  const handleEdit = (project: Project) => {
    console.log('Edit project:', project);
    // TODO: Implement edit functionality
  };

  const handleDelete = (projectId: string) => {
    setProjects(prev => prev.filter(project => project.id !== projectId));
  };

  const handleCreateProject = () => {
    console.log('Create new project');
    // TODO: Implement create functionality
  };



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
            <h1 className="text-3xl font-bold text-text mb-2">Projects</h1>
            <p className="text-textSecondary">
              Manage and track your research and development projects
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-surface border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode('masonry')}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'masonry'
                    ? 'bg-primary text-textPrimary'
                    : 'text-textSecondary hover:text-text'
                )}
                title="Masonry Grid"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'kanban'
                    ? 'bg-primary text-textPrimary'
                    : 'text-textSecondary hover:text-text'
                )}
                title="Kanban Board"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary text-textPrimary'
                    : 'text-textSecondary hover:text-text'
                )}
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>

            <GlowButton onClick={handleCreateProject}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </GlowButton>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <ProjectFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableCategories={filterOptions.categories}
            availableTags={filterOptions.tags}
            availableAssignees={filterOptions.assignees}
          />
        </motion.div>

        {/* Results Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-textSecondary">
              Showing {filteredProjects.length} of {projects.length} projects
            </p>
            
            {filteredProjects.length > 0 && (
              <div className="flex items-center space-x-4 text-sm text-textSecondary">
                <span>
                  {filteredProjects.filter(p => p.status === 'done').length} completed
                </span>
                <span>
                  {filteredProjects.filter(p => p.status === 'in-progress').length} in progress
                </span>
                <span>
                  {filteredProjects.filter(p => p.status === 'backlog').length} in backlog
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Projects Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={viewMode === 'kanban' ? 'h-[calc(100vh-400px)]' : ''}
        >
          {viewMode === 'masonry' && (
            <ProjectMasonryGrid
              projects={filteredProjects}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          )}

          {viewMode === 'kanban' && (
            <KanbanBoard
              projects={filteredProjects}
              onProjectMove={handleStatusChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddProject={handleCreateProject}
            />
          )}

          {viewMode === 'list' && (
            <div className="space-y-4">
              {filteredProjects.map(project => (
                <GlassCard key={project.id} variant="subtle" className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text mb-1">{project.title}</h3>
                      <p className="text-textSecondary mb-2">{project.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-textSecondary">
                        <span>{project.category}</span>
                        <span>{project.progress}% complete</span>
                        <span>{project.assignedTo.length} team members</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{project.status === 'done' ? '✅' : project.status === 'in-progress' ? '🚀' : project.status === 'review' ? '👀' : '📋'}</span>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
