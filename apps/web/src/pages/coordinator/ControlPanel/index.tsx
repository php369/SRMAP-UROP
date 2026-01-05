import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, RefreshCw, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

// Hooks
import { useWindowManagement } from './hooks/useWindowManagement';
import { useStats } from './hooks/useStats';
import { useGradeRelease } from './hooks/useGradeRelease';

// Components
import { StatsCards } from './components/Dashboard/StatsCards';
import { LoadingDashboard } from './components/Dashboard/LoadingDashboard';
import { GradeReleaseSection } from './components/Dashboard/GradeReleaseSection';
import { QuickActions } from './components/Dashboard/QuickActions';
import { WindowsList } from './components/WindowManagement/WindowsList';
import { CreationModeModal } from './components/Modals/CreationModeModal';
import { DeleteConfirmationModal } from './components/Modals/DeleteConfirmationModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

// Types
import { Window, ProjectType } from './types';

export function ControlPanel() {
  // State
  const [currentView, setCurrentView] = useState<'dashboard' | 'windows'>('dashboard');
  const [showInactiveWindows, setShowInactiveWindows] = useState(false);
  const [showCreationModeModal, setShowCreationModeModal] = useState(false);
  const [creationMode, setCreationMode] = useState<'individual' | 'bulk'>('individual');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [windowToDelete, setWindowToDelete] = useState<Window | null>(null);
  const [showGradeReleaseModal, setShowGradeReleaseModal] = useState(false);
  const [gradeReleaseProjectType, setGradeReleaseProjectType] = useState<ProjectType | null>(null);

  // Hooks
  const {
    windows,
    windowsLoading,
    fetchWindows,
    deleteWindow,
    updateWindowStatuses
  } = useWindowManagement();

  const { stats, statsLoading, fetchStats } = useStats();
  
  const { 
    releasedGrades, 
    checkReleasedGrades, 
    releaseGrades, 
    isGradeReleaseWindowActive 
  } = useGradeRelease();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchWindows(),
        fetchStats(),
        checkReleasedGrades()
      ]);
    };
    
    loadData();
  }, [fetchWindows, fetchStats, checkReleasedGrades]);

  // Handlers
  const handleEditWindow = (window: Window) => {
    // For now, we'll just show a console log - full edit form would need to be implemented
    console.log('Edit functionality would open the window form in edit mode for:', window);
  };

  const handleDeleteWindow = (window: Window) => {
    setWindowToDelete(window);
    setShowDeleteModal(true);
  };

  const confirmDeleteWindow = async () => {
    if (!windowToDelete) return;

    const success = await deleteWindow(windowToDelete._id);
    if (success) {
      setShowDeleteModal(false);
      setWindowToDelete(null);
    }
  };

  const handleReleaseFinalGrades = async (projectType: ProjectType) => {
    if (releasedGrades[projectType]) {
      toast.error(`Final grades for ${projectType} have already been released.`);
      return;
    }

    setGradeReleaseProjectType(projectType);
    setShowGradeReleaseModal(true);
  };

  const confirmGradeRelease = async () => {
    if (!gradeReleaseProjectType) return;

    const success = await releaseGrades(gradeReleaseProjectType);
    if (success) {
      fetchStats(); // Refresh stats after grade release
    }
    setShowGradeReleaseModal(false);
    setGradeReleaseProjectType(null);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {currentView === 'dashboard' ? 'Control Panel' : 'Manage Windows'}
              </h1>
              <p className="text-gray-600">
                {currentView === 'dashboard' 
                  ? 'Overview of system statistics and quick actions'
                  : 'Create, edit, and manage assessment windows'
                }
              </p>
            </div>
            {currentView === 'windows' && (
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Dashboard
              </button>
            )}
          </div>
        </motion.div>

        {currentView === 'dashboard' ? (
          /* Dashboard View */
          <>
            {/* Show loading state for entire dashboard or loaded content */}
            {statsLoading ? (
              <LoadingDashboard />
            ) : stats ? (
              <>
                {/* Statistics */}
                <StatsCards stats={stats} />

                {/* Grade Release Section - Only show when grade release window is active */}
                {isGradeReleaseWindowActive(windows) && (
                  <GradeReleaseSection
                    releasedGrades={releasedGrades}
                    onReleaseGrades={handleReleaseFinalGrades}
                  />
                )}

                {/* Quick Actions */}
                <QuickActions
                  onManageWindows={() => setCurrentView('windows')}
                  onUpdateStatuses={updateWindowStatuses}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Failed to load dashboard data. Please refresh the page.</p>
              </div>
            )}
          </>
        ) : (
          /* Windows Management View */
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Manage Windows
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={updateWindowStatuses}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                    title="Update window statuses based on current time"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Update Statuses
                  </button>
                  <button
                    onClick={() => setShowCreationModeModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create Window
                  </button>
                </div>
              </div>

              {/* Windows List */}
              <WindowsList
                windows={windows}
                windowsLoading={windowsLoading}
                showInactiveWindows={showInactiveWindows}
                onShowInactiveToggle={setShowInactiveWindows}
                onEditWindow={handleEditWindow}
                onDeleteWindow={handleDeleteWindow}
              />
            </motion.div>
          </>
        )}

        {/* Creation Mode Selection Modal */}
        <CreationModeModal
          isOpen={showCreationModeModal}
          creationMode={creationMode}
          onModeChange={setCreationMode}
          onContinue={() => {
            setShowCreationModeModal(false);
            if (creationMode === 'individual') {
              // For now, just show a console log - full form would need to be implemented
              console.log('Individual creation form would open here');
            } else {
              // For now, just show a console log - bulk creation modal would need to be implemented
              console.log('Bulk creation form would open here');
            }
          }}
          onCancel={() => {
            setShowCreationModeModal(false);
            setCreationMode('individual');
          }}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          window={windowToDelete}
          onConfirm={confirmDeleteWindow}
          onCancel={() => {
            setShowDeleteModal(false);
            setWindowToDelete(null);
          }}
        />

        {/* Grade Release Confirmation Modal */}
        <ConfirmationModal
          isOpen={showGradeReleaseModal}
          onClose={() => {
            setShowGradeReleaseModal(false);
            setGradeReleaseProjectType(null);
          }}
          onConfirm={confirmGradeRelease}
          title="Release Final Grades"
          message={`Are you sure you want to release FINAL grades for ${gradeReleaseProjectType}?`}
          details="This will make all completed evaluations (CLA-1, CLA-2, CLA-3, and External) visible to students. This action cannot be undone."
          confirmText="Yes, Release Grades"
          cancelText="Cancel"
          type="warning"
        />
      </div>
    </div>
  );
}