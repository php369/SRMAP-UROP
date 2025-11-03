import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input, Badge, GlassCard, GlowButton } from '../ui';
import { cn } from '../../utils/cn';

interface AssessmentFormData {
  title: string;
  description: string;
  course: string;
  cohort: string;
  dueDate: string;
  dueTime: string;
  timezone: string;
  maxScore: number;
  instructions: string;
  allowLateSubmissions: boolean;
  latePenalty: number;
  maxAttempts: number;
  showScoreImmediately: boolean;
  requireMeetingAttendance: boolean;
  meetingDate?: string;
  meetingTime?: string;
  tags: string[];
}

interface AssessmentFormProps {
  initialData?: Partial<AssessmentFormData>;
  availableCourses: string[];
  availableCohorts: string[];
  onSubmit: (data: AssessmentFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
  className?: string;
}

export function AssessmentForm({
  initialData,
  availableCourses,
  availableCohorts,
  onSubmit,
  onCancel,
  loading = false,
  mode,
  className,
}: AssessmentFormProps) {
  const [formData, setFormData] = useState<AssessmentFormData>({
    title: '',
    description: '',
    course: '',
    cohort: '',
    dueDate: '',
    dueTime: '23:59',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    maxScore: 100,
    instructions: '',
    allowLateSubmissions: false,
    latePenalty: 10,
    maxAttempts: 1,
    showScoreImmediately: false,
    requireMeetingAttendance: false,
    tags: [],
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  // Set default due date to tomorrow
  useEffect(() => {
    if (!initialData?.dueDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        dueDate: tomorrow.toISOString().split('T')[0],
      }));
    }
  }, [initialData]);

  const updateField = (field: keyof AssessmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.course) {
      newErrors.course = 'Course is required';
    }

    if (!formData.cohort) {
      newErrors.cohort = 'Cohort is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
      if (dueDateTime <= new Date()) {
        newErrors.dueDate = 'Due date must be in the future';
      }
    }

    if (formData.maxScore <= 0) {
      newErrors.maxScore = 'Max score must be greater than 0';
    }

    if (formData.allowLateSubmissions && (formData.latePenalty < 0 || formData.latePenalty > 100)) {
      newErrors.latePenalty = 'Late penalty must be between 0 and 100';
    }

    if (formData.maxAttempts < 1) {
      newErrors.maxAttempts = 'Max attempts must be at least 1';
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

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateField('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateField('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

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
              {mode === 'create' ? 'Create New Assessment' : 'Edit Assessment'}
            </h1>
            <p className="text-textSecondary">
              {mode === 'create' 
                ? 'Set up a new assessment with Google Meet integration and automatic grading.'
                : 'Update assessment details and settings.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-text border-b border-border pb-2">
                Basic Information
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-text mb-2">
                    Assessment Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g., Machine Learning Midterm Exam"
                    error={errors.title}
                    className="w-full"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-text mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Provide a detailed description of the assessment..."
                    rows={4}
                    className={cn(
                      'w-full px-4 py-3 bg-surface border border-border rounded-lg text-text placeholder-textSecondary',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                      'resize-vertical min-h-[100px]',
                      errors.description && 'border-error focus:ring-error'
                    )}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-error">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Course *
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) => updateField('course', e.target.value)}
                    className={cn(
                      'w-full px-4 py-3 bg-surface border border-border rounded-lg text-text',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                      errors.course && 'border-error focus:ring-error'
                    )}
                  >
                    <option value="">Select a course</option>
                    {availableCourses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                  {errors.course && (
                    <p className="mt-1 text-sm text-error">{errors.course}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Cohort *
                  </label>
                  <select
                    value={formData.cohort}
                    onChange={(e) => updateField('cohort', e.target.value)}
                    className={cn(
                      'w-full px-4 py-3 bg-surface border border-border rounded-lg text-text',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                      errors.cohort && 'border-error focus:ring-error'
                    )}
                  >
                    <option value="">Select a cohort</option>
                    {availableCohorts.map(cohort => (
                      <option key={cohort} value={cohort}>{cohort}</option>
                    ))}
                  </select>
                  {errors.cohort && (
                    <p className="mt-1 text-sm text-error">{errors.cohort}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Due Date and Time */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-text border-b border-border pb-2">
                Due Date & Time
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Due Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => updateField('dueDate', e.target.value)}
                    error={errors.dueDate}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Due Time
                  </label>
                  <Input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => updateField('dueTime', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => updateField('timezone', e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Assessment Settings */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-text border-b border-border pb-2">
                Assessment Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Maximum Score *
                  </label>
                  <Input
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) => updateField('maxScore', parseInt(e.target.value) || 0)}
                    min="1"
                    error={errors.maxScore}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Maximum Attempts
                  </label>
                  <Input
                    type="number"
                    value={formData.maxAttempts}
                    onChange={(e) => updateField('maxAttempts', parseInt(e.target.value) || 1)}
                    min="1"
                    error={errors.maxAttempts}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.allowLateSubmissions}
                    onChange={(e) => updateField('allowLateSubmissions', e.target.checked)}
                    className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-text">Allow late submissions</span>
                </label>

                {formData.allowLateSubmissions && (
                  <div className="ml-7">
                    <label className="block text-sm font-medium text-text mb-2">
                      Late Penalty (% per day)
                    </label>
                    <Input
                      type="number"
                      value={formData.latePenalty}
                      onChange={(e) => updateField('latePenalty', parseInt(e.target.value) || 0)}
                      min="0"
                      max="100"
                      error={errors.latePenalty}
                      className="w-32"
                    />
                  </div>
                )}

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.showScoreImmediately}
                    onChange={(e) => updateField('showScoreImmediately', e.target.checked)}
                    className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-text">Show score immediately after submission</span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.requireMeetingAttendance}
                    onChange={(e) => updateField('requireMeetingAttendance', e.target.checked)}
                    className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-text">Require Google Meet attendance</span>
                </label>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-text border-b border-border pb-2">
                Instructions
              </h2>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Detailed Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => updateField('instructions', e.target.value)}
                  placeholder="Provide detailed instructions for students..."
                  rows={6}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical min-h-[150px]"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-text border-b border-border pb-2">
                Tags
              </h2>

              <div>
                <div className="flex space-x-2 mb-3">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="glass"
                      className="bg-primary/20 text-primary flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-primary/70"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
              <GlowButton
                type="submit"
                loading={loading}
                className="flex-1 sm:flex-none"
              >
                {mode === 'create' ? 'Create Assessment' : 'Update Assessment'}
              </GlowButton>

              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 sm:flex-none px-6 py-3 bg-surface border border-border text-text rounded-lg hover:bg-surface/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              {mode === 'create' && (
                <button
                  type="button"
                  onClick={() => {
                    // Save as draft functionality
                    console.log('Save as draft');
                  }}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-6 py-3 bg-warning/20 border border-warning/30 text-warning rounded-lg hover:bg-warning/30 transition-colors disabled:opacity-50"
                >
                  Save as Draft
                </button>
              )}
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export type { AssessmentFormData };