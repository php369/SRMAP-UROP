import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../../../../components/ui/Sheet';
import { WindowForm } from './WindowForm';
import { WindowForm as WindowFormType, Window } from '../../types';

interface WindowCreationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    windowForm: WindowFormType;
    setWindowForm: (form: WindowFormType) => void;
    editingWindow: Window | null;
    onSubmit: () => Promise<void>;
    loading: boolean;
    onReset: () => void;
}

export function WindowCreationDrawer({
    isOpen,
    onClose,
    windowForm,
    setWindowForm,
    editingWindow,
    onSubmit,
    loading,
    onReset
}: WindowCreationDrawerProps) {
    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>
                        {editingWindow ? 'Edit Window' : 'Create New Window'}
                    </SheetTitle>
                    <SheetDescription>
                        {editingWindow
                            ? 'Update the details and schedule for this assessment window.'
                            : 'Configure the window details, project types, and schedule.'}
                    </SheetDescription>
                </SheetHeader>

                <div className="pb-6">
                    <WindowForm
                        windowForm={windowForm}
                        setWindowForm={setWindowForm}
                        editingWindow={editingWindow}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                        loading={loading}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
