import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CalendarIcon, UserCheckIcon, ChevronRightIcon } from '../../../../../components/ui/Icons';
import { Window } from '../../types';

interface ControlPanelLandingProps {
    onManageWindows: () => void;
    onManageExternalEvaluators: () => void;
    isExternalEvaluatorsEnabled: boolean;
    windows: Window[];
}

export function ControlPanelLanding({
    onManageWindows,
    onManageExternalEvaluators,
    isExternalEvaluatorsEnabled,
    windows
}: ControlPanelLandingProps) {

    // Calculate Window Metrics
    const now = new Date();

    const activeWindowsCount = windows.filter(w => {
        const start = new Date(w.startDate);
        const end = new Date(w.endDate);
        return now >= start && now <= end;
    }).length;

    const upcomingWindowsCount = windows.filter(w => {
        const start = new Date(w.startDate);
        return now < start;
    }).length;

    // Find next approaching deadline (closest end date of an open window)
    const openWindows = windows.filter(w => {
        const start = new Date(w.startDate);
        const end = new Date(w.endDate);
        return now >= start && now <= end;
    });

    const nextDeadline = openWindows
        .map(w => new Date(w.endDate))
        .sort((a, b) => a.getTime() - b.getTime())[0];

    const deadlineText = nextDeadline
        ? `Next deadline: ${nextDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : upcomingWindowsCount > 0
            ? `${upcomingWindowsCount} upcoming windows`
            : 'No active deadlines';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-5xl mx-auto"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manage Windows Card */}
                <div
                    onClick={onManageWindows}
                    className="group relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                        <CalendarIcon className="w-32 h-32 text-blue-600" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <CalendarIcon className="w-8 h-8 text-blue-600" />
                            </div>
                            {activeWindowsCount > 0 && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full">
                                    {activeWindowsCount} Active
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                            Manage Windows
                        </h3>
                        <p className="text-slate-500 text-sm mb-6 max-w-xs">
                            Configure semester phases, set timelines, and manage submission windows.
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
                                <span className="text-sm font-medium text-slate-700">{deadlineText}</span>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400">
                                <ChevronRightIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* External Evaluators Card */}
                <div
                    onClick={isExternalEvaluatorsEnabled ? onManageExternalEvaluators : undefined}
                    className={`group relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all duration-200 overflow-hidden
            ${isExternalEvaluatorsEnabled
                            ? 'cursor-pointer hover:shadow-md hover:border-purple-200'
                            : 'opacity-60 cursor-not-allowed bg-slate-50'
                        }`}
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                        <UserCheckIcon className="w-32 h-32 text-purple-600" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg transition-colors ${isExternalEvaluatorsEnabled ? 'bg-purple-50 group-hover:bg-purple-100' : 'bg-slate-200'}`}>
                                <UserCheckIcon className={`w-8 h-8 ${isExternalEvaluatorsEnabled ? 'text-purple-600' : 'text-slate-500'}`} />
                            </div>
                            {!isExternalEvaluatorsEnabled && (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-full">
                                    Locked
                                </span>
                            )}
                        </div>

                        <h3 className={`text-xl font-bold mb-2 transition-colors ${isExternalEvaluatorsEnabled ? 'text-slate-900 group-hover:text-purple-700' : 'text-slate-500'}`}>
                            External Evaluators
                        </h3>
                        <p className="text-slate-500 text-sm mb-6 max-w-xs">
                            Assign external faculty for final project evaluations and manage allocations.
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                            <div className="flex flex-col">
                                {isExternalEvaluatorsEnabled ? (
                                    <>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</span>
                                        <span className="text-sm font-medium text-slate-700">Assign Evaluators</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prerequisite</span>
                                        <span className="text-sm font-medium text-slate-500">Application Ends</span>
                                    </>
                                )}
                            </div>
                            {isExternalEvaluatorsEnabled && (
                                <div className="p-2 bg-slate-50 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-all text-slate-400">
                                    <ChevronRightIcon className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
