import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Input } from '../ui';
import { cn } from '../../utils/cn';

interface FilterOptions {
  search: string;
  status: string[];
  course: string[];
  cohort: string[];
  sortBy: 'dueDate' | 'createdAt' | 'title' | 'status';
  sortOrder: 'asc' | 'desc';
}

interface AssessmentFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableCourses: string[];
  availableCohorts: string[];
  userRole: 'student' | 'faculty' | 'admin';
  className?: string;
}

export function AssessmentFilters({
  filters,
  onFiltersChange,
  availableCourses,
  availableCohorts,
  userRole,
  className,
}: AssessmentFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOptions = userRole === 'faculty' 
    ? [
        { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
        { value: 'published', label: 'Active', color: 'bg-primary' },
        { value: 'closed', label: 'Closed', color: 'bg-warning' },
        { value: 'graded', label: 'Graded', color: 'bg-success' },
      ]
    : [
        { value: 'published', label: 'Active', color: 'bg-primary' },
        { value: 'closed', label: 'Closed', color: 'bg-warning' },
        { value: 'graded', label: 'Graded', color: 'bg-success' },
      ];

  const sortOptions = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' },
  ];

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    updateFilters({ status: newStatus });
  };

  const toggleCourse = (course: string) => {
    const newCourse = filters.course.includes(course)
      ? filters.course.filter(c => c !== course)
      : [...filters.course, course];
    updateFilters({ course: newCourse });
  };

  const toggleCohort = (cohort: string) => {
    const newCohort = filters.cohort.includes(cohort)
      ? filters.cohort.filter(c => c !== cohort)
      : [...filters.cohort, cohort];
    updateFilters({ cohort: newCohort });
  };

  const clearAllFilters = () => {
    updateFilters({
      search: '',
      status: [],
      course: [],
      cohort: [],
      sortBy: 'dueDate',
      sortOrder: 'asc',
    });
  };

  const activeFilterCount = filters.status.length + filters.course.length + filters.cohort.length + (filters.search ? 1 : 0);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Search assessments..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-full pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Sort */}
          <div className="flex items-center space-x-2">
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value as FilterOptions['sortBy'] })}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
              className="p-2 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors"
              title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <svg 
                className={cn('w-4 h-4 text-textSecondary transition-transform', 
                  filters.sortOrder === 'desc' && 'rotate-180'
                )} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-all duration-200 flex items-center space-x-2',
              isExpanded && 'bg-primary/10 border-primary/30'
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span className="text-sm">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="glass" size="sm" className="bg-primary">
                {activeFilterCount}
              </Badge>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 text-sm text-textSecondary hover:text-text transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-surface/50 border border-border rounded-lg p-4 space-y-4">
              {/* Status Filters */}
              <div>
                <h4 className="text-sm font-medium text-text mb-2">Status</h4>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(status => (
                    <button
                      key={status.value}
                      onClick={() => toggleStatus(status.value)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-sm transition-all duration-200',
                        filters.status.includes(status.value)
                          ? `${status.color} text-white`
                          : 'bg-surface border border-border text-textSecondary hover:text-text'
                      )}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course Filters */}
              {availableCourses.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text mb-2">Courses</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableCourses.map(course => (
                      <button
                        key={course}
                        onClick={() => toggleCourse(course)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-sm transition-all duration-200',
                          filters.course.includes(course)
                            ? 'bg-secondary text-white'
                            : 'bg-surface border border-border text-textSecondary hover:text-text'
                        )}
                      >
                        {course}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cohort Filters */}
              {availableCohorts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text mb-2">Cohorts</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableCohorts.map(cohort => (
                      <button
                        key={cohort}
                        onClick={() => toggleCohort(cohort)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-sm transition-all duration-200',
                          filters.cohort.includes(cohort)
                            ? 'bg-accent text-white'
                            : 'bg-surface border border-border text-textSecondary hover:text-text'
                        )}
                      >
                        {cohort}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { FilterOptions };