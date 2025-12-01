import React, { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SubmissionService } from '../../services/submissionService';
import { CreateGroupSubmissionData } from '../../types';
import { Upload, FileText, Presentation, Github, AlertCircle, CheckCircle, X } from 'lucide-react';

interface SubmissionFormProps {
  groupId: string;
  onSubmissionCreated: () => void;
  onCancel: () => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  groupId,
  onSubmissionCreated,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateGroupSubmissionData>({
    groupId,
    githubUrl: '',
    presentationUrl: '',
    comments: ''
  });
  
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const reportFileRef = useRef<HTMLInputElement>(null);
  const presentationFileRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof CreateGroupSubmissionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (type: 'report' | 'presentation', file: File | null) => {
    if (!file) return;

    const validation = SubmissionService.validateFile(file, type);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [`${type}File`]: validation.error! }));
      return;
    }

    if (type === 'report') {
      setReportFile(file);
      setErrors(prev => ({ ...prev, reportFile: '' }));
    } else {
      setPresentationFile(file);
      setErrors(prev => ({ ...prev, presentationFile: '' }));
    }
  };

  const removeFile = (type: 'report' | 'presentation') => {
    if (type === 'report') {
      setReportFile(null);
      if (reportFileRef.current) reportFileRef.current.value = '';
    } else {
      setPresentationFile(null);
      if (presentationFileRef.current) presentationFileRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate GitHub URL
    if (!formData.githubUrl.trim()) {
      newErrors.githubUrl = 'GitHub repository URL is required';
    } else {
      const githubValidation = SubmissionService.validateGitHubUrl(formData.githubUrl);
      if (!githubValidation.isValid) {
        newErrors.githubUrl = githubValidation.error!;
      }
    }

    // Validate presentation URL if provided
    if (formData.presentationUrl) {
      const urlValidation = SubmissionService.validatePresentationUrl(formData.presentationUrl);
      if (!urlValidation.isValid) {
        newErrors.presentationUrl = urlValidation.error!;
      }
    }

    // Check that either presentation file or URL is provided (but not both)
    const hasPresentationFile = !!presentationFile;
    const hasPresentationUrl = !!formData.presentationUrl?.trim();
    
    if (hasPresentationFile && hasPresentationUrl) {
      newErrors.presentation = 'Please provide either a presentation file OR a presentation URL, not both';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const submissionData: CreateGroupSubmissionData = {
        ...formData,
        reportFile: reportFile || undefined,
        presentationFile: presentationFile || undefined
      };

      await SubmissionService.createSubmission(submissionData);
      onSubmissionCreated();
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.error || 'Failed to create submission' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-textPrimary mb-2">Submit Project</h2>
        <p className="text-textSecondary">
          Upload your project files and provide the GitHub repository link. 
          All fields except comments are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GitHub URL */}
        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">
            <Github className="inline w-4 h-4 mr-2" />
            GitHub Repository URL *
          </label>
          <Input
            type="url"
            value={formData.githubUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('githubUrl', e.target.value)}
            placeholder="https://github.com/username/repository"
            error={errors.githubUrl}
            disabled={isSubmitting}
          />
          <p className="text-xs text-textSecondary mt-1">
            Provide the link to your project's GitHub repository
          </p>
        </div>

        {/* Report File */}
        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">
            <FileText className="inline w-4 h-4 mr-2" />
            Project Report (PDF, max 50MB)
          </label>
          <div className="space-y-2">
            <input
              ref={reportFileRef}
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileSelect('report', e.target.files?.[0] || null)}
              className="hidden"
            />
            
            {!reportFile ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => reportFileRef.current?.click()}
                disabled={isSubmitting}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Report File (PDF)
              </Button>
            ) : (
              <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <span className="text-sm text-textPrimary">{reportFile.name}</span>
                  <Badge variant="secondary">
                    {SubmissionService.formatFileSize(reportFile.size)}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('report')}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            
            {errors.reportFile && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.reportFile}
              </p>
            )}
          </div>
        </div>

        {/* Presentation */}
        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">
            <Presentation className="inline w-4 h-4 mr-2" />
            Presentation (File OR URL)
          </label>
          
          {/* Presentation File */}
          <div className="space-y-3">
            <div>
              <input
                ref={presentationFileRef}
                type="file"
                accept=".pdf,.ppt,.pptx"
                onChange={(e) => handleFileSelect('presentation', e.target.files?.[0] || null)}
                className="hidden"
              />
              
              {!presentationFile ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => presentationFileRef.current?.click()}
                  disabled={isSubmitting || !!formData.presentationUrl?.trim()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Presentation File (PDF, PPT, PPTX)
                </Button>
              ) : (
                <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Presentation className="w-4 h-4 text-accent" />
                    <span className="text-sm text-textPrimary">{presentationFile.name}</span>
                    <Badge variant="secondary">
                      {SubmissionService.formatFileSize(presentationFile.size)}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile('presentation')}
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="text-center text-textSecondary text-sm">OR</div>

            {/* Presentation URL */}
            <Input
              type="url"
              value={formData.presentationUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('presentationUrl', e.target.value)}
              placeholder="https://docs.google.com/presentation/d/..."
              error={errors.presentationUrl}
              disabled={isSubmitting || !!presentationFile}
            />
            
            {errors.presentationFile && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.presentationFile}
              </p>
            )}
            
            {errors.presentation && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.presentation}
              </p>
            )}
          </div>
          
          <p className="text-xs text-textSecondary mt-1">
            Upload a file or provide a link to Google Slides, Canva, Prezi, etc.
          </p>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-medium text-textPrimary mb-2">
            Additional Comments (Optional)
          </label>
          <Textarea
            value={formData.comments}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('comments', e.target.value)}
            placeholder="Any additional notes or comments about your submission..."
            rows={3}
            maxLength={1000}
            disabled={isSubmitting}
          />
          <p className="text-xs text-textSecondary mt-1">
            {formData.comments?.length || 0}/1000 characters
          </p>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {errors.submit}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Project
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};