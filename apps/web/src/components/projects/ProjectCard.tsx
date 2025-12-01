import { useState } from 'react';
import { motion } from 'framer-motion';
import { Project } from '../../types';
import { Badge, GlassCard, ProgressIndicator } from '../ui';
import { cn } from '../../utils/cn';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onStatusChange?: (projectId: string, status: Project['status']) => void;
  className?: string;
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onStatusChange,
  className,
}: ProjectCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'backlog':
        return '📋';
      case 'in-progress':
        return '🚀';
      case 'review':
        return '👀';
      case 'done':
        return '✅';
      default:
        return '📝';
    }
  };

  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'done';

  return (
    <div
      className={cn('relative h-80 perspective-1000', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="relative w-full h-full preserve-3d cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        onClick={() => setIsFlipped(!isFlipped)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Front Side */}
        <div className="absolute inset-0 backface-hidden">
          <GlassCard
            variant="elevated"
            className={cn(
              'h-full p-6 overflow-hidden transition-all duration-300',
              isHovered && 'shadow-2xl',
              project.color && `border-l-4 border-l-[${project.color}]`
            )}
          >
            {/* Cover Image */}
            {project.coverImage && (
              <div className="absolute inset-0 opacity-10">
                <img
                  src={project.coverImage}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="relative z-10 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-text truncate mb-1">
                    {project.title}
                  </h3>
                  <p className="text-sm text-textSecondary">{project.category}</p>
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  <Badge
                    variant="glass"
                    size="sm"
                    className={getStatusColor(project.status)}
                  >
                    <span className="mr-1">{getStatusIcon(project.status)}</span>
                    {project.status}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-textSecondary mb-4 line-clamp-3 flex-1">
                {project.description}
              </p>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-text">Progress</span>
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
                />
              </div>

              {/* Tags */}
              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="glass"
                      size="sm"
                      className="bg-secondary/50"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {project.tags.length > 3 && (
                    <Badge variant="glass" size="sm" className="bg-secondary/30">
                      +{project.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="glass"
                    size="sm"
                    className={getPriorityColor(project.priority)}
                  >
                    {project.priority}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="glass" size="sm" className="bg-error">
                      Overdue
                    </Badge>
                  )}
                </div>

                {/* Collaborators */}
                <div className="flex -space-x-2">
                  {project.assignedTo.slice(0, 3).map((user, index) => (
                    <div
                      key={user.id}
                      className="w-6 h-6 rounded-full bg-primary/20 border-2 border-surface flex items-center justify-center text-xs font-medium text-primary"
                      title={user.name}
                      style={{ zIndex: 10 - index }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  ))}
                  {project.assignedTo.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-secondary/20 border-2 border-surface flex items-center justify-center text-xs font-medium text-secondary">
                      +{project.assignedTo.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Back Side */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <GlassCard variant="elevated" className="h-full p-6">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text">Project Details</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                  }}
                  className="p-1 text-textSecondary hover:text-text transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Details */}
              <div className="space-y-4 flex-1">
                <div>
                  <h4 className="text-sm font-medium text-text mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm text-textSecondary">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                    {project.dueDate && (
                      <div className="flex justify-between">
                        <span>Due:</span>
                        <span className={isOverdue ? 'text-error' : ''}>
                          {formatDate(project.dueDate)}
                        </span>
                      </div>
                    )}
                    {project.completedAt && (
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="text-success">{formatDate(project.completedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-text mb-2">Artifacts</h4>
                  <div className="text-sm text-textSecondary">
                    {project.artifacts.length} file{project.artifacts.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-text mb-2">Team</h4>
                  <div className="space-y-1">
                    <div className="text-xs text-textSecondary">
                      Created by {project.createdByName}
                    </div>
                    <div className="text-xs text-textSecondary">
                      {project.assignedTo.length} team member{project.assignedTo.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t border-border">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(project);
                    }}
                    className="flex-1 px-3 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm"
                  >
                    Edit
                  </button>
                )}

                {onStatusChange && (
                  <select
                    value={project.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      onStatusChange(project.id, e.target.value as Project['status']);
                    }}
                    className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                )}

                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this project?')) {
                        onDelete(project.id);
                      }
                    }}
                    className="px-3 py-2 bg-error/20 text-error rounded-lg hover:bg-error/30 transition-colors text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  );
}
