import { motion } from 'framer-motion';
import { Calendar, RefreshCw, ChevronRight, UserCheck } from 'lucide-react';

interface QuickActionsProps {
  onManageWindows: () => void;
  onUpdateStatuses: () => void;
  onManageExternalEvaluators: () => void;
}

export function QuickActions({ onManageWindows, onUpdateStatuses, onManageExternalEvaluators }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {/* Manage Windows Card */}
        <div
          onClick={onManageWindows}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Manage Windows</h3>
              <p className="text-sm text-gray-600">Create, edit, and manage assessment windows</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>• Create individual or bulk windows</p>
            <p>• Edit existing window schedules</p>
            <p>• View window status and timeline</p>
          </div>
          <div className="mt-4 flex items-center text-primary text-sm font-medium">
            Click to manage windows
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* External Evaluators Card */}
        <div
          onClick={onManageExternalEvaluators}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">External Evaluators</h3>
              <p className="text-sm text-gray-600">Assign and manage external evaluators</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>• Auto-assign external evaluators</p>
            <p>• View assignment details</p>
            <p>• Manage evaluator workload</p>
          </div>
          <div className="mt-4 flex items-center text-purple-600 text-sm font-medium">
            Click to manage evaluators
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* System Status Card */}
        <div className="p-6 border-2 border-gray-200 rounded-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <RefreshCw className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
              <p className="text-sm text-gray-600">Monitor and update system status</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={onUpdateStatuses}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Update Window Statuses
            </button>
            <p className="text-xs text-gray-500 text-center">
              Updates window statuses based on current time
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}