import { motion } from 'framer-motion';
import { ClipboardList, UserCheck, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';
import { ExternalEvaluator, ExternalEvaluatorAssignment } from '../../types';
import { AnimatedCounter } from '../../../../../components/ui/AnimatedCounter';
import { cn } from '../../../../../utils/cn';

interface EvaluatorStatsProps {
  evaluators: ExternalEvaluator[];
  assignments: ExternalEvaluatorAssignment[];
  onOpenWorkload: () => void;
}

export function EvaluatorStats({ evaluators, assignments, onOpenWorkload }: EvaluatorStatsProps) {
  const totalAssignments = assignments.length;
  const assignedCount = assignments.filter(a => a.isAssigned).length;
  const unassignedCount = totalAssignments - assignedCount;

  const stats = [
    {
      label: 'Total Projects',
      value: totalAssignments,
      icon: ClipboardList,
      color: 'blue'
    },
    {
      label: 'Assigned',
      value: assignedCount,
      icon: CheckCircle,
      color: 'green'
    },
    {
      label: 'Unassigned',
      value: unassignedCount,
      icon: UserCheck,
      color: 'yellow'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      yellow: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-surface border border-border/60 rounded-xl p-4 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", getColorClasses(stat.color))}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                <AnimatedCounter value={stat.value} duration={1500} />
              </p>
              <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Workload Distribution Action Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={onOpenWorkload}
        className="group bg-indigo-500/5 hover:bg-indigo-500/[0.08] border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl p-4 transition-all cursor-pointer active:scale-[0.98] flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <div className={cn("p-2 rounded-lg", getColorClasses('indigo'))}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">
            <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
            Review Balance
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Workload Distribution</p>
            <p className="text-[10px] text-indigo-600/60 dark:text-indigo-400/60 font-medium">Manage Evaluator Balance</p>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>
    </div>
  );
}
