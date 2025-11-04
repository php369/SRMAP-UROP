import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SubmissionCard, Submission, SubmissionFile } from './SubmissionCard';
import { LoadingSpinner } from '../ui';
import { cn } from '../../utils/cn';

interface SubmissionsListProps {
  submissions: Submission[];
  loading?: boolean;
  onSubmissionClick: (submission: Submission) => void;
  onDownloadFile: (file: SubmissionFile) => void;
  onResubmit: (submission: Submission) => void;
  className?: string;
}

interface FilterOptions {
  status: string[];
  course: string[];
  search: string;
  sortBy: 'submittedAt' | 'dueDate' | 'assessmentTitle' | 'score';
  sortOrder: 'asc' | 'desc';
}

export function SubmissionsList({
  submissions,
  loading = false,
  onSubmissionClick,
  onDownloadFile,
  onResubmit,
  className,
}: SubmissionsListProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    course: [],
    search: '',
    sortBy: 'submittedAt',
    sortOrder: 'desc',
  });

  // Extract unique values for filter options
  const availableCourses = useMemo(() => 
    [...new Set(submissions.map(s => s.course))].sort(),
    [submissions]
  );

  const statusOptions = [
    { value: 'submitted', label: 'Submitted', color: 'bg-info' },
    { value: 'graded', label: 'Graded', color: 'bg-success' },
    { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
    { value: 'late', label: 'Late', color: 'bg-warning' },
    { value: 'missing', label: 'Missing', color: 'bg-error' },
  ];

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(submission =>
        submission.assessmentTitle.toLowerCase().includes(searchLower) ||
        submission.course.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(submission =>
        filters.status.includes(submission.status)
      );
    }

    // Course filter
    if (filters.course.length > 0) {
      filtered = filtered.filter(submission =>
        filters.course.includes(submission.course)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (filters.sortBy) {
        case 'submittedAt':
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
          break;
        case 'assessmentTitle':
          aValue = a.assessmentTitle.toLowerCase();
          bValue = b.assessmentTitle.toLowerCase();
          break;
        case 'score':
          aValue = a.score || 0;
          bValue = b.score || 0;
          break;
        default:
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [submissions, filters]);

  const updateFilters = (updates: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...updates }));
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

  const clearAllFilters = () => {
    updateFilters({
      status: [],
      course: [],
      search: '',
      sortBy: 'submittedAt',
      sortOrder: 'desc',
    });
  };

  const activeFilterCount = filters.status.length + filters.course.length + (filters.search ? 1 : 0);

  // Group submissions by status
  const groupedSubmissions = useMemo(() => {
    const groups: Record<string, Submission[]> = {};
    
    filteredSubmissions.forEach(submission => {
      if (!groups[submission.status]) {
        groups[submission.status] = [];
      }
      groups[submission.status].push(submission);
    });

    return groups;
  }, [filteredSubmissions]);

  const statusOrder = ['submitted', 'graded', 'draft', 'late', 'missing'];
  const statusLabels = {
    submitted: 'Submitted',
    graded: 'Graded',
    draft: 'Drafts',
    late: 'Late Submissions',
    missing: 'Missing',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">My Submissions</h1>
          <p className="text-textSecondary mt-1">
            Track your assignment submissions and grades
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search submissions..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value as FilterOptions['sortBy'] })}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="submittedAt">Submission Date</option>
              <option value="dueDate">Due Date</option>
              <option value="assessmentTitle">Title</option>
              <option value="score">Score</option>
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

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-sm text-textSecondary hover:text-text transition-colors"
              >
                Clear ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <h4 className="text-sm font-medium text-text mb-2">Filter by Status</h4>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(status => (
              <button
                key={status.value}
                onClick={() => toggleStatus(status.value)}
                className={cn(
                  'px-3 py-1 rounded-lg text-sm transition-all duration-200',
                  filters.status.includes(status.value)
                    ? `${status.color} text-textPrimary`
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
            <h4 className="text-sm font-medium text-text mb-2">Filter by Course</h4>
            <div className="flex flex-wrap gap-2">
              {availableCourses.map(course => (
                <button
                  key={course}
                  onClick={() => toggleCourse(course)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-sm transition-all duration-200',
                    filters.course.includes(course)
                      ? 'bg-secondary text-textPrimary'
                      : 'bg-surface border border-border text-textSecondary hover:text-text'
                  )}
                >
                  {course}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-textSecondary">
        <span>
          Showing {filteredSubmissions.length} of {submissions.length} submissions
        </span>
      </div>

      {/* Submissions Grid */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-surface/50 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text mb-2">No submissions found</h3>
          <p className="text-textSecondary mb-4">
            {submissions.length === 0 
              ? "You haven't submitted any assignments yet."
              : "Try adjusting your filters to see more results."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {statusOrder.map(status => {
            const statusSubmissions = groupedSubmissions[status];
            if (!statusSubmissions || statusSubmissions.length === 0) return null;

            return (
              <div key={status}>
                <h2 className="text-xl font-semibold text-text mb-4">
                  {statusLabels[status as keyof typeof statusLabels]} ({statusSubmissions.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {statusSubmissions.map((submission) => (
                      <SubmissionCard
                        key={submission.id}
                        submission={submission}
                        onClick={() => onSubmissionClick(submission)}
                        onDownload={onDownloadFile}
                        onResubmit={() => onResubmit(submission)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
