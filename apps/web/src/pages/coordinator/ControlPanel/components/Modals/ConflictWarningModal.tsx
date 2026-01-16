import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XIcon, Trash2Icon } from 'lucide-react';

interface ConflictWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectType: string;
}

export function ConflictWarningModal({ isOpen, onClose, projectType }: ConflictWarningModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-red-100 bg-red-50/50 flex items-start gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl flex-shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900">Schedule Conflict Detected</h3>
                            <p className="text-sm text-slate-600 mt-1">
                                We found existing windows for <span className="font-bold text-slate-900">{projectType}</span> projects.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 leading-relaxed">
                            <p>
                                To maintain data integrity, you cannot overlap or merge a new full-semester plan with existing active windows.
                            </p>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                            <Trash2Icon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-semibold text-orange-900">Action Required</p>
                                <p className="text-orange-700 mt-1">
                                    Please go to <span className="font-semibold">Manage Windows</span> and delete the existing schedule for {projectType} projects before creating a new one.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            Understood, I'll check
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
