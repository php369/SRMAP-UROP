import { motion } from 'framer-motion';
import { CalendarIcon, RefreshCwIcon, ChevronRightIcon, UserCheckIcon } from '../../../../../components/ui/Icons';

interface QuickActionsProps {
  onManageWindows: () => void;
  onUpdateStatuses: () => void;
  onManageExternalEvaluators: () => void;
  isExternalEvaluatorsEnabled: boolean;
}

export function QuickActions({ onManageWindows, onUpdateStatuses, onManageExternalEvaluators, isExternalEvaluatorsEnabled }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Manage Windows Card */}
        <div
          onClick={onManageWindows}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 break-words">Manage Windows</h3>
              <p className="text-sm text-gray-600 break-words line-clamp-2">Create, edit, and manage assessment windows</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>• Create individual or bulk windows</p>
            <p>• Edit existing window schedules</p>
            <p>• View window status and timeline</p>
          </div>
          <div className="mt-4 flex items-center text-primary text-sm font-medium">
            Click to manage windows
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* External Evaluators Card */}
        <div
          onClick={isExternalEvaluatorsEnabled ? onManageExternalEvaluators : undefined}
          className={`p-6 border-2 border-gray-200 rounded-lg transition-all group ${isExternalEvaluatorsEnabled
            ? 'hover:border-purple-300 hover:bg-purple-50 cursor-pointer'
            : 'opacity-60 bg-gray-50 cursor-not-allowed'
            }`}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-lg transition-colors flex-shrink-0 ${isExternalEvaluatorsEnabled ? 'bg-purple-100 group-hover:bg-purple-200' : 'bg-gray-200'}`}>
              <UserCheckIcon className={`w-6 h-6 ${isExternalEvaluatorsEnabled ? 'text-purple-600' : 'text-gray-500'}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 break-words">External Evaluators</h3>
              <p className="text-sm text-gray-600 break-words line-clamp-2">Assign and manage external evaluators</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>• Auto-assign external evaluators</p>
            <p>• View assignment details</p>
            <p>• Manage evaluator workload</p>
          </div>
          <div className={`mt-4 flex items-center text-sm font-medium ${isExternalEvaluatorsEnabled ? 'text-purple-600' : 'text-gray-400'}`}>
            {isExternalEvaluatorsEnabled ? (
              <>
                Click to manage evaluators
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                Requires Completed Application Window
              </span>
            )}
          </div>
        </div>

        {/* System Status Card */}
        <div className="p-6 border-2 border-gray-200 rounded-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <RefreshCwIcon className="w-6 h-6 text-green-600" />
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
              <RefreshCwIcon className="w-4 h-4" />
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