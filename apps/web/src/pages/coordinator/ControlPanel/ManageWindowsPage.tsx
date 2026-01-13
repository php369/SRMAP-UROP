import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wand2, Calendar } from 'lucide-react';

// Components
import { WindowsList } from './components/WindowManagement/WindowsList';
import { WindowCreationModal } from './components/WindowManagement/WindowCreationModal';
import { DeleteConfirmationModal } from './components/Modals/DeleteConfirmationModal';

// Hooks
import { useWindowManagement } from './hooks/useWindowManagement';
import { useWindowForm } from './hooks/useWindowForm';

import { useNavigate } from 'react-router-dom';

// Types
import { Window, ProjectType } from './types';

export function ManageWindowsPage() {
    const navigate = useNavigate();
    // State
    const [showCreationDrawer, setShowCreationDrawer] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [windowToDelete, setWindowToDelete] = useState<Window | null>(null);
    const [editingWindow, setEditingWindow] = useState<Window | null>(null);
    const [showInactiveWindows, setShowInactiveWindows] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    // Hooks
    const {
        windows,
        windowsLoading,
        fetchWindows,
        createWindow,
        deleteWindow,
        prepareEditWindow
    } = useWindowManagement();

    const {
        windowForm,
        setWindowForm,
        resetForm,
        validateForm
    } = useWindowForm(windows);

    // Load initial data
    useEffect(() => {
        fetchWindows();
    }, [fetchWindows]);

    // Handlers
    const handleCreateWindow = async () => {
        if (!validateForm()) return;

        setFormLoading(true);
        const success = await createWindow(windowForm, editingWindow);
        setFormLoading(false);

        if (success) {
            setShowCreationDrawer(false);
            setEditingWindow(null);
            resetForm();
        }
    };

    const handleEditWindow = (window: Window) => {
        const editForm = prepareEditWindow(window);
        setWindowForm(editForm);
        setEditingWindow(window);
        setShowCreationDrawer(true);
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface shadow-xl p-4 md:p-6 rounded-xl border border-border"
        >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-text">
                        <Calendar className="w-6 h-6 text-textSecondary" />
                        Manage Windows
                    </h2>
                    <p className="text-sm text-textSecondary mt-1">
                        Create and monitor assessment timelines.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Split CTA */}
                    <button
                        onClick={() => setShowCreationDrawer(true)}
                        className="flex-1 md:flex-none px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create Window
                    </button>

                    {/* Future Wizard Link */}
                    <button
                        onClick={() => navigate('/dashboard/control/wizard')}
                        className="flex-1 md:flex-none px-4 py-2 bg-surface text-textSecondary border border-border rounded-lg hover:bg-surface/50 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Wand2 className="w-4 h-4 text-purple-600" />
                        Setup Semester Plan
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

            {/* Modal for Creation/Editing */}
            <WindowCreationModal
                isOpen={showCreationDrawer}
                onClose={() => {
                    setShowCreationDrawer(false);
                    setEditingWindow(null);
                    resetForm();
                }}
                windowForm={windowForm}
                setWindowForm={setWindowForm}
                editingWindow={editingWindow}
                onSubmit={handleCreateWindow}
                loading={formLoading}
                onReset={resetForm}
            />

            {/* Delete Confirmation */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                window={windowToDelete}
                onConfirm={confirmDeleteWindow}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setWindowToDelete(null);
                }}
            />
        </motion.div>
    );
}
