import { Clock } from 'lucide-react';
import { GlassCard } from '../ui';
import { useWindowStatus } from '../../hooks/useWindowStatus';

interface WindowClosedMessageProps {
  windowType: 'proposal' | 'application' | 'submission' | 'assessment' | 'grade_release';
  projectType?: string;
  assessmentType?: string;
}

export function WindowClosedMessage({ 
  windowType, 
  projectType, 
  assessmentType 
}: WindowClosedMessageProps) {
  const { windows } = useWindowStatus();
  
  const window = windows.find(w => 
    w.windowType === windowType &&
    (!projectType || w.projectType === projectType) &&
    (!assessmentType || w.assessmentType === assessmentType)
  );

  const windowTypeLabels: Record<string, string> = {
    proposal: 'Project Proposal',
    application: 'Application',
    submission: 'Submission',
    assessment: 'Assessment',
    grade_release: 'Grade Release'
  };
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <GlassCard variant="elevated" className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-warning" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Window Closed</h2>
        <p className="text-textSecondary mb-4">
          The {windowTypeLabels[windowType] || windowType} window is not currently open.
        </p>
        {window ? (
          <div className="bg-surface/50 rounded-lg p-4 text-sm space-y-2">
            <div>
              <p className="text-textSecondary">Opens:</p>
              <p className="text-text font-medium">
                {new Date(window.startDate).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-textSecondary">Closes:</p>
              <p className="text-text font-medium">
                {new Date(window.endDate).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-textSecondary">
            No window has been scheduled yet. Please check back later.
          </p>
        )}
      </GlassCard>
    </div>
  );
}
