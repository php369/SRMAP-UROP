import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ProjectLegacy as Project, ProjectArtifact, ProjectTimelineEvent, User } from '../../types';
import { ArtifactCarousel } from '../../components/projects/ArtifactCarousel';
import { ProjectGanttChart } from '../../components/projects/ProjectGanttChart';
import { GlassCard, Badge, ProgressIndicator, LoadingSpinner, GlowButton } from '../../components/ui';
import { cn } from '../../utils/cn';

// Mock data
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
];

const mockArtifacts: ProjectArtifact[] = [
  {
    id: '1',
    name: 'Project Proposal.pdf',
    type: 'document',
    url: '/files/proposal.pdf',
    size: 2048000,
    uploadedAt: '2024-01-10T00:00:00Z',
    uploadedBy: '1',
    description: 'Initial project proposal with objectives and methodology',
    thumbnail: '/images/pdf-thumb.png',
  },
  {
    id: '2',
    name: 'System Architecture Diagram',
    type: 'image',
    url: '/files/architecture.png',
    size: 512000,
    uploadedAt: '2024-01-15T00:00:00Z',
    uploadedBy: '2',
    description: 'High-level system architecture and component relationships',
    thumbnail: '/images/architecture-thumb.png',
  },
  {
    id: '3',
    name: 'Demo Video',
    type: 'video',
    url: '/files/demo.mp4',
    size: 15728640,
    uploadedAt: '2024-01-20T00:00:00Z',
    uploadedBy: '1',
    description: 'Project demonstration and feature walkthrough',
    thumbnail: '/images/video-thumb.png',
  },
  {
    id: '4',
    name: 'Source Code Repository',
    type: 'link',
    url: 'https://github.com/project/repo',
    uploadedAt: '2024-01-12T00:00:00Z',
    uploadedBy: '1',
    description: 'Main source code repository on GitHub',
  },
];

const mockTimelineEvents: ProjectTimelineEvent[] = [
  {
    id: '1',
    title: 'Project Kickoff',
    description: 'Initial team meeting and project planning session',
    date: '2024-01-10T09:00:00Z',
    type: 'milestone',
    status: 'completed',
    assignedTo: ['1', '2'],
    duration: 2,
  },
  {
    id: '2',
    title: 'Requirements Analysis',
    description: 'Gather and analyze project requirements',
    date: '2024-01-15T14:00:00Z',
    type: 'task',
    status: 'completed',
    assignedTo: ['1'],
    duration: 8,
  },
  {
    id: '3',
    title: 'System Design Review',
    description: 'Review system architecture and design decisions',
    date: '2024-01-22T10:00:00Z',
    type: 'meeting',
    status: 'completed',
    assignedTo: ['1', '2'],
    duration: 1.5,
  },
  {
    id: '4',
    title: 'Implementation Phase 1',
    description: 'Core system implementation',
    date: '2024-01-25T09:00:00Z',
    type: 'task',
    status: 'in-progress',
    assignedTo: ['2'],
    duration: 40,
  },
  {
    id: '5',
    title: 'Mid-term Presentation',
    description: 'Present project progress to stakeholders',
    date: '2024-02-15T15:00:00Z',
    type: 'deadline',
    status: 'pending',
    assignedTo: ['1', '2'],
    duration: 1,
  },
];

const mockProject: Project = {
  id: '1',
  title: 'AI-Powered Student Portal',
  description: 'Developing an intelligent student portal with machine learning capabilities for personalized learning experiences and automated administrative tasks. This comprehensive platform will revolutionize how students interact with educational resources and administrative processes.',
  status: 'in-progress',
  priority: 'high',
  category: 'Web Development',
  tags: ['React', 'TypeScript', 'AI', 'Machine Learning', 'Education', 'Portal', 'Automation'],
  assignedTo: mockUsers,
  createdBy: '3',
  createdByName: 'Dr. Carol Davis',
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-28T00:00:00Z',
  dueDate: '2024-03-15T00:00:00Z',
  progress: 65,
  artifacts: mockArtifacts,
  timeline: mockTimelineEvents,
  collaborators: [],
  coverImage: '/images/ai-portal-hero.jpg',
  color: '#3B82F6',
};

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'artifacts' | 'team'>('overview');

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  useEffect(() => {
    // Simulate API call
    const fetchProject = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (projectId === '1') {
          setProject(mockProject);
        } else {
          throw new Error('Project not found');
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    } else {
      navigate('/projects');
    }
  }, [projectId, navigate]);

  const handleArtifactClick = (artifact: ProjectArtifact) => {
    window.open(artifact.url, '_blank');
  };

  const handleEventClick = (event: ProjectTimelineEvent) => {
    console.log('Event clicked:', event);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'backlog':
        return 'bg-gray-500';
      case 'in-progress':
        return 'bg-info';
      case 'review':
        return 'bg-warning';
      case 'done':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  const getPriorityColor = (priority: Project['priority']) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-500';
      case 'medium':
        return 'bg-info';
      case 'high':
        return 'bg-warning';
      case 'urgent':
        return 'bg-error';
      default:
        return 'bg-secondary';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'timeline', label: 'Timeline', icon: '📅', badge: project?.timeline.length },
    { id: 'artifacts', label: 'Artifacts', icon: '📎', badge: project?.artifacts.length },
    { id: 'team', label: 'Team', icon: '👥', badge: project?.assignedTo.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-textSecondary">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard variant="subtle" className="p-8 text-center max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-text mb-2">Project Not Found</h2>
          <p className="text-textSecondary mb-6">
            The project you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="px-6 py-3 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Projects
          </button>
        </GlassCard>
      </div>
    );
  }

  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'done';

  return (
    <div className="min-h-screen">
      {/* Parallax Hero Section */}
      <div ref={heroRef} className="relative h-96 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          {project.coverImage ? (
            <img
              src={project.coverImage}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20"
              style={{ backgroundColor: project.color }}
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-textPrimary"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Badge variant="glass" className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
                <Badge variant="glass" className={getPriorityColor(project.priority)}>
                  {project.priority} priority
                </Badge>
                <Badge variant="glass" className="bg-secondary">
                  {project.category}
                </Badge>
                {isOverdue && (
                  <Badge variant="glass" className="bg-error">
                    Overdue
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">{project.title}</h1>
              <p className="text-xl text-textPrimary/90 mb-6 max-w-3xl">{project.description}</p>

              <div className="flex items-center space-x-6 text-textPrimary/80">
                <div>
                  <span className="text-sm">Progress</span>
                  <div className="text-2xl font-bold">{project.progress}%</div>
                </div>
                <div>
                  <span className="text-sm">Team Size</span>
                  <div className="text-2xl font-bold">{project.assignedTo.length}</div>
                </div>
                <div>
                  <span className="text-sm">Due Date</span>
                  <div className="text-lg font-semibold">
                    {project.dueDate ? formatDate(project.dueDate) : 'Not set'}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-textPrimary"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <GlassCard variant="subtle" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">Project Progress</h3>
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-text">{project.progress}%</span>
                <GlowButton size="sm">
                  Update Progress
                </GlowButton>
              </div>
            </div>
            <ProgressIndicator
              value={project.progress}
              color={
                project.progress >= 90 ? 'success' :
                  project.progress >= 70 ? 'primary' :
                    project.progress >= 40 ? 'warning' : 'error'
              }
              showLabel={false}
              className="h-3"
            />
          </GlassCard>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-textSecondary hover:text-text hover:border-border'
                  )}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <Badge variant="glass" size="sm" className="bg-primary">
                      {tab.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Project Details */}
              <div className="lg:col-span-2 space-y-6">
                <GlassCard variant="elevated" className="p-6">
                  <h3 className="text-lg font-semibold text-text mb-4">Project Details</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-text mb-2">Description</h4>
                      <p className="text-textSecondary leading-relaxed">{project.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-text mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map(tag => (
                          <Badge key={tag} variant="glass" className="bg-secondary/50">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Recent Activity */}
                <GlassCard variant="elevated" className="p-6">
                  <h3 className="text-lg font-semibold text-text mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {project.timeline.slice(0, 3).map(event => (
                      <div key={event.id} className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm">
                          {event.type === 'milestone' ? '🎯' :
                            event.type === 'task' ? '📋' :
                              event.type === 'meeting' ? '👥' : '📝'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-text">{event.title}</h4>
                          <p className="text-sm text-textSecondary">{event.description}</p>
                          <p className="text-xs text-textSecondary mt-1">
                            {formatDate(event.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Project Info */}
                <GlassCard variant="subtle" className="p-6">
                  <h3 className="text-lg font-semibold text-text mb-4">Project Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Created:</span>
                      <span className="text-text">{formatDate(project.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Updated:</span>
                      <span className="text-text">{formatDate(project.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Created by:</span>
                      <span className="text-text">{project.createdByName}</span>
                    </div>
                    {project.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-textSecondary">Due date:</span>
                        <span className={cn('text-text', isOverdue && 'text-error')}>
                          {formatDate(project.dueDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* Team Members */}
                <GlassCard variant="subtle" className="p-6">
                  <h3 className="text-lg font-semibold text-text mb-4">Team Members</h3>
                  <div className="space-y-3">
                    {project.assignedTo.map(user => (
                      <div key={user.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                          {user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text">{user?.name || 'Unknown'}</p>
                          <p className="text-xs text-textSecondary">{user?.email || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <ProjectGanttChart
              events={project.timeline}
              onEventClick={handleEventClick}
            />
          )}

          {activeTab === 'artifacts' && (
            <ArtifactCarousel
              artifacts={project.artifacts}
              onArtifactClick={handleArtifactClick}
            />
          )}

          {activeTab === 'team' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.assignedTo.map(user => (
                <GlassCard key={user.id} variant="subtle" className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-lg font-medium text-primary">
                      {user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text">{user?.name || 'Unknown'}</h3>
                      <p className="text-sm text-textSecondary">{user?.email || ''}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Role:</span>
                      <Badge variant="glass" size="sm" className="bg-secondary">
                        {user.role}
                      </Badge>
                    </div>
                    {user.profile.department && (
                      <div className="flex justify-between">
                        <span className="text-textSecondary">Department:</span>
                        <span className="text-text">{user.profile.department}</span>
                      </div>
                    )}
                    {user.profile.year && (
                      <div className="flex justify-between">
                        <span className="text-textSecondary">Year:</span>
                        <span className="text-text">{user.profile.year}</span>
                      </div>
                    )}
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
