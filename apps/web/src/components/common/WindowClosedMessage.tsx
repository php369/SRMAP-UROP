import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui';
import { useWindowStatus } from '../../hooks/useWindowStatus';


interface WindowClosedMessageProps {
  windowType: 'proposal' | 'application' | 'submission' | 'assessment' | 'grade_release';
  projectType?: string;
  assessmentType?: string;
  showAllProjectTypes?: boolean; // For faculty pages
}

export function WindowClosedMessage({ 
  windowType, 
  projectType, 
  assessmentType,
  showAllProjectTypes = false
}: WindowClosedMessageProps) {
  const { windows } = useWindowStatus();
  
  const windowTypeLabels: Record<string, string> = {
    proposal: 'Project Proposal',
    application: 'Application',
    submission: 'Submission',
    assessment: 'Assessment',
    grade_release: 'Grade Release'
  };

  const projectTypes = showAllProjectTypes ? ['IDP', 'UROP', 'CAPSTONE'] : [projectType].filter((pt): pt is string => Boolean(pt));
  
  const getWindowInfo = (pType: string) => {
    const relevantWindows = windows.filter(w => 
      w.windowType === windowType &&
      w.projectType === pType &&
      (!assessmentType || w.assessmentType === assessmentType)
    );

    if (relevantWindows.length === 0) {
      return { status: 'no-window', message: `No ${windowTypeLabels[windowType]} window scheduled for ${pType}` };
    }

    const now = new Date();
    const activeWindow = relevantWindows.find(w => {
      const start = new Date(w.startDate);
      const end = new Date(w.endDate);
      return now >= start && now <= end;
    });

    if (activeWindow) {
      return { 
        status: 'active', 
        window: activeWindow,
        message: `${pType} ${windowTypeLabels[windowType]} window is currently active`
      };
    }

    const upcomingWindow = relevantWindows.find(w => new Date(w.startDate) > now);
    if (upcomingWindow) {
      return { 
        status: 'upcoming', 
        window: upcomingWindow,
        message: `${pType} ${windowTypeLabels[windowType]} window opens ${new Date(upcomingWindow.startDate).toLocaleString()}`
      };
    }

    const pastWindow = relevantWindows
      .filter(w => new Date(w.endDate) < now)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
    
    if (pastWindow) {
      return { 
        status: 'ended', 
        window: pastWindow,
        message: `${pType} ${windowTypeLabels[windowType]} window ended ${new Date(pastWindow.endDate).toLocaleString()}`
      };
    }

    return { status: 'no-window', message: `No ${windowTypeLabels[windowType]} window found for ${pType}` };
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <GlassCard variant="elevated" className="max-w-2xl w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">
            {windowTypeLabels[windowType]} Window Status
          </h2>
          <p className="text-textSecondary">
            {showAllProjectTypes 
              ? `Current status for all project types`
              : `Current status for ${projectType || 'your project type'}`}
          </p>
        </div>

        <div className="space-y-4">
          {projectTypes.map((pType) => {
            const info = getWindowInfo(pType);
            return (
              <div key={pType} className="bg-surface/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-text">{pType}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    info.status === 'active' ? 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300' :
                    info.status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300' :
                    info.status === 'ended' ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300' :
                    'bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-300'
                  }`}>
                    {info.status === 'active' ? 'Active' :
                     info.status === 'upcoming' ? 'Upcoming' :
                     info.status === 'ended' ? 'Ended' : 'Not Scheduled'}
                  </span>
                </div>
                
                <p className="text-sm text-textSecondary mb-2">{info.message}</p>
                
                {info.window && (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-textSecondary flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Opens:
                      </p>
                      <p className="text-text font-medium">
                        {new Date(info.window.startDate).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-textSecondary flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Closes:
                      </p>
                      <p className="text-text font-medium">
                        {new Date(info.window.endDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showAllProjectTypes && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-800 dark:text-blue-300 font-medium mb-1">Faculty Information</p>
                <p className="text-blue-700 dark:text-blue-400">
                  As faculty, you can manage content for any project type when their respective windows are active.
                  Contact the coordinator to schedule or modify window timings.
                </p>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
