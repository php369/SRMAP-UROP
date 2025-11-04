import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileUpload, UploadedFile } from './FileUpload';
import { GlassCard, GlowButton } from '../ui';
import { Assessment } from '../assessments';
import { cn } from '../../utils/cn';

interface SubmissionFormData {
  files: UploadedFile[];
  notes: string;
  acknowledgment: boolean;
}

interface SubmissionFormProps {
  assessment: Assessment;
  existingSubmission?: {
    id: string;
    files: UploadedFile[];
    notes: string;
    submittedAt: string;
    attempt: number;
  };
  onSubmit: (data: SubmissionFormData) => void;
  onSaveDraft?: (data: SubmissionFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

export function SubmissionForm({
  assessment,
  existingSubmission,
  onSubmit,
  onSaveDraft,
  onCancel,
  loading = false,
  className,
}: SubmissionFormProps) {
  const [formData, setFormData] = useState<SubmissionFormData>({
    files: existingSubmission?.files || [],
    notes: existingSubmission?.notes || '',
    acknowledgment: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof SubmissionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.files.length === 0) {
      newErrors.files = 'At least one file is required';
    }

    const hasIncompleteUploads = formData.files.some(f => f.status === 'uploading');
    if (hasIncompleteUploads) {
      newErrors.files = 'Please wait for all files to finish uploading';
    }

    const hasFailedUploads = formData.files.some(f => f.status === 'error');
    if (hasFailedUploads) {
      newErrors.files = 'Please fix or remove failed uploads';
    }

    if (!formData.acknowledgment) {
      newErrors.acknowledgment = 'You must acknowledge the submission terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleSaveDraft = () => {
    if (formData.files.length > 0 || formData.notes.trim()) {
      onSaveDraft?.(formData);
    }
  };

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

  const isOverdue = new Date(assessment.dueDate) < new Date();
  const timeUntilDue = new Date(assessment.dueDate).getTime() - new Date().getTime();
  const hoursUntilDue = Math.floor(timeUntilDue / (1000 * 60 * 60));
  const isDueSoon = hoursUntilDue <= 24 && hoursUntilDue > 0;

  const completedFiles = formData.files.filter(f => f.status === 'completed');
  const canSubmit = completedFiles.length > 0 && formData.acknowledgment && !loading;

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard variant="elevated" className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">
              {existingSubmission ? 'Update Submission' : 'Submit Assignment'}
            </h1>
            <h2 className="text-xl text-textSecondary mb-4">{assessment.title}</h2>
            
            {/* Due Date Warning */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={cn(
                  isOverdue ? 'text-error' : isDueSoon ? 'text-warning' : 'text-textSecondary'
                )}>
                  Due: {formatDate(assessment.dueDate)}
                </span>
              </div>
              
              {isOverdue && (
                <div className="px-2 py-1 bg-error/20 text-error rounded text-xs font-medium">
                  ⚠️ OVERDUE
                </div>
              )}
              
              {isDueSoon && !isOverdue && (
                <div className="px-2 py-1 bg-warning/20 text-warning rounded text-xs font-medium">
                  ⏰ DUE SOON ({hoursUntilDue}h remaining)
                </div>
              )}
            </div>

            {existingSubmission && (
              <div className="mt-4 p-4 bg-info/10 border border-info/20 rounded-lg">
                <p className="text-sm text-info">
                  <strong>Previous Submission:</strong> Submitted on {formatDate(existingSubmission.submittedAt)} 
                  (Attempt {existingSubmission.attempt})
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* File Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text">Upload Files</h3>
                <div className="text-sm text-textSecondary">
                  {completedFiles.length} file{completedFiles.length !== 1 ? 's' : ''} ready
                </div>
              </div>
              
              <FileUpload
                onFilesChange={(files) => updateField('files', files)}
                disabled={loading}
              />
              
              {errors.files && (
                <p className="text-sm text-error">{errors.files}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">Additional Notes</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Add any additional comments or notes about your submission..."
                rows={4}
                className={cn(
                  'w-full px-4 py-3 bg-surface border border-border rounded-lg text-text placeholder-textSecondary',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  'resize-vertical min-h-[100px]'
                )}
                disabled={loading}
              />
              <p className="text-sm text-textSecondary">
                Optional: Explain your approach, challenges faced, or any other relevant information.
              </p>
            </div>

            {/* Submission Guidelines */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text">Submission Guidelines</h3>
              <div className="bg-surface/50 border border-border rounded-lg p-4">
                <ul className="space-y-2 text-sm text-textSecondary">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Ensure all files are properly named and organized</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Include all required deliverables as specified in the assignment</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Double-check that your code compiles and runs correctly</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Late submissions may incur penalties as per course policy</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Acknowledgment */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="acknowledgment"
                  checked={formData.acknowledgment}
                  onChange={(e) => updateField('acknowledgment', e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
                  disabled={loading}
                />
                <label htmlFor="acknowledgment" className="text-sm text-text">
                  I acknowledge that this submission is my own work and I have not violated any academic integrity policies. 
                  I understand that plagiarism or unauthorized collaboration may result in academic penalties.
                </label>
              </div>
              {errors.acknowledgment && (
                <p className="text-sm text-error ml-7">{errors.acknowledgment}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
              <GlowButton
                type="submit"
                loading={loading}
                disabled={!canSubmit}
                className="flex-1 sm:flex-none"
              >
                {existingSubmission ? 'Update Submission' : 'Submit Assignment'}
              </GlowButton>

              {onSaveDraft && (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={loading || (formData.files.length === 0 && !formData.notes.trim())}
                  className="flex-1 sm:flex-none px-6 py-3 bg-warning/20 border border-warning/30 text-warning rounded-lg hover:bg-warning/30 transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
              )}

              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 sm:flex-none px-6 py-3 bg-surface border border-border text-text rounded-lg hover:bg-surface/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export type { SubmissionFormData };
