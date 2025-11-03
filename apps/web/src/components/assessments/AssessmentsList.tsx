import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssessmentCard, Assessment } from './AssessmentCard';
import { AssessmentFilters, FilterOptions } from './AssessmentFilters';
import { LoadingSpinner } from '../ui';
import { cn } from '../../utils/cn';

interface AssessmentsListProps {
  assessments: Assessment[];
  userRole: 'student' | 'faculty' | 'admin';
  loading?: boolean;
  onAssessmentClick: (assessment: Assessment) => void;
  onJoinMeeting: (assessment: Assessment) => void;
  onEditAssessment?: (assessment: Assessment) => void;
  onDeleteAssessment?: (assessment: Assessment) => void;
  onCreateNew?: () => void;
  className?: string;
}

export function AssessmentsList({
  assessments,
  userRole,
  loading = false,
  onAssessmentClick,
  onJoinMeeting,
  onEditAssessment,
  onDeleteAssessment,
  onCreateNew,
  className,
}: AssessmentsListProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: [],
    course: [],
    cohort: [],
    sortBy: 'dueDate',
    sortOrder: 'asc',
  });

  // Extract unique values for filter options
  const availableCourses = useMemo(() => 
    [...new Set(assessments.map(a => a.course))].sort(),
    [assessments]
  );

  const availableCohorts = useMemo(() => 
    [...new Set(assessments.map(a => a.cohort))].sort(),
    [assessments]
  );

  // Filter and sort assessments
  const filteredAssessments = useMemo(() => {
    let filtered = assessments;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(assessment =>
        assessment.title.toLowerCase().includes(searchLower) ||
        assessment.description.toLowerCase().includes(searchLower) ||
        assessment.course.toLowerCase().includes(searchLower) ||
        assessment.cohort.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(assessment =>
        filters.status.includes(assessment.status)
      );
    }

    // Course filter
    if (filters.course.length > 0) {
      filtered = filtered.filter(assessment =>
        filters.course.includes(assessment.course)
      );
    }

    // Cohort filter
    if (filters.cohort.length > 0) {
      filtered = filtered.filter(assessment =>
        filters.cohort.includes(assessment.cohort)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (filters.sortBy) {
        case 'dueDate':
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [assessments, filters]);

  // Group assessments by status for better organization
  const groupedAssessments = useMemo(() => {
    const groups: Record<string, Assessment[]> = {};
    
    filteredAssessments.forEach(assessment => {
      if (!groups[assessment.status]) {
        groups[assessment.status] = [];
      }
      groups[assessment.status].push(assessment);
    });

    return groups;
  }, [filteredAssessments]);

  const statusOrder = ['published', 'draft', 'closed', 'graded'];
  const statusLabels = {
    published: 'Active Assessments',
    draft: 'Draft Assessments',
    closed: 'Closed Assessments',
    graded: 'Graded Assessments',
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
          <h1 className="text-3xl font-bold text-text">Assessments</h1>
          <p className="text-textSecondary mt-1">
            {userRole === 'faculty' 
              ? 'Manage your assessments and track student progress'
              : 'View your assignments and upcoming assessments'
            }
          </p>
        </div>
        
        {userRole === 'faculty' && onCreateNew && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateNew}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Assessment</span>
          </motion.button>
        )}
      </div>

      {/* Filters */}
      <AssessmentFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableCourses={availableCourses}
        availableCohorts={availableCohorts}
        userRole={userRole}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-textSecondary">
        <span>
          Showing {filteredAssessments.length} of {assessments.length} assessments
        </span>
        {filteredAssessments.length !== assessments.length && (
          <button
            onClick={() => setFilters({
              search: '',
              status: [],
              course: [],
              cohort: [],
              sortBy: 'dueDate',
              sortOrder: 'asc',
            })}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Assessments Grid */}
      {filteredAssessments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-surface/50 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text mb-2">No assessments found</h3>
          <p className="text-textSecondary mb-4">
            {assessments.length === 0 
              ? userRole === 'faculty' 
                ? "You haven't created any assessments yet."
                : "No assessments have been assigned to you yet."
              : "Try adjusting your filters to see more results."
            }
          </p>
          {userRole === 'faculty' && assessments.length === 0 && onCreateNew && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateNew}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Your First Assessment
            </motion.button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {statusOrder.map(status => {
            const statusAssessments = groupedAssessments[status];
            if (!statusAssessments || statusAssessments.length === 0) return null;

            return (
              <div key={status}>
                <h2 className="text-xl font-semibold text-text mb-4">
                  {statusLabels[status as keyof typeof statusLabels]} ({statusAssessments.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {statusAssessments.map((assessment) => (
                      <AssessmentCard
                        key={assessment.id}
                        assessment={assessment}
                        userRole={userRole}
                        onClick={() => onAssessmentClick(assessment)}
                        onJoinMeeting={() => onJoinMeeting(assessment)}
                        onEdit={() => onEditAssessment?.(assessment)}
                        onDelete={() => onDeleteAssessment?.(assessment)}
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