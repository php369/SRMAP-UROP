import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

// Hooks
import { useWindowManagement } from './hooks/useWindowManagement';
import { useGradeRelease } from './hooks/useGradeRelease';
import { useWindowForm } from './hooks/useWindowForm';

// Components
import { GradeReleaseSection } from './components/Dashboard/GradeReleaseSection';
import { QuickActions } from './components/Dashboard/QuickActions';
import { WindowsList } from './components/WindowManagement/WindowsList';
import { WindowForm } from './components/WindowManagement/WindowForm';
import { BulkCreationModal } from './components/WindowManagement/BulkCreationModal';
import { CreationModeModal } from './components/Modals/CreationModeModal';
import { DeleteConfirmationModal } from './components/Modals/DeleteConfirmationModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { ExternalEvaluatorsTab } from './components/ExternalEvaluators/ExternalEvaluatorsTab';

// Types
import { Window, ProjectType } from './types';

export function ControlPanel() {
  // State
  const [showGradeReleaseModal, setShowGradeReleaseModal] = useState(false);
  const [gradeReleaseProjectType, setGradeReleaseProjectType] = useState<ProjectType | null>(null);
  const [showInactiveWindows, setShowInactiveWindows] = useState(false);
  const [showCreationModeModal, setShowCreationModeModal] = useState(false);
  const [creationMode, setCreationMode] = useState<'individual' | 'bulk'>('individual');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [windowToDelete, setWindowToDelete] = useState<Window | null>(null);
  const [showWindowForm, setShowWindowForm] = useState(false);
  const [showBulkCreationModal, setShowBulkCreationModal] = useState(false);
  const [editingWindow, setEditingWindow] = useState<Window | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [currentView, setCurrentView] = useState<'dashboard' | 'windows' | 'external-evaluators'>('dashboard');

  // Hooks
  const {
    windows,
    windowsLoading,
    fetchWindows,
    createWindow,
    createBulkWindows,
    deleteWindow,
    updateWindowStatuses,
    prepareEditWindow
  } = useWindowManagement();

  const {
    releasedGrades,
    checkReleasedGrades,
    releaseGrades,
    isGradeReleaseWindowActive
  } = useGradeRelease();

  const {
    windowForm,
    setWindowForm,
    resetForm,
    validateForm
  } = useWindowForm(windows);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchWindows(),
        checkReleasedGrades()
      ]);
    };

    loadData();
  }, [fetchWindows, checkReleasedGrades]);

  // Handlers
  const handleCreateWindow = async () => {
    if (!validateForm()) return;

    setFormLoading(true);
    const success = await createWindow(windowForm, editingWindow);
    setFormLoading(false);

    if (success) {
      setShowWindowForm(false);
      setEditingWindow(null);
      resetForm();
    }
  };

  const handleBulkWindowCreation = async (selectedProjectType: ProjectType) => {
    setFormLoading(true);
    const success = await createBulkWindows(windowForm, selectedProjectType);
    setFormLoading(false);

    if (success) {
      setShowBulkCreationModal(false);
      resetForm();
    }
  };

  const handleEditWindow = (window: Window) => {
    const editForm = prepareEditWindow(window);
    setWindowForm(editForm);
    setEditingWindow(window);
    setShowWindowForm(true);
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
      // Grades released
    }
    setShowGradeReleaseModal(false);
    setGradeReleaseProjectType(null);
  };

  // Check if External Evaluators should be enabled
  // Enabled if ANY project type's application window is over
  const now = new Date();
  const isExternalEvaluatorsEnabled = windows.some(w =>
    w.windowType === 'application' && new Date(w.endDate) < now
  );

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
              <h1 className="text-3xl font-bold mb-2 text-slate-900">
                {currentView === 'dashboard' ? 'Control Panel' :
                  currentView === 'windows' ? 'Manage Windows' :
                    'External Evaluators'}
              </h1>
              <p className="text-slate-500">
                {currentView === 'dashboard'
                  ? 'Overview of system statistics and quick actions'
                  : currentView === 'windows'
                    ? 'Create, edit, and manage assessment windows'
                    : 'Assign and manage external evaluators for projects'
                }
              </p>
            </div>
            {(currentView === 'windows' || currentView === 'external-evaluators') && (
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-2 transition-colors"
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
              onManageExternalEvaluators={() => setCurrentView('external-evaluators')}
              isExternalEvaluatorsEnabled={isExternalEvaluatorsEnabled}
            />
          </>
        ) : currentView === 'windows' ? (
          /* Windows Management View */
          <>
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white shadow-xl p-6 rounded-xl border border-slate-200"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                    <Calendar className="w-6 h-6 text-[#4a5569]" />
                    Manage Windows
                  </h2>
                  <div className="flex items-center gap-3">

                    <button
                      onClick={() => setShowCreationModeModal(true)}
                      className="px-4 py-2 bg-[#005bca] text-white rounded-lg hover:bg-[#004bca] flex items-center gap-2 transition-colors"
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
          </>
        ) : (
          /* External Evaluators View */
          <ExternalEvaluatorsTab />
        )}

        {/* Individual Window Creation Form */}
        {showWindowForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
              <WindowForm
                windowForm={windowForm}
                setWindowForm={setWindowForm}
                editingWindow={editingWindow}
                onSubmit={handleCreateWindow}
                onCancel={() => {
                  setShowWindowForm(false);
                  setEditingWindow(null);
                  resetForm();
                }}
                loading={formLoading}
              />
            </div>
          </div>
        )}

        {/* Bulk Creation Modal */}
        <BulkCreationModal
          isOpen={showBulkCreationModal}
          windowForm={windowForm}
          setWindowForm={setWindowForm}
          onSubmit={handleBulkWindowCreation}
          loading={formLoading}
          onCancel={() => {
            setShowBulkCreationModal(false);
            resetForm();
          }}
        />

        {/* Creation Mode Selection Modal */}
        <CreationModeModal
          isOpen={showCreationModeModal}
          creationMode={creationMode}
          onModeChange={setCreationMode}
          onContinue={() => {
            setShowCreationModeModal(false);
            if (creationMode === 'individual') {
              setShowWindowForm(true);
            } else {
              setShowBulkCreationModal(true);
            }
          }}
          onCancel={() => {
            setShowCreationModeModal(false);
            setCreationMode('individual');
            resetForm();
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