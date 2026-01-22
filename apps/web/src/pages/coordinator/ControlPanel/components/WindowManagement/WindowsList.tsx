import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { Window, ProjectType } from '../../types';
import { getWorkflowOrder } from '../../utils/windowHelpers';
import { WindowCard } from './WindowCard';
import { WindowsListSkeleton } from '../LoadingSkeletons';

interface WindowsListProps {
  windows: Window[];
  windowsLoading: boolean;
  showInactiveWindows: boolean;
  onShowInactiveToggle: (show: boolean) => void;
  onEditWindow: (window: Window) => void;
  onDeleteWindow: (window: Window) => void;
  onCreateWindow: () => void;
  selectedIds?: string[];
  onSelectChange?: (id: string, selected: boolean) => void;
  onSelectAll?: (ids: string[], selected: boolean) => void;
}

export function WindowsList({
  windows,
  windowsLoading,
  showInactiveWindows,
  onShowInactiveToggle,
  onEditWindow,
  onDeleteWindow,
  onCreateWindow,
  selectedIds = [],
  onSelectChange,
  onSelectAll
}: WindowsListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  if (windowsLoading) {
    return <WindowsListSkeleton />;
  }

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-surface/50 border border-border rounded-lg"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-medium text-gray-700">Window Display Options:</span>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Show inactive windows</span>
            {/* Toggle Switch */}
            <button
              onClick={() => onShowInactiveToggle(!showInactiveWindows)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${showInactiveWindows ? 'bg-blue-600' : 'bg-gray-300'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showInactiveWindows ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 self-end sm:self-auto">
          {windowsLoading ? 'Loading...' : `${filteredWindows.length} of ${windows.length} windows shown`}
        </div>
      </motion.div>

      {/* Windows organized by project type */}
      {
        (['IDP', 'UROP', 'CAPSTONE'] as ProjectType[]).map((projectType, projectIndex) => {
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

          const projectWindowIds = projectWindows.map(w => w._id);
          const allProjectSelected = projectWindowIds.every(id => selectedIds.includes(id));
          const someProjectSelected = projectWindowIds.some(id => selectedIds.includes(id)) && !allProjectSelected;
          const isCollapsed = collapsedGroups[projectType] || false;

          return (
            <motion.div
              key={projectType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + projectIndex * 0.1 }}
              className="space-y-3"
            >
              <div
                className="flex items-center justify-between group/header cursor-pointer select-none py-2 px-1 hover:bg-slate-50/50 rounded-lg transition-colors"
                onClick={() => toggleGroup(projectType)}
              >
                <div className="flex items-center space-x-3">
                  {onSelectAll && (
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={allProjectSelected}
                        ref={el => {
                          if (el) el.indeterminate = someProjectSelected;
                        }}
                        onChange={(e) => onSelectAll(projectWindowIds, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover/header:text-primary transition-colors" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 group-hover/header:text-primary transition-colors" />
                    )}
                    <h2 className="text-xl font-bold text-text">{projectType}</h2>
                    <span className="px-2 py-1 text-xs bg-surface border border-border text-textSecondary rounded-full">
                      {projectWindows.length} window{projectWindows.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {onSelectAll && (someProjectSelected || allProjectSelected) ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAll?.(projectWindowIds, false);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Deselect {projectWindows.filter(w => selectedIds.includes(w._id)).length} windows
                    </button>
                  ) : null}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 opacity-0 group-hover/header:opacity-100 transition-opacity">
                    {isCollapsed ? 'Expand' : 'Collapse'}
                  </span>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-1">
                      {projectWindows.map((window, windowIndex) => (
                        <motion.div
                          key={window._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * windowIndex }}
                        >
                          <WindowCard
                            window={window}
                            onEdit={onEditWindow}
                            onDelete={onDeleteWindow}
                            isSelected={selectedIds.includes(window._id)}
                            onSelect={onSelectChange}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      }

      {
        windows.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16 bg-surface rounded-lg border border-border border-dashed"
          >
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
              <Calendar className="w-8 h-8 text-textSecondary" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">No Windows Created</h3>
            <p className="text-textSecondary max-w-sm mx-auto text-base px-4 mb-6">
              Get started by creating your first assessment window or setting up a complete semester plan.
            </p>
            <button
              onClick={onCreateWindow}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors mx-auto shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Window
            </button>
          </motion.div>
        )
      }
    </div >
  );
}