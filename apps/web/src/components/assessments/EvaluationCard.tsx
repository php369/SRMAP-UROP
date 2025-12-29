import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { StudentEvaluationView, EvaluationService } from '../../services/evaluationService';
import { 
  FileText, 
  Eye, 
  EyeOff, 
  Award, 
  Calendar,
  ExternalLink,
  Video,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface EvaluationCardProps {
  evaluationView: StudentEvaluationView;
  onJoinMeeting?: (meetUrl: string) => void;
}

export const EvaluationCard: React.FC<EvaluationCardProps> = ({
  evaluationView,
  onJoinMeeting
}) => {
  const { evaluation, groupCode, projectTitle, hasSubmission, meetUrl } = evaluationView;
  const componentDetails = EvaluationService.getComponentDetails();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    if (!evaluation) {
      return <Badge variant="secondary">Not Evaluated</Badge>;
    }
    
    if (evaluation.isPublished) {
      const gradeLetter = EvaluationService.getGradeLetter(evaluation.total);
      return <Badge variant="success">{gradeLetter.letter} Grade</Badge>;
    }
    
    const progress = EvaluationService.getEvaluationProgress(evaluation);
    if (progress === 100) {
      return <Badge variant="warning">Evaluation Complete</Badge>;
    } else if (progress > 0) {
      return <Badge variant="info">In Progress ({progress}%)</Badge>;
    } else {
      return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const renderScoreComponent = (
    componentKey: 'cla1' | 'cla2' | 'cla3',
    component: { conduct: number; convert: number }
  ) => {
    const details = componentDetails[componentKey];
    const hasScore = component.conduct > 0;
    
    return (
      <div className="p-4 bg-surface border border-border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-textPrimary">{details.name}</h4>
          {evaluation?.isPublished ? (
            hasScore ? (
              <Badge variant="success">
                {EvaluationService.formatScore(component.convert, details.maxConvert)}
              </Badge>
            ) : (
              <Badge variant="secondary">Not Graded</Badge>
            )
          ) : (
            <div className="flex items-center text-textSecondary">
              <EyeOff className="w-4 h-4 mr-1" />
              <span className="text-sm">Hidden</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-textSecondary mb-3">{details.description}</p>
        
        {evaluation?.isPublished && hasScore ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-textSecondary">Raw Score:</span>
              <span className="text-textPrimary">
                {EvaluationService.formatScore(component.conduct, details.maxConduct)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-textSecondary">Converted:</span>
              <span className="text-textPrimary font-medium">
                {EvaluationService.formatScore(component.convert, details.maxConvert)}
              </span>
            </div>
            <Progress 
              value={(component.convert / details.maxConvert) * 100} 
              className="h-2"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 text-textSecondary">
            {evaluation?.isPublished ? (
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">No score recorded</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">Scores will be visible after publication</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderExternalComponent = () => {
    const component = evaluation?.external.reportPresentation;
    const details = componentDetails.external;
    const hasScore = component && component.conduct > 0;
    
    return (
      <div className="p-4 bg-surface border border-border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-textPrimary">{details.name}</h4>
          {evaluation?.isPublished ? (
            hasScore ? (
              <Badge variant="success">
                {EvaluationService.formatScore(component.convert, details.maxConvert)}
              </Badge>
            ) : (
              <Badge variant="secondary">Not Graded</Badge>
            )
          ) : (
            <div className="flex items-center text-textSecondary">
              <EyeOff className="w-4 h-4 mr-1" />
              <span className="text-sm">Hidden</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-textSecondary mb-3">{details.description}</p>
        
        {evaluation?.isPublished && hasScore ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-textSecondary">Raw Score:</span>
              <span className="text-textPrimary">
                {EvaluationService.formatScore(component.conduct, details.maxConduct)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-textSecondary">Converted:</span>
              <span className="text-textPrimary font-medium">
                {EvaluationService.formatScore(component.convert, details.maxConvert)}
              </span>
            </div>
            <Progress 
              value={(component.convert / details.maxConvert) * 100} 
              className="h-2"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 text-textSecondary">
            {evaluation?.isPublished ? (
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">No score recorded</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">Scores will be visible after publication</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-semibold text-textPrimary">
                Group {groupCode}
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-textSecondary mb-2">{projectTitle}</p>
            
            <div className="flex items-center space-x-4 text-sm text-textSecondary">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                <span>Submission: {hasSubmission ? 'Completed' : 'Pending'}</span>
              </div>
              
              {evaluation?.publishedAt && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Published: {formatDate(evaluation.publishedAt)}</span>
                </div>
              )}
            </div>
          </div>
          
          {meetUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onJoinMeeting?.(meetUrl)}
            >
              <Video className="w-4 h-4 mr-2" />
              Join Meeting
            </Button>
          )}
        </div>

        {/* Assessment Components */}
        <div>
          <h4 className="font-medium text-textPrimary mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Assessment Components
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Internal Assessments */}
            {evaluation ? (
              <>
                {renderScoreComponent('cla1', evaluation.internal.cla1)}
                {renderScoreComponent('cla2', evaluation.internal.cla2)}
                {renderScoreComponent('cla3', evaluation.internal.cla3)}
                {renderExternalComponent()}
              </>
            ) : (
              <>
                {(['cla1', 'cla2', 'cla3'] as const).map((key) => (
                  <div key={key} className="p-4 bg-surface border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-textPrimary">
                        {componentDetails[key].name}
                      </h4>
                      <Badge variant="secondary">Not Available</Badge>
                    </div>
                    <p className="text-sm text-textSecondary mb-3">
                      {componentDetails[key].description}
                    </p>
                    <div className="flex items-center justify-center py-4 text-textSecondary">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm">Evaluation not started</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="p-4 bg-surface border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-textPrimary">
                      {componentDetails.external.name}
                    </h4>
                    <Badge variant="secondary">Not Available</Badge>
                  </div>
                  <p className="text-sm text-textSecondary mb-3">
                    {componentDetails.external.description}
                  </p>
                  <div className="flex items-center justify-center py-4 text-textSecondary">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">Evaluation not started</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Total Score */}
        {evaluation?.isPublished && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-textPrimary">Final Grade</h4>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Published</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-surface border border-border rounded-lg">
                <div className="text-2xl font-bold text-textPrimary mb-1">
                  {evaluation.totalInternal.toFixed(1)}
                </div>
                <div className="text-sm text-textSecondary">Internal (50)</div>
              </div>
              
              <div className="text-center p-4 bg-surface border border-border rounded-lg">
                <div className="text-2xl font-bold text-textPrimary mb-1">
                  {evaluation.totalExternal.toFixed(1)}
                </div>
                <div className="text-sm text-textSecondary">External (50)</div>
              </div>
              
              <div className="text-center p-4 bg-accent/10 border border-accent rounded-lg">
                <div className="text-3xl font-bold text-accent mb-1">
                  {evaluation.total.toFixed(1)}
                </div>
                <div className="text-sm text-textSecondary mb-2">Total (100)</div>
                <Badge variant="success" className="text-sm">
                  {EvaluationService.getGradeLetter(evaluation.total).letter}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Submission Status */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {hasSubmission ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-textPrimary">Project submitted successfully</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <span className="text-textPrimary">Project submission pending</span>
                </>
              )}
            </div>
            
            {!hasSubmission && (
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Go to Submissions
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};