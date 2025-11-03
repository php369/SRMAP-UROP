import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, GlassCard, GlowButton, ProgressIndicator, Input } from '../ui';
import { RichTextEditor } from '../ui/RichTextEditor';
import { RubricGrading } from './RubricGrading';
import { GradeHistory } from './GradeHistory';
import { 
  Submission, 
  RubricCriterion, 
  GradeHistory as GradeHistoryType, 
  GradingData,
  RubricScore 
} from '../../types';
import { cn } from '../../utils/cn';

interface GradingInterfaceProps {
  submission: Submission;
  rubric?: RubricCriterion[];
  gradeHistory?: GradeHistoryType[];
  onSubmitGrade: (data: GradingData) => void;
  onSaveDraft: (data: GradingData) => void;
  onCancel: () => void;
  onRestoreVersion?: (version: number) => void;
  loading?: boolean;
  className?: string;
}

export function GradingInterface({
  submission,
  rubric = [],
  gradeHistory = [],
  onSubmitGrade,
  onSaveDraft,
  onCancel,
  onRestoreVersion,
  loading = false,
  className,
}: GradingInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'grading' | 'history'>('grading');
  const [gradingData, setGradingData] = useState<GradingData>({
    score: submission.score || 0,
    feedback: submission.feedback || '',
    rubricScores: [],
    privateNotes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize grading data from existing grade
  useEffect(() => {
    if (submission.grade) {
      setGradingData({
        score: submission.grade.score,
        feedback: submission.grade.feedback,
        rubricScores: submission.grade.rubricScores,
        privateNotes: submission.grade.privateNotes || '',
      });
    }
  }, [submission.grade]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = 
      gradingData.score !== (submission.grade?.score || 0) ||
      gradingData.feedback !== (submission.grade?.feedback || '') ||
      gradingData.privateNotes !== (submission.grade?.privateNotes || '') ||
      JSON.stringify(gradingData.rubricScores) !== JSON.stringify(submission.grade?.rubricScores || []);
    
    setHasUnsavedChanges(hasChanges);
  }, [gradingData, submission.grade]);

  const updateField = (field: keyof GradingData, value: any) => {
    setGradingData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateRubricScores = (scores: RubricScore[]) => {
    setGradingData(prev => ({ ...prev, rubricScores: scores }));
    
    // Auto-calculate total score from rubric if rubric is being used
    if (rubric.length > 0 && scores.length > 0) {
      const totalScore = scores.reduce((sum, score) => sum + (score.customPoints ?? score.points), 0);
      setGradingData(prev => ({ ...prev, score: totalScore }));
    }
  };

  const validateGrading = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (gradingData.score < 0 || gradingData.score > submission.maxScore) {
      newErrors.score = `Score must be between 0 and ${submission.maxScore}`;
    }

    if (!gradingData.feedback.trim() && !gradingData.feedback.replace(/<[^>]*>/g, '').trim()) {
      newErrors.feedback = 'Feedback is required';
    }

    // Validate rubric completion if rubric exists
    if (rubric.length > 0 && gradingData.rubricScores.length === 0) {
      newErrors.rubric = 'Please complete the rubric grading';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitGrade = () => {
    if (validateGrading()) {
      onSubmitGrade(gradingData);
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft(gradingData);
  };

  const handleRestoreVersion = (version: number) => {
    if (onRestoreVersion) {
      onRestoreVersion(version);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'grading', label: 'Grading', icon: '📝', badge: hasUnsavedChanges ? '●' : undefined },
    { id: 'history', label: 'History', icon: '📚', badge: gradeHistory.length || undefined },
  ];

  return (
    <div className={cn('max-w-7xl mx-auto', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text mb-2">
              Grade Submission
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-textSecondary">
              <span className="font-medium text-text">
                {submission.studentName}
              </span>
              <span>{submission.studentEmail}</span>
              <span>Submitted: {formatDate(submission.submittedAt)}</span>
              <Badge
                variant="glass"
                className={
                  submission.status === 'late' ? 'bg-warning' : 'bg-info'
                }
              >
                {submission.status}
              </Badge>
              {submission.grade && (
                <Badge variant="glass" className="bg-success">
                  Previously Graded
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-textSecondary">Max Score</div>
              <div className="text-lg font-semibold text-text">
                {submission.maxScore} pts
              </div>
            </div>
            {hasUnsavedChanges && (
              <Badge variant="glass" className="bg-warning">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </div>

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
                {tab.badge && (
                  <Badge 
                    variant="glass" 
                    size="sm" 
                    className={cn(
                      tab.badge === '●' ? 'bg-warning' : 'bg-primary'
                    )}
                  >
                    {tab.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'grading' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Submission Files */}
                <div className="lg:col-span-1">
                  <GlassCard variant="subtle" className="p-6 h-fit">
                    <h3 className="text-lg font-semibold text-text mb-4">
                      Submitted Files
                    </h3>
                    <div className="space-y-3">
                      {submission.files.map(file => (
                        <div
                          key={file.id}
                          className="flex items-center space-x-3 p-3 bg-surface/50 rounded-lg hover:bg-surface/70 transition-colors"
                        >
                          <div className="text-2xl">📄</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-textSecondary">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <button
                            onClick={() => window.open(file.url, '_blank')}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Download file"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Submission Notes */}
                    {submission.notes && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-text mb-2">Student Notes</h4>
                        <div className="p-3 bg-surface/30 rounded-lg text-sm text-textSecondary">
                          {submission.notes}
                        </div>
                      </div>
                    )}
                  </GlassCard>
                </div>

                {/* Grading Interface */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Rubric Grading */}
                  {rubric.length > 0 && (
                    <RubricGrading
                      rubric={rubric}
                      scores={gradingData.rubricScores}
                      onScoreChange={updateRubricScores}
                      disabled={loading}
                    />
                  )}

                  {/* Manual Score (if no rubric or override) */}
                  <GlassCard variant="elevated" className="p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-text">
                          {rubric.length > 0 ? 'Final Score' : 'Score'}
                        </h3>
                        {rubric.length > 0 && (
                          <Badge variant="glass" className="bg-info">
                            Auto-calculated from rubric
                          </Badge>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Score * (out of {submission.maxScore})
                        </label>
                        <div className="flex items-center space-x-4">
                          <Input
                            type="number"
                            value={gradingData.score}
                            onChange={e =>
                              updateField('score', parseFloat(e.target.value) || 0)
                            }
                            min="0"
                            max={submission.maxScore}
                            step="0.5"
                            error={errors.score}
                            className="w-32"
                            disabled={rubric.length > 0 && gradingData.rubricScores.length > 0}
                          />
                          <div className="flex-1">
                            <ProgressIndicator
                              value={(gradingData.score / submission.maxScore) * 100}
                              color={
                                gradingData.score >= submission.maxScore * 0.9
                                  ? 'success'
                                  : gradingData.score >= submission.maxScore * 0.7
                                    ? 'warning'
                                    : 'error'
                              }
                              showLabel={false}
                            />
                          </div>
                          <div className="text-sm text-textSecondary">
                            {Math.round(
                              (gradingData.score / submission.maxScore) * 100
                            )}
                            %
                          </div>
                        </div>
                        {rubric.length > 0 && gradingData.rubricScores.length > 0 && (
                          <p className="mt-1 text-xs text-textSecondary">
                            Score is automatically calculated from rubric. Edit individual criteria to adjust.
                          </p>
                        )}
                      </div>

                      {/* Feedback with Rich Text Editor */}
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Feedback *
                        </label>
                        <RichTextEditor
                          value={gradingData.feedback}
                          onChange={(value) => updateField('feedback', value)}
                          placeholder="Provide detailed feedback for the student..."
                          error={errors.feedback}
                          minHeight={200}
                          maxHeight={400}
                          disabled={loading}
                        />
                      </div>

                      {/* Private Notes */}
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Private Notes (not visible to student)
                        </label>
                        <textarea
                          value={gradingData.privateNotes}
                          onChange={e => updateField('privateNotes', e.target.value)}
                          placeholder="Add private notes for your records..."
                          rows={3}
                          disabled={loading}
                          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border mt-6">
                      <GlowButton
                        onClick={handleSubmitGrade}
                        loading={loading}
                        className="flex-1 sm:flex-none"
                      >
                        {submission.grade ? 'Update Grade' : 'Submit Grade'}
                      </GlowButton>

                      <button
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="flex-1 sm:flex-none px-6 py-3 bg-secondary/20 border border-secondary/30 text-secondary rounded-lg hover:bg-secondary/30 transition-colors disabled:opacity-50"
                      >
                        Save Draft
                      </button>

                      <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 sm:flex-none px-6 py-3 bg-surface border border-border text-text rounded-lg hover:bg-surface/80 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <GradeHistory
                history={gradeHistory}
                currentVersion={submission.grade?.version || 1}
                onRestoreVersion={handleRestoreVersion}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export type { GradingData };
