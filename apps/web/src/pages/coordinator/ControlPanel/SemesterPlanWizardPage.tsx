import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export function SemesterPlanWizardPage() {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
        >
            <button
                onClick={() => navigate('/dashboard/control/windows')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Windows
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Setup Semester Plan</h1>
                <p className="text-slate-500 mb-8">
                    Configure all assessment windows for the semester in one go.
                </p>

                <div className="p-12 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <p className="text-slate-500">Wizard Implementation Coming Soon (Phase 4)</p>
                </div>
            </div>
        </motion.div>
    );
}
