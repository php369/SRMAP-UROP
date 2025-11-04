import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GradingInterface } from '../../components/grading/GradingInterface';
import { LoadingSpinner, GlassCard } from '../../components/ui';
import { useGrading, useSubmissionGrading } from '../../hooks/api/useGrading';
import { GradingData } from '../../types';

export function GradeSubmissionPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  
  const {
    submission,
    rubric,
    gradeHistory,
    loading: dataLoading,
    error: dataError,
    refreshData,
  } = useSubmissionGrading(submissionId!);

  const {
    loading: gradingLoading,
    error: gradingError,
    submitGrade,
    updateGrade,
    saveDraft,
    restoreGradeVersion,
    clearError,
  } = useGrading();

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (!submissionId) {
      navigate('/submissions');
    }
  }, [submissionId, navigate]);

  useEffect(() => {
    if (gradingError) {
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gradingError, clearError]);

  const handleSubmitGrade = async (gradingData: GradingData) => {
    if (!submission) return;

    let result;
    if (submission.grade) {
      // Update existing grade
      result = await updateGrade(submission.grade.id, gradingData);
    } else {
      // Submit new grade
      result = await submitGrade(submission.id, gradingData);
    }

    if (result) {
      setShowSuccessMessage(true);
      refreshData();
      
      // Auto-hide success message
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  };

  const handleSaveDraft = async (gradingData: GradingData) => {
    if (!submission) return;

    const success = await saveDraft(submission.id, gradingData);
    if (success) {
      // Show brief success indication
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
    }
  };

  const handleCancel = () => {
    // Navigate back to submissions or assessment detail
    if (submission) {
      navigate(`/assessments/${submission.assessmentId}`);
    } else {
      navigate('/submissions');
    }
  };

  const handleRestoreVersion = async (version: number) => {
    if (!submission?.grade) return;

    const result = await restoreGradeVersion(submission.grade.id, version);
    if (result) {
      refreshData();
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-textSecondary">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (dataError || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard variant="subtle" className="p-8 text-center max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-text mb-2">
            {dataError || 'Submission Not Found'}
          </h2>
          <p className="text-textSecondary mb-6">
            {dataError 
              ? 'There was an error loading the submission data.'
              : 'The submission you\'re looking for doesn\'t exist or you don\'t have permission to grade it.'
            }
          </p>
          <button
            onClick={() => navigate('/submissions')}
            className="px-6 py-3 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Submissions
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50"
          >
            <GlassCard variant="elevated" className="p-4 bg-success/20 border-success/30">
              <div className="flex items-center space-x-3">
                <div className="text-success text-xl">✅</div>
                <div>
                  <p className="font-medium text-success">Success!</p>
                  <p className="text-sm text-success/80">
                    {submission.grade ? 'Grade updated successfully' : 'Grade submitted successfully'}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Error Message */}
        {gradingError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <GlassCard variant="subtle" className="p-4 bg-error/20 border-error/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-error text-xl">❌</div>
                  <div>
                    <p className="font-medium text-error">Error</p>
                    <p className="text-sm text-error/80">{gradingError}</p>
                  </div>
                </div>
                <button
                  onClick={clearError}
                  className="text-error hover:text-error/80 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Grading Interface */}
        <GradingInterface
          submission={submission}
          rubric={rubric}
          gradeHistory={gradeHistory}
          onSubmitGrade={handleSubmitGrade}
          onSaveDraft={handleSaveDraft}
          onCancel={handleCancel}
          onRestoreVersion={handleRestoreVersion}
          loading={gradingLoading}
        />
      </div>
    </div>
  );
}
