import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wand2, Calendar, ChevronDown } from 'lucide-react';

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
    const [deleteLoading, setDeleteLoading] = useState(false);

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
        if (!validateForm(editingWindow)) return;

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

        setDeleteLoading(true);
        const success = await deleteWindow(windowToDelete._id);
        setDeleteLoading(false);

        if (success) {
            setShowDeleteModal(false);
            setWindowToDelete(null);
        }
    };

    return (
        <div
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
                    {/* Combined Split Button */}
                    <div className="relative group flex items-stretch rounded-lg shadow-sm">
                        <button
                            onClick={() => navigate('/dashboard/control/individual')}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-l-lg font-medium flex items-center gap-2 text-sm transition-colors border-r border-white/20"
                        >
                            <Plus className="w-4 h-4" />
                            Create Window
                        </button>

                        {/* Dropdown Trigger */}
                        <div className="relative">
                            <button
                                className="bg-primary hover:bg-primary/90 text-white px-2 py-2 rounded-r-lg h-full flex items-center justify-center transition-colors focus:outline-none border-l border-white/20"
                                id="create-dropdown-trigger"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 hidden group-focus-within:block focus-within:block z-50">
                                <button
                                    onClick={() => navigate('/dashboard/control/wizard')}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    Create Semester Plan
                                </button>
                            </div>
                        </div>
                    </div>
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
                onCreateWindow={() => navigate('/dashboard/control/individual')}
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
                loading={deleteLoading}
            />
        </div>
    );
}
