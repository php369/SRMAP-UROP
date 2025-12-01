import { useState } from 'react';
import { motion } from 'framer-motion';
import { Project } from '../../types';
import { Badge, ProgressIndicator } from '../ui';
import { cn } from '../../utils/cn';

interface KanbanCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  isDragging?: boolean;
  className?: string;
}

export function KanbanCard({
  project,
  onEdit,
  onDelete,
  isDragging = false,
  className,
}: KanbanCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
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

  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'done';

  return (
    <motion.div
      layout
      layoutId={project.id}
      className={cn(
        'bg-surface border border-border rounded-lg p-4 cursor-grab active:cursor-grabbing',
        'hover:shadow-lg transition-all duration-200',
        isDragging && 'rotate-3 shadow-2xl scale-105 z-50',
        project.color && `border-l-4 border-l-[${project.color}]`,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: isDragging ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-text line-clamp-2 flex-1 pr-2">
          {project.title}
        </h3>

        <div className="flex items-center space-x-1">
          <Badge
            variant="glass"
            size="sm"
            className={getPriorityColor(project.priority)}
          >
            {project.priority}
          </Badge>

          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-1"
            >
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                  className="p-1 text-textSecondary hover:text-primary transition-colors"
                  title="Edit project"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this project?')) {
                      onDelete(project.id);
                    }
                  }}
                  className="p-1 text-textSecondary hover:text-error transition-colors"
                  title="Delete project"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-textSecondary mb-3 line-clamp-2">
        {project.description}
      </p>

      {/* Progress */}
      {project.progress > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-textSecondary">Progress</span>
            <span className="text-xs text-textSecondary">{project.progress}%</span>
          </div>
          <ProgressIndicator
            value={project.progress}
            color={
              project.progress >= 90 ? 'success' :
                project.progress >= 70 ? 'primary' :
                  project.progress >= 40 ? 'warning' : 'error'
            }
            showLabel={false}
            className="h-1"
          />
        </div>
      )}

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {project.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="glass"
              size="sm"
              className="bg-secondary/30 text-xs"
            >
              {tag}
            </Badge>
          ))}
          {project.tags.length > 2 && (
            <Badge variant="glass" size="sm" className="bg-secondary/20 text-xs">
              +{project.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Due date */}
          {project.dueDate && (
            <div className={cn(
              'text-xs',
              isOverdue ? 'text-error' : 'text-textSecondary'
            )}>
              {isOverdue ? '⚠️' : '📅'} {formatDate(project.dueDate)}
            </div>
          )}

          {/* Artifacts count */}
          {project.artifacts.length > 0 && (
            <div className="text-xs text-textSecondary">
              📎 {project.artifacts.length}
            </div>
          )}
        </div>

        {/* Assignees */}
        <div className="flex -space-x-1">
          {project.assignedTo.slice(0, 2).map((user, index) => (
            <div
              key={user.id}
              className="w-5 h-5 rounded-full bg-primary/20 border border-surface flex items-center justify-center text-xs font-medium text-primary"
              title={user.name}
              style={{ zIndex: 10 - index }}
            >
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          ))}
          {project.assignedTo.length > 2 && (
            <div className="w-5 h-5 rounded-full bg-secondary/20 border border-surface flex items-center justify-center text-xs font-medium text-secondary">
              +{project.assignedTo.length - 2}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
