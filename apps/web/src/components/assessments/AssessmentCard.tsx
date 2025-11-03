
import { motion } from 'framer-motion';
import { Badge, GlassCard } from '../ui';
import { cn } from '../../utils/cn';

interface Assessment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'draft' | 'published' | 'closed' | 'graded';
  course: string;
  cohort: string;
  meetUrl?: string;
  submissionCount?: number;
  totalStudents?: number;
  maxScore?: number;
  createdBy?: string;
  createdAt: string;
}

interface AssessmentCardProps {
  assessment: Assessment;
  userRole: 'student' | 'faculty' | 'admin';
  onClick?: () => void;
  onJoinMeeting?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function AssessmentCard({
  assessment,
  userRole,
  onClick,
  onJoinMeeting,
  onEdit,
  onDelete,
  className,
}: AssessmentCardProps) {
  const isOverdue = new Date(assessment.dueDate) < new Date();
  const isDueSoon = new Date(assessment.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;

  const statusConfig = {
    draft: { color: 'bg-gray-500', text: 'Draft', icon: '📝' },
    published: { color: 'bg-primary', text: 'Active', icon: '🟢' },
    closed: { color: 'bg-warning', text: 'Closed', icon: '🔒' },
    graded: { color: 'bg-success', text: 'Graded', icon: '✅' },
  };

  const status = statusConfig[assessment.status];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgressPercentage = () => {
    if (!assessment.submissionCount || !assessment.totalStudents) return 0;
    return Math.round((assessment.submissionCount / assessment.totalStudents) * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <GlassCard
        variant="elevated"
        className={cn(
          'p-6 cursor-pointer transition-all duration-300 hover:shadow-xl',
          'border-l-4',
          assessment.status === 'published' ? 'border-l-primary' : 
          assessment.status === 'closed' ? 'border-l-warning' :
          assessment.status === 'graded' ? 'border-l-success' : 'border-l-gray-500'
        )}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="glass" size="sm" className={status.color}>
                <span className="mr-1">{status.icon}</span>
                {status.text}
              </Badge>
              {isDueSoon && !isOverdue && (
                <Badge variant="glass" size="sm" className="bg-warning">
                  ⏰ Due Soon
                </Badge>
              )}
              {isOverdue && assessment.status === 'published' && (
                <Badge variant="glass" size="sm" className="bg-error">
                  ⚠️ Overdue
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-text mb-1 line-clamp-2">
              {assessment.title}
            </h3>
            <p className="text-sm text-textSecondary line-clamp-2">
              {assessment.description}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {assessment.meetUrl && assessment.status === 'published' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinMeeting?.();
                }}
                className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                title="Join Google Meet"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </motion.button>
            )}
            
            {userRole === 'faculty' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                  className="p-2 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary/30 transition-colors"
                  title="Edit Assessment"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </motion.button>
                
                {assessment.status === 'draft' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                    className="p-2 bg-error/20 text-error rounded-lg hover:bg-error/30 transition-colors"
                    title="Delete Assessment"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </motion.button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Course and Cohort Info */}
        <div className="flex items-center space-x-4 mb-4 text-sm text-textSecondary">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{assessment.course}</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{assessment.cohort}</span>
          </div>
          {assessment.maxScore && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span>{assessment.maxScore} pts</span>
            </div>
          )}
        </div>

        {/* Progress Bar (for faculty) */}
        {userRole === 'faculty' && assessment.submissionCount !== undefined && assessment.totalStudents && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-textSecondary">Submissions</span>
              <span className="text-sm font-medium text-text">
                {assessment.submissionCount}/{assessment.totalStudents} ({getProgressPercentage()}%)
              </span>
            </div>
            <div className="w-full bg-border/20 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="bg-primary h-2 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center space-x-2 text-sm text-textSecondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Due: {formatDate(assessment.dueDate)}</span>
          </div>
          
          {userRole === 'student' && assessment.status === 'published' && (
            <Badge variant="glass" size="sm" className="bg-primary">
              Submit Work
            </Badge>
          )}
          
          {userRole === 'faculty' && (
            <div className="text-sm text-textSecondary">
              Created {formatDate(assessment.createdAt)}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export type { Assessment };