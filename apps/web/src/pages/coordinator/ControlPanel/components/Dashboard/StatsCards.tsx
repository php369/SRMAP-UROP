import { motion } from 'framer-motion';
import { Calendar, Clock, Award, Users, FileText } from 'lucide-react';
import { Stats } from '../../types';

interface StatsCardsProps {
  stats: Stats | null;
  statsLoading: boolean;
}

export function StatsCards({ stats, statsLoading }: StatsCardsProps) {
  if (statsLoading) {
    return (
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg animate-pulse">
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      {/* Main Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold">{stats.overview.totalProjects}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Groups</p>
              <p className="text-2xl font-bold">{stats.overview.totalGroups}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Applications</p>
              <p className="text-2xl font-bold">{stats.overview.pendingApplications}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Graded Submissions</p>
              <p className="text-2xl font-bold">{stats.overview.gradedSubmissions}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Stats Breakdown */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Projects by Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Projects by Type
          </h3>
          <div className="space-y-3">
            {stats.breakdown?.projectsByType?.map((item: any) => (
              <div key={item._id} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{item._id || 'Unknown'}</span>
                <span className="text-sm font-bold text-gray-900">{item.count}</span>
              </div>
            )) || (
              <p className="text-sm text-gray-500">No project data available</p>
            )}
          </div>
        </motion.div>

        {/* Applications by Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            Applications Status
          </h3>
          <div className="space-y-3">
            {stats.breakdown?.applicationsByStatus?.map((item: any) => (
              <div key={item._id} className="flex justify-between items-center">
                <span className={`text-sm font-medium capitalize ${
                  item._id === 'pending' ? 'text-yellow-700' :
                  item._id === 'approved' ? 'text-green-700' :
                  item._id === 'rejected' ? 'text-red-700' : 'text-gray-700'
                }`}>
                  {item._id || 'Unknown'}
                </span>
                <span className="text-sm font-bold text-gray-900">{item.count}</span>
              </div>
            )) || (
              <p className="text-sm text-gray-500">No application data available</p>
            )}
          </div>
        </motion.div>

        {/* Submissions by Assessment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Submissions by Assessment
          </h3>
          <div className="space-y-3">
            {stats.breakdown?.submissionsByAssessment?.map((item: any) => (
              <div key={item._id} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{item._id || 'Unknown'}</span>
                <span className="text-sm font-bold text-gray-900">{item.count}</span>
              </div>
            )) || (
              <p className="text-sm text-gray-500">No submission data available</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Additional Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-lg p-4"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.overview.activeWindows}</div>
            <div className="text-sm text-gray-600">Active Windows</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg p-4"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.overview.totalApplications}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl shadow-lg p-4"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.overview.totalSubmissions}</div>
            <div className="text-sm text-gray-600">Total Submissions</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-xl shadow-lg p-4"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.overview.releasedGrades}</div>
            <div className="text-sm text-gray-600">Released Grades</div>
          </div>
        </motion.div>
      </div>
    </>
  );
}