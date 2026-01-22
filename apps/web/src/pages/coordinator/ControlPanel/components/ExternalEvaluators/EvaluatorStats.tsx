import { motion } from 'framer-motion';
import { Users, UserCheck, BarChart3, CheckCircle } from 'lucide-react';
import { ExternalEvaluator, ExternalEvaluatorAssignment } from '../../types';

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
      icon: Users,
      color: 'blue',
      description: 'Groups and solo students requiring evaluation'
    },
    {
      label: 'Assigned',
      value: assignedCount,
      icon: CheckCircle,
      color: 'green',
      description: 'Projects with assigned external evaluators'
    },
    {
      label: 'Unassigned',
      value: unassignedCount,
      icon: UserCheck,
      color: 'yellow',
      description: 'Projects awaiting assignment'
    },
    {
      label: 'Workload Distribution',
      value: evaluators.length,
      icon: BarChart3,
      color: 'indigo',
      description: 'Click to view evaluator assignment balance',
      isAction: true,
      onClick: onOpenWorkload
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
          onClick={stat.onClick}
          className={cn(
            "bg-surface border border-border/60 rounded-xl p-4 transition-all",
            stat.isAction ? "cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/[0.02] active:scale-[0.98]" : ""
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("p-2 rounded-lg", getColorClasses(stat.color))}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{stat.value}</p>
              <p className="text-xs font-semibold text-textSecondary uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
          <p className="text-[10px] text-textSecondary leading-relaxed">{stat.description}</p>
        </motion.div>
      ))}
    </div>
  );
}

import { cn } from '../../../../../utils/cn';
