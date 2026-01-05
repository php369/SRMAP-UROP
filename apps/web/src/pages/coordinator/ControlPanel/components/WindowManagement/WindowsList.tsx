import { motion } from 'framer-motion';
import { Window, ProjectType } from '../../types';
import { getWorkflowOrder } from '../../utils/windowHelpers';
import { WindowCard } from './WindowCard';

interface WindowsListProps {
  windows: Window[];
  windowsLoading: boolean;
  showInactiveWindows: boolean;
  onShowInactiveToggle: (show: boolean) => void;
  onEditWindow: (window: Window) => void;
  onDeleteWindow: (window: Window) => void;
}

export function WindowsList({ 
  windows, 
  windowsLoading, 
  showInactiveWindows, 
  onShowInactiveToggle,
  onEditWindow,
  onDeleteWindow 
}: WindowsListProps) {
  if (windowsLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Toggle Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-gray-100 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
            <div className="flex items-center space-x-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
              <div className="h-6 w-11 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
        </motion.div>

        {/* Loading Windows by Project Type */}
        {['IDP', 'UROP', 'CAPSTONE'].map((projectType, projectIndex) => (
          <motion.div
            key={projectType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + projectIndex * 0.1 }}
            className="space-y-3"
          >
            {/* Project Type Header Loading */}
            <div className="flex items-center space-x-2">
              <div className="h-7 bg-gray-200 rounded animate-pulse w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
            </div>
            
            {/* Window Cards Loading */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + projectIndex * 0.1 + i * 0.05 }}
                  className="p-4 border-2 border-gray-200 rounded-lg bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Window Title and Status Loading */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
                      </div>
                      {/* Date Information Loading */}
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-44"></div>
                      </div>
                    </div>
                    {/* Action Buttons Loading */}
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  const filteredWindows = windows.filter(w => {
    const now = new Date();
    const start = new Date(w.startDate);
    const end = new Date(w.endDate);
    const isActive = now >= start && now <= end;
    const hasEnded = now > end;
    
    return showInactiveWindows || isActive || !hasEnded;
  });

  return (
    <div className="space-y-6">
      {/* Show/Hide Inactive Windows Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 bg-gray-100 rounded-lg"
      >
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Window Display Options:</span>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Show inactive windows</span>
            {/* Toggle Switch */}
            <button
              onClick={() => onShowInactiveToggle(!showInactiveWindows)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showInactiveWindows ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showInactiveWindows ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {windowsLoading ? 'Loading...' : `${filteredWindows.length} of ${windows.length} windows shown`}
        </div>
      </motion.div>

      {/* Windows organized by project type */}
      {(['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((projectType, projectIndex) => {
        const projectWindows = filteredWindows
          .filter(window => window.projectType === projectType)
          .sort((a, b) => {
            // First, sort by workflow order (proposal → application → submission → assessment → grade_release)
            const aWorkflowOrder = getWorkflowOrder(a.windowType, a.assessmentType);
            const bWorkflowOrder = getWorkflowOrder(b.windowType, b.assessmentType);
            
            if (aWorkflowOrder !== bWorkflowOrder) {
              return aWorkflowOrder - bWorkflowOrder; // Ascending workflow order
            }
            
            // Within same workflow step, sort by start time (earliest first - ascending order)
            const aStart = new Date(a.startDate);
            const bStart = new Date(b.startDate);
            return aStart.getTime() - bStart.getTime();
          });

        if (projectWindows.length === 0) return null;

        return (
          <motion.div
            key={projectType}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + projectIndex * 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-800">{projectType}</h2>
              <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                {projectWindows.length} window{projectWindows.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-3">
              {projectWindows.map((window, windowIndex) => (
                <motion.div
                  key={window._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + projectIndex * 0.1 + windowIndex * 0.05 }}
                >
                  <WindowCard
                    window={window}
                    onEdit={onEditWindow}
                    onDelete={onDeleteWindow}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {windows.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-center text-gray-500 py-8">
            No windows created yet. Create your first window to get started.
          </p>
        </motion.div>
      )}
    </div>
  );
}