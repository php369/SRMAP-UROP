import { motion } from 'framer-motion';
import {
    CalendarDays,
    Clock,
    ChevronRight
} from 'lucide-react';
import { Stats } from '../../types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/Badge';

interface WindowsTimelineProps {
    stats: Stats | null;
    loading: boolean;
}

export const WindowsTimeline = ({ stats, loading }: WindowsTimelineProps) => {
    if (loading || !stats) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
                <Skeleton className="h-6 w-48 mb-6" />
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    const windows = stats.overview.upcomingDeadlines || [];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-indigo-500" />
                    Active & Upcoming Windows
                </h3>
                <Badge variant="secondary" className="bg-slate-50 text-slate-500 hover:bg-slate-100">
                    Next 14 Days
                </Badge>
            </div>

            <div className="relative">
                {/* Timeline vertical line connector */}
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-100 rounded-full" />

                <div className="space-y-4">
                    {windows.map((window, idx) => (
                        <motion.div
                            key={window._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative pl-14"
                        >
                            {/* Timeline marker */}
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-white z-10 ${window.daysLeft <= 3 ? 'border-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.1)]' : 'border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]'
                                }`} />

                            <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between group hover:border-indigo-100 hover:shadow-md transition-all duration-300">
                                <div>
                                    <h4 className="font-bold text-slate-800 capitalize tracking-tight flex items-center gap-2">
                                        {window.title}
                                        {window.daysLeft <= 3 && (
                                            <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Urgent</span>
                                        )}
                                    </h4>
                                    <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        Closes on {new Date(window.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className={`text-lg font-black ${window.daysLeft <= 3 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {window.daysLeft}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Left</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {windows.length === 0 && (
                        <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="font-medium">No deadlines in the next 14 days</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
