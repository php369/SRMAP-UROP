import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Circle,
    Video,
    Calendar,
    BarChart3
} from 'lucide-react';
import { Stats } from '../../types';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from './AnimatedCounter';

// Simple donut chart SVG component since we aren't using a charting library yet
const SimpleDonut = ({ percentage, color }: { percentage: number, color: string }) => {
    const circumference = 2 * Math.PI * 40; // r=40
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="transform -rotate-90 w-32 h-32">
                <circle
                    cx="64"
                    cy="64"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-slate-100"
                />
                <circle
                    cx="64"
                    cy="64"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={color}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-800">
                <span className="text-2xl font-black"><AnimatedCounter value={percentage} />%</span>
            </div>
        </div>
    );
};

interface ProgressSectionProps {
    stats: Stats | null;
    loading: boolean;
}

export const ProgressSection = ({ stats, loading }: ProgressSectionProps) => {
    if (loading || !stats) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Skeleton className="h-[300px] rounded-2xl lg:col-span-2" />
                <Skeleton className="h-[300px] rounded-2xl" />
            </div>
        );
    }

    // Calculate some derived data for the area chart visualization (mock visual for now based on breakdown)
    const maxProjectCount = Math.max(...(stats.breakdown.projectsByType.map(p => p.count) || [0]), 10);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Charts Area */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2 flex flex-col"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                        Program Distribution
                    </h3>
                </div>

                {/* Visual Bar Chart for Project Types */}
                <div className="flex-1 flex items-end justify-around gap-4 px-4 pb-4 min-h-[180px]">
                    {stats.breakdown.projectsByType.map((item, i) => {
                        const height = Math.max((item.count / maxProjectCount) * 100, 10); // Min 10% height
                        const colors = ['bg-blue-500', 'bg-sky-500', 'bg-indigo-500'];

                        return (
                            <div key={item._id} className="flex flex-col items-center gap-2 group w-full">
                                <div className="relative w-full max-w-[80px] h-[160px] bg-slate-50 rounded-t-xl overflow-hidden flex items-end">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`w-full ${colors[i % colors.length]} opacity-80 group-hover:opacity-100 transition-opacity relative`}
                                    >
                                        <div className="absolute -top-8 w-full text-center font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.count}
                                        </div>
                                    </motion.div>
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item._id}</span>
                            </div>
                        );
                    })}

                    {(!stats.breakdown.projectsByType || stats.breakdown.projectsByType.length === 0) && (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium italic">
                            No project data available to visualize
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Progress Donuts */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6"
            >
                <h3 className="text-lg font-bold text-slate-800 pb-2 border-b border-slate-50">Operational Health</h3>

                <div className="flex items-center gap-4">
                    <SimpleDonut percentage={stats.overview.evaluationProgress.percentage} color="text-emerald-500" />
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Evaluations
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                            <span className="font-bold text-slate-900">{stats.overview.evaluationProgress.completed}</span> of {stats.overview.evaluationProgress.total} completed
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <SimpleDonut percentage={stats.overview.meetingCompletionRate.percentage} color="text-violet-500" />
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <Video className="w-4 h-4 text-violet-500" /> Meetings
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                            <span className="font-bold text-slate-900">{stats.overview.meetingCompletionRate.completed}</span> of {stats.overview.meetingCompletionRate.total} logged
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
