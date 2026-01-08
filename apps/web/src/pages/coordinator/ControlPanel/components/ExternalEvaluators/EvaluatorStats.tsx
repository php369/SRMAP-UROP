import { motion } from 'framer-motion';
import { Users, UserCheck, AlertTriangle, CheckCircle } from 'lucide-react';
import { ExternalEvaluator, ExternalEvaluatorAssignment } from '../../types';

interface EvaluatorStatsProps {
  evaluators: ExternalEvaluator[];
  assignments: ExternalEvaluatorAssignment[];
}

export function EvaluatorStats({ evaluators, assignments }: EvaluatorStatsProps) {
  const totalAssignments = assignments.length;
  const assignedCount = assignments.filter(a => a.isAssigned).length;
  const unassignedCount = totalAssignments - assignedCount;
  const conflictCount = assignments.filter(a => a.hasConflict).length;
  const totalEvaluators = evaluators.length;

  const stats = [
    {
      label: 'Total Projects/Students',
      value: totalAssignments,
      icon: Users,
      color: 'blue',
      description: 'Groups and solo students requiring external evaluation'
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
      description: 'Projects awaiting external evaluator assignment'
    },
    {
      label: 'Conflicts',
      value: conflictCount,
      icon: AlertTriangle,
      color: 'red',
      description: 'Assignments with internal/external faculty conflicts'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm font-medium text-gray-700">{stat.label}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">{stat.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Evaluator Workload Distribution */}
      {totalEvaluators > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Evaluator Workload Distribution
          </h3>
          <div className="space-y-3">
            {evaluators
              .sort((a, b) => b.assignmentCount - a.assignmentCount)
              .map((evaluator, index) => {
                const maxAssignments = Math.max(...evaluators.map(e => e.assignmentCount), 1);
                const percentage = (evaluator.assignmentCount / maxAssignments) * 100;
                
                return (
                  <div key={evaluator._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{evaluator.name}</p>
                        <p className="text-xs text-gray-500">{evaluator.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {evaluator.assignmentCount} assignments
                        </p>
                        <p className="text-xs text-gray-500">
                          {totalAssignments > 0 ? 
                            Math.round((evaluator.assignmentCount / totalAssignments) * 100) : 0}% of total
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        className="bg-blue-500 h-2 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          
          {evaluators.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No external evaluators available
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}