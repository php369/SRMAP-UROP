import { motion } from 'framer-motion';
import {
    FileText,
    Users,
    Clock,
    Layout,
    TrendingUp,
    Activity,
    Layers
} from 'lucide-react';
import { Stats } from '../../types';
import { AnimatedCounter } from './AnimatedCounter';
import { Skeleton } from '@/components/ui/skeleton';

interface HeroMetricsProps {
    stats: Stats | null;
    loading: boolean;
}

export const HeroMetrics = ({ stats, loading }: HeroMetricsProps) => {
    if (loading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-[140px] flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div>
                            <Skeleton className="h-8 w-24 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const metrics = [
        {
            label: 'Total Projects',
            value: stats.overview.totalProjects,
            icon: Layout,
            color: 'bg-blue-50 text-blue-600',
            trend: '+12%', // This would typically come from backend too
            trendUp: true
        },
        {
            label: 'Active Groups',
            value: stats.overview.totalGroups,
            icon: Users,
            color: 'bg-indigo-50 text-indigo-600',
            subLabel: `${stats.overview.averageGroupSize} avg. size`
        },
        {
            label: 'Pending Reviews',
            value: stats.overview.pendingApplications,
            icon: Clock,
            color: 'bg-amber-50 text-amber-600',
            urgent: stats.overview.pendingApplications > 0
        },
        {
            label: 'Completion Rate',
            value: stats.overview.evaluationProgress.percentage,
            suffix: '%',
            icon: Activity,
            color: 'bg-emerald-50 text-emerald-600',
            subLabel: `${stats.overview.evaluationProgress.completed}/${stats.overview.evaluationProgress.total} Evals`
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
            {metrics.map((metric, idx) => (
                <motion.div
                    key={idx}
                    variants={item}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-lg transition-all duration-300"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${metric.color}`}>
                            <metric.icon className="w-6 h-6" />
                        </div>
                        {metric.trend && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${metric.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {metric.trend}
                            </span>
                        )}
                        {metric.urgent && (
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                        )}
                    </div>

                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                            <AnimatedCounter value={metric.value} />
                            {metric.suffix}
                        </h3>
                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wide text-[11px]">
                            {metric.label}
                        </p>
                        {metric.subLabel && (
                            <p className="text-xs font-medium text-slate-500 mt-2 bg-slate-50 inline-block px-2 py-1 rounded-md">
                                {metric.subLabel}
                            </p>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};
