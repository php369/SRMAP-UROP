import { motion } from 'framer-motion';
import { Badge, GlassCard } from '../ui';
import { cn } from '../../utils/cn';

interface SubmissionFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Submission {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  course: string;
  submittedAt: string;
  status: 'draft' | 'submitted' | 'graded' | 'late' | 'missing';
  score?: number;
  maxScore?: number;
  feedback?: string;
  files: SubmissionFile[];
  notes?: string;
  attempt: number;
  maxAttempts: number;
  dueDate: string;
}

interface SubmissionCardProps {
  submission: Submission;
  onClick?: () => void;
  onDownload?: (file: SubmissionFile) => void;
  onResubmit?: () => void;
  className?: string;
}

export function SubmissionCard({
  submission,
  onClick,
  onDownload,
  onResubmit,
  className,
}: SubmissionCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('text')) return '📄';
    if (fileType.includes('zip')) return '🗜️';
    if (fileType.includes('python')) return '🐍';
    if (fileType.includes('javascript')) return '📜';
    return '📎';
  };

  const statusConfig = {
    draft: { color: 'bg-gray-500', text: 'Draft', icon: '📝' },
    submitted: { color: 'bg-info', text: 'Submitted', icon: '📤' },
    graded: { color: 'bg-success', text: 'Graded', icon: '✅' },
    late: { color: 'bg-warning', text: 'Late', icon: '⏰' },
    missing: { color: 'bg-error', text: 'Missing', icon: '❌' },
  };

  const status = statusConfig[submission.status];
  const isOverdue = new Date(submission.dueDate) < new Date();
  const canResubmit = submission.attempt < submission.maxAttempts && !isOverdue;
  const hasGrade = submission.score !== undefined && submission.maxScore !== undefined;
  const gradePercentage = hasGrade ? Math.round((submission.score! / submission.maxScore!) * 100) : 0;

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
          submission.status === 'graded' ? 'border-l-success' : 
          submission.status === 'submitted' ? 'border-l-info' :
          submission.status === 'late' ? 'border-l-warning' :
          submission.status === 'missing' ? 'border-l-error' : 'border-l-gray-500'
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
              
              {hasGrade && (
                <Badge 
                  variant="glass" 
                  size="sm" 
                  className={cn(
                    gradePercentage >= 90 ? 'bg-success' :
                    gradePercentage >= 80 ? 'bg-info' :
                    gradePercentage >= 70 ? 'bg-warning' : 'bg-error'
                  )}
                >
                  {submission.score}/{submission.maxScore} ({gradePercentage}%)
                </Badge>
              )}

              {submission.attempt > 1 && (
                <Badge variant="glass" size="sm" className="bg-secondary">
                  Attempt {submission.attempt}
                </Badge>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-text mb-1 line-clamp-2">
              {submission.assessmentTitle}
            </h3>
            <p className="text-sm text-textSecondary mb-2">{submission.course}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {canResubmit && onResubmit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onResubmit();
                }}
                className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                title="Resubmit"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>

        {/* Files */}
        {submission.files.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-text mb-2">
              Files ({submission.files.length})
            </h4>
            <div className="space-y-2">
              {submission.files.slice(0, 3).map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-3 p-2 bg-surface/50 rounded-lg hover:bg-surface/70 transition-colors"
                >
                  <div className="text-lg">{getFileIcon(file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{file.name}</p>
                    <p className="text-xs text-textSecondary">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload?.(file);
                    }}
                    className="p-1 text-textSecondary hover:text-primary transition-colors"
                    title="Download file"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {submission.files.length > 3 && (
                <div className="text-sm text-textSecondary text-center py-1">
                  +{submission.files.length - 3} more files
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Preview */}
        {submission.notes && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-text mb-1">Notes</h4>
            <p className="text-sm text-textSecondary line-clamp-2">{submission.notes}</p>
          </div>
        )}

        {/* Feedback Preview */}
        {submission.feedback && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
            <h4 className="text-sm font-medium text-success mb-1">Instructor Feedback</h4>
            <p className="text-sm text-textSecondary line-clamp-2">{submission.feedback}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center space-x-4 text-sm text-textSecondary">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Submitted: {formatDate(submission.submittedAt)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
              </svg>
              <span>Due: {formatDate(submission.dueDate)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {submission.maxAttempts > 1 && (
              <div className="text-xs text-textSecondary">
                {submission.attempt}/{submission.maxAttempts} attempts
              </div>
            )}
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 text-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export type { Submission, SubmissionFile };