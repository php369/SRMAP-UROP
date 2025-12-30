import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { GroupSubmission } from '../../types';
import { SubmissionService } from '../../services/submissionService';
import { openPDFModal, downloadFile } from '../../utils/pdfUtils';
import { 
  FileText, 
  Presentation, 
  Github, 
  Calendar, 
  User, 
  MessageSquare,
  ExternalLink,
  Download,
  Edit3,
  Save,
  X
} from 'lucide-react';

interface SubmissionCardProps {
  submission: GroupSubmission;
  onUpdate?: (updatedSubmission: GroupSubmission) => void;
  showGroupInfo?: boolean;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  onUpdate,
  showGroupInfo = false
}) => {
  const [isEditingComments, setIsEditingComments] = useState(false);
  const [editedComments, setEditedComments] = useState(submission.comments || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateComments = async () => {
    if (editedComments === submission.comments) {
      setIsEditingComments(false);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedSubmission = await SubmissionService.updateSubmissionComments(
        submission._id,
        editedComments
      );
      
      if (onUpdate) {
        onUpdate(updatedSubmission);
      }
      
      setIsEditingComments(false);
    } catch (error) {
      console.error('Failed to update comments:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelEdit = () => {
    setEditedComments(submission.comments || '');
    setIsEditingComments(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-textPrimary mb-1">
              Project Submission
            </h3>
            {showGroupInfo && (
              <p className="text-sm text-textSecondary">
                Group: {(submission.groupId as any)?.code || submission.groupId}
              </p>
            )}
          </div>
          <Badge variant="success">
            {submission.status}
          </Badge>
        </div>

        {/* Submission Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-textSecondary" />
            <span className="text-textSecondary">Submitted:</span>
            <span className="text-textPrimary">{formatDate(submission.submittedAt)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-textSecondary" />
            <span className="text-textSecondary">By:</span>
            <span className="text-textPrimary">{submission.submittedBy.name}</span>
          </div>
        </div>

        {/* GitHub Repository */}
        <div className="space-y-2">
          <h4 className="font-medium text-textPrimary flex items-center">
            <Github className="w-4 h-4 mr-2" />
            GitHub Repository
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openLink(submission.githubUrl)}
            className="w-full justify-start"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {submission.githubUrl}
          </Button>
        </div>

        {/* Report File */}
        {submission.reportFile && (
          <div className="space-y-2">
            <h4 className="font-medium text-textPrimary flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Project Report
            </h4>
            <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-accent" />
                <span className="text-sm text-textPrimary">{submission.reportFile.name}</span>
                <Badge variant="secondary">
                  {SubmissionService.formatFileSize(submission.reportFile.size)}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openPDFModal(submission.reportFile!.url, 'Project Report')}
                  title="View PDF in modal"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadFile(submission.reportFile!.url, 'project-report.pdf')}
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Presentation */}
        {(submission.presentationFile || submission.presentationUrl) && (
          <div className="space-y-2">
            <h4 className="font-medium text-textPrimary flex items-center">
              <Presentation className="w-4 h-4 mr-2" />
              Presentation
            </h4>
            
            {submission.presentationFile ? (
              <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Presentation className="w-4 h-4 text-accent" />
                  <span className="text-sm text-textPrimary">{submission.presentationFile.name}</span>
                  <Badge variant="secondary">
                    {SubmissionService.formatFileSize(submission.presentationFile.size)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {submission.presentationFile.contentType === 'application/pdf' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPDFModal(submission.presentationFile!.url, 'Presentation')}
                      title="View PDF in modal"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPDFModal(submission.presentationFile!.url, 'Presentation')}
                      title="View presentation"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(submission.presentationFile!.url, 'presentation.pdf')}
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : submission.presentationUrl ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openLink(submission.presentationUrl!)}
                className="w-full justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {submission.presentationUrl}
              </Button>
            ) : null}
          </div>
        )}

        {/* Comments */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-textPrimary flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comments
            </h4>
            {onUpdate && !isEditingComments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingComments(true)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {isEditingComments ? (
            <div className="space-y-2">
              <Textarea
                value={editedComments}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedComments(e.target.value)}
                placeholder="Add any additional comments..."
                rows={3}
                maxLength={1000}
                disabled={isUpdating}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-textSecondary">
                  {editedComments.length}/1000 characters
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    disabled={isUpdating}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleUpdateComments}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-surface border border-border rounded-lg">
              {submission.comments ? (
                <p className="text-sm text-textPrimary whitespace-pre-wrap">
                  {submission.comments}
                </p>
              ) : (
                <p className="text-sm text-textSecondary italic">
                  No additional comments provided
                </p>
              )}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-textSecondary">
            <div>
              Total file size: {SubmissionService.formatFileSize(submission.metadata.totalFileSize)}
            </div>
            <div>
              Submitted from: {submission.metadata.ipAddress}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};