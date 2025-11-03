import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Project } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { GlassCard } from '../ui';
import { cn } from '../../utils/cn';

interface KanbanBoardProps {
  projects: Project[];
  onProjectMove: (projectId: string, newStatus: Project['status']) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onAddProject?: (status: Project['status']) => void;
  className?: string;
}

interface ColumnConfig {
  status: Project['status'];
  title: string;
  icon: string;
  color: string;
}

const columnConfigs: ColumnConfig[] = [
  {
    status: 'backlog',
    title: 'Backlog',
    icon: '📋',
    color: 'bg-gray-500',
  },
  {
    status: 'in-progress',
    title: 'In Progress',
    icon: '🚀',
    color: 'bg-info',
  },
  {
    status: 'review',
    title: 'Review',
    icon: '👀',
    color: 'bg-warning',
  },
  {
    status: 'done',
    title: 'Done',
    icon: '✅',
    color: 'bg-success',
  },
];

export function KanbanBoard({
  projects,
  onProjectMove,
  onEdit,
  onDelete,
  onAddProject,
  className,
}: KanbanBoardProps) {
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Group projects by status
  const projectsByStatus = projects.reduce((acc, project) => {
    if (!acc[project.status]) {
      acc[project.status] = [];
    }
    acc[project.status].push(project);
    return acc;
  }, {} as Record<Project['status'], Project[]>);

  // Sort projects within each column by priority and due date
  const sortProjects = (projects: Project[]) => {
    return projects.sort((a, b) => {
      // First sort by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by due date (overdue first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // Finally by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const handleProjectMove = (projectId: string, newStatus: Project['status']) => {
    onProjectMove(projectId, newStatus);
    setLastUpdate(new Date());
  };

  // Simulate real-time updates (in a real app, this would be WebSocket or SSE)
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      // Simulate receiving updates
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  const getTotalStats = () => {
    const total = projects.length;
    const completed = projects.filter(p => p.status === 'done').length;
    const inProgress = projects.filter(p => p.status === 'in-progress').length;
    const overdue = projects.filter(p => 
      p.dueDate && 
      new Date(p.dueDate) < new Date() && 
      p.status !== 'done'
    ).length;

    return { total, completed, inProgress, overdue };
  };

  const stats = getTotalStats();

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Board Header */}
      <GlassCard variant="subtle" className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h2 className="text-xl font-bold text-text">Project Board</h2>
            
            <div className="flex items-center space-x-4 text-sm text-textSecondary">
              <span>{stats.total} total</span>
              <span className="text-success">{stats.completed} completed</span>
              <span className="text-info">{stats.inProgress} active</span>
              {stats.overdue > 0 && (
                <span className="text-error">{stats.overdue} overdue</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Real-time toggle */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRealTimeEnabled}
                onChange={(e) => setIsRealTimeEnabled(e.target.checked)}
                className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
              />
              <span className="text-sm text-textSecondary">Real-time updates</span>
            </label>

            {/* Last update indicator */}
            <div className="flex items-center space-x-2 text-xs text-textSecondary">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isRealTimeEnabled ? 'bg-success animate-pulse' : 'bg-gray-400'
              )} />
              <span>
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-x-auto">
          <div className="flex space-x-6 h-full min-w-max px-1">
            {columnConfigs.map((config, index) => (
              <motion.div
                key={config.status}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="w-80 flex-shrink-0"
              >
                <KanbanColumn
                  title={config.title}
                  status={config.status}
                  projects={sortProjects(projectsByStatus[config.status] || [])}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDrop={handleProjectMove}
                  onAddProject={onAddProject}
                  color={config.color}
                  icon={config.icon}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Board Footer */}
      <div className="mt-6 text-center text-xs text-textSecondary">
        <p>Drag and drop projects between columns to update their status</p>
        {isRealTimeEnabled && (
          <p className="mt-1">
            🔄 Real-time collaboration enabled - changes sync automatically
          </p>
        )}
      </div>
    </div>
  );
}