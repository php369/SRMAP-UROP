import { motion } from 'framer-motion';
import { CalendarIcon, ChevronRightIcon, UserCheckIcon } from '../../../../../components/ui/Icons';

interface QuickActionsProps {
  onManageWindows: () => void;

  onManageExternalEvaluators: () => void;
  isExternalEvaluatorsEnabled: boolean;
}

export function QuickActions({ onManageWindows, onManageExternalEvaluators, isExternalEvaluatorsEnabled }: QuickActionsProps) {
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
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={onManageWindows}
          className="p-6 bg-[#f9f9f9] rounded-xl hover:bg-white hover:shadow-xl hover:shadow-primary/10 cursor-pointer transition-colors group relative overflow-hidden"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-white rounded-lg shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors flex-shrink-0">
              <CalendarIcon className="w-6 h-6 text-gray-500 group-hover:text-primary transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 break-words group-hover:text-primary transition-colors">Manage Windows</h3>
              <p className="text-sm text-gray-600 break-words line-clamp-2">Create, edit, and manage assessment windows</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>• Create individual or bulk windows</p>
            <p>• Edit existing window schedules</p>
            <p>• View window status and timeline</p>
          </div>
          <div className="mt-4 flex items-center text-gray-400 group-hover:text-primary text-sm font-medium transition-colors">
            Click to manage windows
            <ChevronRightIcon className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* External Evaluators Card */}
        <motion.div
          whileHover={isExternalEvaluatorsEnabled ? { y: -5, scale: 1.02 } : undefined}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={isExternalEvaluatorsEnabled ? onManageExternalEvaluators : undefined}
          className={`p-6 rounded-xl transition-all group relative overflow-hidden ${isExternalEvaluatorsEnabled
            ? 'bg-[#f9f9f9] hover:bg-white hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer'
            : 'bg-[#f9f9f9] opacity-60 cursor-not-allowed'
            }`}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-lg shadow-sm transition-colors flex-shrink-0 ${isExternalEvaluatorsEnabled ? 'bg-white group-hover:bg-purple-50' : 'bg-gray-200'}`}>
              <UserCheckIcon className={`w-6 h-6 ${isExternalEvaluatorsEnabled ? 'text-gray-500 group-hover:text-purple-600' : 'text-gray-500'} transition-colors`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`text-lg font-semibold break-words transition-colors ${isExternalEvaluatorsEnabled ? 'text-gray-900 group-hover:text-purple-700' : 'text-gray-900'}`}>External Evaluators</h3>
              <p className="text-sm text-gray-600 break-words line-clamp-2">Assign and manage external evaluators</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>• Auto-assign external evaluators</p>
            <p>• View assignment details</p>
            <p>• Manage evaluator workload</p>
          </div>
          <div className={`mt-4 flex items-center text-sm font-medium transition-colors ${isExternalEvaluatorsEnabled ? 'text-gray-400 group-hover:text-purple-600' : 'text-gray-400'}`}>
            {isExternalEvaluatorsEnabled ? (
              <>
                Click to manage evaluators
                <ChevronRightIcon className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                Requires Completed Application Window
              </span>
            )}
          </div>
        </motion.div>


      </div>
    </motion.div>
  );
}