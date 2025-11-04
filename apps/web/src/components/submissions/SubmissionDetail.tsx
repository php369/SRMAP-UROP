import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge, GlassCard, GlowButton } from '../ui';
import { Submission, SubmissionFile } from './SubmissionCard';
import { cn } from '../../utils/cn';

interface SubmissionDetailProps {
  submission: Submission;
  onDownloadFile: (file: SubmissionFile) => void;
  onDownloadAll?: () => void;
  onResubmit?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function SubmissionDetail({
  submission,
  onDownloadFile,
  onDownloadAll,
  onResubmit,
  onEdit,
  className,
}: SubmissionDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'feedback'>('overview');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'files', label: 'Files', icon: '📁', badge: submission.files.length },
    { id: 'feedback', label: 'Feedback', icon: '💬', disabled: !submission.feedback },
  ];

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 80) return 'text-info';
    if (percentage >= 70) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <Badge variant="glass" className={status.color}>
              <span className="mr-1">{status.icon}</span>
              {status.text}
            </Badge>
            
            {hasGrade && (
              <Badge 
                variant="glass" 
                size="lg"
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
              <Badge variant="glass" className="bg-secondary">
                Attempt {submission.attempt} of {submission.maxAttempts}
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-text mb-2">{submission.assessmentTitle}</h1>
          <p className="text-textSecondary text-lg mb-4">{submission.course}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-textSecondary">
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
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {submission.files.length > 1 && onDownloadAll && (
            <button
              onClick={onDownloadAll}
              className="px-4 py-2 bg-secondary/20 text-secondary border border-secondary/30 rounded-lg hover:bg-secondary/30 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download All</span>
            </button>
          )}
          
          {submission.status === 'draft' && onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-warning/20 text-warning border border-warning/30 rounded-lg hover:bg-warning/30 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Draft</span>
            </button>
          )}
          
          {canResubmit && onResubmit && (
            <GlowButton onClick={onResubmit} className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Resubmit</span>
            </GlowButton>
          )}
        </div>
      </div>

      {/* Grade Display */}
      {hasGrade && (
        <GlassCard variant="subtle" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text mb-2">Your Grade</h3>
              <div className="flex items-center space-x-4">
                <div className={cn('text-3xl font-bold', getGradeColor(gradePercentage))}>
                  {submission.score}/{submission.maxScore}
                </div>
                <div className={cn('text-2xl font-semibold', getGradeColor(gradePercentage))}>
                  ({gradePercentage}%)
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-textSecondary mb-1">Letter Grade</div>
              <div className={cn('text-2xl font-bold', getGradeColor(gradePercentage))}>
                {gradePercentage >= 90 ? 'A' :
                 gradePercentage >= 80 ? 'B' :
                 gradePercentage >= 70 ? 'C' :
                 gradePercentage >= 60 ? 'D' : 'F'}
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              disabled={tab.disabled}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : tab.disabled
                  ? 'border-transparent text-textSecondary/50 cursor-not-allowed'
                  : 'border-transparent text-textSecondary hover:text-text hover:border-border'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <Badge variant="glass" size="sm" className="bg-primary">
                  {tab.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Submission Notes */}
            {submission.notes && (
              <GlassCard variant="subtle" className="p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Your Notes</h3>
                <div className="prose prose-sm max-w-none text-textSecondary">
                  <p className="whitespace-pre-wrap">{submission.notes}</p>
                </div>
              </GlassCard>
            )}

            {/* Submission Summary */}
            <GlassCard variant="subtle" className="p-6">
              <h3 className="text-lg font-semibold text-text mb-4">Submission Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-text mb-2">Files Submitted</h4>
                  <p className="text-2xl font-bold text-primary">{submission.files.length}</p>
                </div>
                <div>
                  <h4 className="font-medium text-text mb-2">Total File Size</h4>
                  <p className="text-2xl font-bold text-primary">
                    {formatFileSize(submission.files.reduce((total, file) => total + file.size, 0))}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-text mb-2">Submission Status</h4>
                  <Badge variant="glass" className={status.color}>
                    <span className="mr-1">{status.icon}</span>
                    {status.text}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-text mb-2">Attempt Number</h4>
                  <p className="text-2xl font-bold text-primary">
                    {submission.attempt} of {submission.maxAttempts}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">Submitted Files ({submission.files.length})</h3>
              {submission.files.length > 1 && onDownloadAll && (
                <button
                  onClick={onDownloadAll}
                  className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download All</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submission.files.map((file) => (
                <GlassCard key={file.id} variant="subtle" className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getFileIcon(file.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-text truncate">{file.name}</h4>
                      <p className="text-sm text-textSecondary">{formatFileSize(file.size)}</p>
                      <p className="text-xs text-textSecondary">{file.type}</p>
                    </div>
                    <button
                      onClick={() => onDownloadFile(file)}
                      className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                      title="Download file"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && submission.feedback && (
          <GlassCard variant="subtle" className="p-6">
            <h3 className="text-lg font-semibold text-text mb-4">Instructor Feedback</h3>
            <div className="prose prose-sm max-w-none text-textSecondary">
              <p className="whitespace-pre-wrap">{submission.feedback}</p>
            </div>
          </GlassCard>
        )}
      </motion.div>
    </div>
  );
}
