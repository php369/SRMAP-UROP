import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, ProjectFilter } from '../../types';
import { Badge, GlassCard, Input } from '../ui';
import { cn } from '../../utils/cn';

interface ProjectFiltersProps {
  filters: ProjectFilter;
  onFiltersChange: (filters: ProjectFilter) => void;
  availableCategories: string[];
  availableTags: string[];
  availableAssignees: { id: string; name: string }[];
  className?: string;
}

export function ProjectFilters({
  filters,
  onFiltersChange,
  availableCategories,
  availableTags,
  availableAssignees,
  className,
}: ProjectFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof ProjectFilter>(
    key: K,
    value: ProjectFilter[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = <T extends string>(
    key: keyof ProjectFilter,
    value: T,
    currentArray: T[] = []
  ) => {
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.priority?.length) count++;
    if (filters.category?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.assignedTo?.length) count++;
    if (filters.createdBy?.length) count++;
    if (filters.dateRange) count++;
    if (filters.search) count++;
    return count;
  };

  const statusOptions: { value: Project['status']; label: string; icon: string; color: string }[] = [
    { value: 'backlog', label: 'Backlog', icon: '📋', color: 'bg-gray-500' },
    { value: 'in-progress', label: 'In Progress', icon: '🚀', color: 'bg-info' },
    { value: 'review', label: 'Review', icon: '👀', color: 'bg-warning' },
    { value: 'done', label: 'Done', icon: '✅', color: 'bg-success' },
  ];

  const priorityOptions: { value: Project['priority']; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-gray-500' },
    { value: 'medium', label: 'Medium', color: 'bg-info' },
    { value: 'high', label: 'High', color: 'bg-warning' },
    { value: 'urgent', label: 'Urgent', color: 'bg-error' },
  ];

  return (
    <GlassCard variant="subtle" className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-text">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <Badge variant="glass" className="bg-primary">
              {getActiveFilterCount()} active
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-textSecondary hover:text-text transition-colors"
          >
            <motion.svg
              className="w-5 h-5"
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search projects..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value || undefined)}
          className="w-full"
        />
      </div>

      {/* Quick Status Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusOptions.map((status) => (
          <button
            key={status.value}
            onClick={() => toggleArrayFilter('status', status.value, filters.status)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              'border border-border hover:border-primary/50',
              filters.status?.includes(status.value)
                ? 'bg-primary/20 text-primary border-primary/50'
                : 'bg-surface/50 text-textSecondary hover:text-text'
            )}
          >
            <span className="mr-1">{status.icon}</span>
            {status.label}
          </button>
        ))}
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-6 pt-4 border-t border-border">
              {/* Priority */}
              <div>
                <h4 className="text-sm font-medium text-text mb-3">Priority</h4>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => toggleArrayFilter('priority', priority.value, filters.priority)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                        'border border-border hover:border-primary/50',
                        filters.priority?.includes(priority.value)
                          ? 'bg-primary/20 text-primary border-primary/50'
                          : 'bg-surface/50 text-textSecondary hover:text-text'
                      )}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {availableCategories.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text mb-3">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => toggleArrayFilter('category', category, filters.category)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                          'border border-border hover:border-primary/50',
                          filters.category?.includes(category)
                            ? 'bg-primary/20 text-primary border-primary/50'
                            : 'bg-surface/50 text-textSecondary hover:text-text'
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {availableTags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleArrayFilter('tags', tag, filters.tags)}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium transition-all',
                          'border border-border hover:border-primary/50',
                          filters.tags?.includes(tag)
                            ? 'bg-primary/20 text-primary border-primary/50'
                            : 'bg-surface/50 text-textSecondary hover:text-text'
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignees */}
              {availableAssignees.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text mb-3">Assigned To</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableAssignees.map((assignee) => (
                      <label
                        key={assignee.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-surface/30 p-2 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={filters.assignedTo?.includes(assignee.id) || false}
                          onChange={() => toggleArrayFilter('assignedTo', assignee.id, filters.assignedTo)}
                          className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                            {assignee.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-text">{assignee.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range */}
              <div>
                <h4 className="text-sm font-medium text-text mb-3">Date Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-textSecondary mb-1">From</label>
                    <input
                      type="date"
                      value={filters.dateRange?.start || ''}
                      onChange={(e) => updateFilter('dateRange', {
                        start: e.target.value,
                        end: filters.dateRange?.end || '',
                      })}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-textSecondary mb-1">To</label>
                    <input
                      type="date"
                      value={filters.dateRange?.end || ''}
                      onChange={(e) => updateFilter('dateRange', {
                        start: filters.dateRange?.start || '',
                        end: e.target.value,
                      })}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}