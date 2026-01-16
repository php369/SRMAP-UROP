import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../../components/ui/dialog';
import { WindowForm } from './WindowForm';
import { WindowForm as WindowFormType, Window } from '../../types';

interface WindowCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    windowForm: WindowFormType;
    setWindowForm: (form: WindowFormType) => void;
    editingWindow: Window | null;
    onSubmit: () => Promise<void>;
    loading: boolean;
    onReset: () => void;
}

export function WindowCreationModal({
    isOpen,
    onClose,
    windowForm,
    setWindowForm,
    editingWindow,
    onSubmit,
    loading,
    onReset
}: WindowCreationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
            {/* Manual Backdrop since modal={false} removes default overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    aria-hidden="true"
                    onClick={onClose}
                />
            )}
            <DialogContent
                className="max-w-2xl max-h-[90vh] overflow-y-auto"
                onInteractOutside={(e) => {
                    const target = e.target as Element;
                    // Prevent closing when interacting with the DatePicker portal
                    if (target.closest('.heroui-datepicker-popover-content') || target.closest('.heroui-datepicker-popup') || target.closest('[data-type="popover"]')) {
                        e.preventDefault();
                    }
                }}
                onPointerDownOutside={(e) => {
                    const target = e.target as Element;
                    if (target.closest('.heroui-datepicker-popover-content') || target.closest('.heroui-datepicker-popup') || target.closest('[data-type="popover"]')) {
                        e.preventDefault();
                    }
                }}
                onFocusOutside={(e) => {
                    const target = e.target as Element;
                    if (target.closest('.heroui-datepicker-popover-content') || target.closest('.heroui-datepicker-popup') || target.closest('[data-type="popover"]')) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>
                        {editingWindow ? 'Edit Window' : 'Create New Window'}
                    </DialogTitle>
                    <DialogDescription>
                        {editingWindow
                            ? 'Update the details and schedule for this assessment window.'
                            : 'Configure the window details, project types, and schedule.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <WindowForm
                        windowForm={windowForm}
                        setWindowForm={setWindowForm}
                        editingWindow={editingWindow}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                        loading={loading}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
