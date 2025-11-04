import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge, GlassCard, GlowButton, ProgressIndicator } from '../ui';
import { AnimatedBarChart, AnimatedLineChart } from '../charts';
import { Assessment } from './AssessmentCard';
import { cn } from '../../utils/cn';

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  status: 'submitted' | 'graded' | 'late' | 'missing';
  score?: number;
  feedback?: string;
  files: {
    name: string;
    url: string;
    size: number;
  }[];
  attempts: number;
}

interface AssessmentDetailProps {
  assessment: Assessment;
  submissions: Submission[];
  userRole: 'student' | 'faculty' | 'admin';
  onJoinMeeting?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onGradeSubmission?: (submission: Submission) => void;
  onDownloadSubmissions?: () => void;
  onPublishGrades?: () => void;
  className?: string;
}

export function AssessmentDetail({
  assessment,
  submissions,
  userRole,
  onJoinMeeting,
  onEdit,
  onDelete: _onDelete,
  onGradeSubmission,
  onDownloadSubmissions,
  onPublishGrades,
  className,
}: AssessmentDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'analytics'>('overview');

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-info';
      case 'graded': return 'bg-success';
      case 'late': return 'bg-warning';
      case 'missing': return 'bg-error';
      default: return 'bg-gray-500';
    }
  };

  const getSubmissionStats = () => {
    const total = assessment.totalStudents || 0;
    const submitted = submissions.filter(s => s.status !== 'missing').length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const late = submissions.filter(s => s.status === 'late').length;
    const missing = total - submitted;

    return { total, submitted, graded, late, missing };
  };

  const getGradeDistribution = () => {
    const gradedSubmissions = submissions.filter(s => s.score !== undefined);
    const ranges = [
      { name: 'A (90-100)', min: 90, max: 100, count: 0 },
      { name: 'B (80-89)', min: 80, max: 89, count: 0 },
      { name: 'C (70-79)', min: 70, max: 79, count: 0 },
      { name: 'D (60-69)', min: 60, max: 69, count: 0 },
      { name: 'F (0-59)', min: 0, max: 59, count: 0 },
    ];

    gradedSubmissions.forEach(submission => {
      if (submission.score !== undefined) {
        const percentage = (submission.score / (assessment.maxScore || 100)) * 100;
        const range = ranges.find(r => percentage >= r.min && percentage <= r.max);
        if (range) range.count++;
      }
    });

    return ranges.map(range => ({
      name: range.name,
      value: range.count,
    }));
  };

  const getSubmissionTrend = () => {
    // Mock data for submission trend over time
    return [
      { name: 'Day 1', submissions: 2 },
      { name: 'Day 2', submissions: 5 },
      { name: 'Day 3', submissions: 8 },
      { name: 'Day 4', submissions: 12 },
      { name: 'Day 5', submissions: 15 },
      { name: 'Day 6', submissions: 18 },
      { name: 'Day 7', submissions: 20 },
    ];
  };

  const stats = getSubmissionStats();
  const isOverdue = new Date(assessment.dueDate) < new Date();
  const canGrade = userRole === 'faculty' && submissions.some(s => s.status === 'submitted');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'submissions', label: 'Submissions', icon: '📄', badge: stats.submitted },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <Badge variant="glass" className={getStatusColor(assessment.status)}>
              {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
            </Badge>
            {isOverdue && assessment.status === 'published' && (
              <Badge variant="glass" className="bg-error">
                ⚠️ Overdue
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-text mb-2">{assessment.title}</h1>
          <p className="text-textSecondary text-lg mb-4">{assessment.description}</p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-textSecondary">
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
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Due: {formatDate(assessment.dueDate)}</span>
            </div>
            {assessment.maxScore && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span>{assessment.maxScore} points</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {assessment.meetUrl && assessment.status === 'published' && (
            <GlowButton onClick={onJoinMeeting} className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Join Meeting</span>
            </GlowButton>
          )}
          
          {userRole === 'faculty' && (
            <>
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-secondary/20 text-secondary border border-secondary/30 rounded-lg hover:bg-secondary/30 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>
              
              {canGrade && (
                <button
                  onClick={onPublishGrades}
                  className="px-4 py-2 bg-success/20 text-success border border-success/30 rounded-lg hover:bg-success/30 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Publish Grades</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {userRole === 'faculty' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard variant="subtle" className="p-4 text-center">
            <div className="text-2xl font-bold text-primary mb-1">{stats.submitted}</div>
            <div className="text-sm text-textSecondary">Submitted</div>
          </GlassCard>
          <GlassCard variant="subtle" className="p-4 text-center">
            <div className="text-2xl font-bold text-success mb-1">{stats.graded}</div>
            <div className="text-sm text-textSecondary">Graded</div>
          </GlassCard>
          <GlassCard variant="subtle" className="p-4 text-center">
            <div className="text-2xl font-bold text-warning mb-1">{stats.late}</div>
            <div className="text-sm text-textSecondary">Late</div>
          </GlassCard>
          <GlassCard variant="subtle" className="p-4 text-center">
            <div className="text-2xl font-bold text-error mb-1">{stats.missing}</div>
            <div className="text-sm text-textSecondary">Missing</div>
          </GlassCard>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
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
            {/* Instructions */}
            <GlassCard variant="subtle" className="p-6">
              <h3 className="text-lg font-semibold text-text mb-4">Instructions</h3>
              <div className="prose prose-sm max-w-none text-textSecondary">
                <p>This assessment covers the fundamental concepts of machine learning including:</p>
                <ul>
                  <li>Supervised vs Unsupervised Learning</li>
                  <li>Linear and Logistic Regression</li>
                  <li>Decision Trees and Random Forests</li>
                  <li>Neural Networks Basics</li>
                  <li>Model Evaluation Metrics</li>
                </ul>
                <p>You have 60 minutes to complete this assessment. Make sure to show your work for partial credit.</p>
              </div>
            </GlassCard>

            {/* Progress */}
            {userRole === 'faculty' && (
              <GlassCard variant="subtle" className="p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Submission Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-textSecondary">Overall Progress</span>
                    <span className="font-medium text-text">
                      {stats.submitted}/{stats.total} ({Math.round((stats.submitted / stats.total) * 100)}%)
                    </span>
                  </div>
                  <ProgressIndicator
                    value={(stats.submitted / stats.total) * 100}
                    color="primary"
                    showLabel={false}
                  />
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {activeTab === 'submissions' && userRole === 'faculty' && (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-text">Student Submissions</h3>
              <button
                onClick={onDownloadSubmissions}
                className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download All</span>
              </button>
            </div>

            {/* Submissions List */}
            <div className="space-y-4">
              {submissions.map(submission => (
                <GlassCard key={submission.id} variant="subtle" className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-text">{submission.studentName}</h4>
                        <Badge variant="glass" className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                        {submission.score !== undefined && (
                          <Badge variant="glass" className="bg-success">
                            {submission.score}/{assessment.maxScore}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-textSecondary mb-1">{submission.studentEmail}</p>
                      <p className="text-sm text-textSecondary">
                        Submitted: {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onGradeSubmission?.(submission)}
                        className="px-3 py-1 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm"
                      >
                        {submission.status === 'graded' ? 'Review' : 'Grade'}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && userRole === 'faculty' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grade Distribution */}
            <GlassCard variant="subtle" className="p-6">
              <h3 className="text-lg font-semibold text-text mb-4">Grade Distribution</h3>
              <AnimatedBarChart
                data={getGradeDistribution()}
                height={250}
                variant="gradient"
                chartId="gradeDistribution"
              />
            </GlassCard>

            {/* Submission Trend */}
            <GlassCard variant="subtle" className="p-6">
              <h3 className="text-lg font-semibold text-text mb-4">Submission Timeline</h3>
              <AnimatedLineChart
                data={getSubmissionTrend()}
                lines={[{ dataKey: 'submissions', color: '#6366f1' }]}
                height={250}
                chartId="submissionTrend"
              />
            </GlassCard>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export type { Submission };
