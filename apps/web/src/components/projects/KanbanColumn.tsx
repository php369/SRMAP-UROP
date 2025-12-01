import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../../types';
import { KanbanCard } from './KanbanCard';
import { Badge, GlassCard } from '../ui';
import { cn } from '../../utils/cn';

interface KanbanColumnProps {
  title: string;
  status: Project['status'];
  projects: Project[];
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onDrop?: (projectId: string, newStatus: Project['status']) => void;
  onAddProject?: (status: Project['status']) => void;
  color?: string;
  icon?: string;
  className?: string;
}

export function KanbanColumn({
  title,
  status,
  projects,
  onEdit,
  onDelete,
  onDrop,
  onAddProject,
  color = 'bg-secondary',
  icon = '📋',
  className,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

  const handleDragStart = (e: any, projectId: string) => {
    e.dataTransfer.setData('text/plain', projectId);
    setDraggedProjectId(projectId);
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isDragOver to false if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const projectId = e.dataTransfer.getData('text/plain');
    if (projectId && onDrop) {
      onDrop(projectId, status);
    }
  };

  const getTotalProgress = () => {
    if (projects.length === 0) return 0;
    return Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length);
  };

  const getUrgentCount = () => {
    return projects.filter(p => p.priority === 'urgent').length;
  };

  const getOverdueCount = () => {
    return projects.filter(p => 
      p.dueDate && 
      new Date(p.dueDate) < new Date() && 
      p.status !== 'done'
    ).length;
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Column Header */}
      <GlassCard variant="subtle" className="p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{icon}</span>
            <h3 className="font-semibold text-text">{title}</h3>
            <Badge variant="glass" className={color}>
              {projects.length}
            </Badge>
          </div>
          
          {onAddProject && (
            <button
              onClick={() => onAddProject(status)}
              className="p-1 text-textSecondary hover:text-primary transition-colors"
              title="Add project"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        {/* Column Stats */}
        {projects.length > 0 && (
          <div className="flex items-center space-x-4 text-xs text-textSecondary">
            <span>Avg: {getTotalProgress()}%</span>
            {getUrgentCount() > 0 && (
              <span className="text-error">🔥 {getUrgentCount()} urgent</span>
            )}
            {getOverdueCount() > 0 && (
              <span className="text-warning">⚠️ {getOverdueCount()} overdue</span>
            )}
          </div>
        )}
      </GlassCard>

      {/* Drop Zone */}
      <div
        className={cn(
          'flex-1 min-h-96 p-2 rounded-lg border-2 border-dashed transition-all duration-200',
          isDragOver 
            ? 'border-primary bg-primary/5 scale-105' 
            : 'border-transparent hover:border-border/50',
          projects.length === 0 && 'flex items-center justify-center'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {projects.length === 0 ? (
          <div className="text-center text-textSecondary">
            <div className="text-4xl mb-2 opacity-50">{icon}</div>
            <p className="text-sm">No projects in {title.toLowerCase()}</p>
            {isDragOver && (
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-primary font-medium mt-2"
              >
                Drop project here
              </motion.p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, project.id)}
                  onDragEnd={handleDragEnd}
                >
                  <KanbanCard
                    project={project}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isDragging={draggedProjectId === project.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Drop indicator */}
            {isDragOver && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 40 }}
                className="border-2 border-dashed border-primary bg-primary/10 rounded-lg flex items-center justify-center"
              >
                <span className="text-primary text-sm font-medium">Drop here</span>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
