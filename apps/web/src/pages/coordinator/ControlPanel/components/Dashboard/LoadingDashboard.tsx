import { motion } from 'framer-motion';

export function LoadingDashboard() {
  return (
    <>
      {/* Main Stats Grid Loading */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg animate-pulse">
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-20"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Stats Breakdown Loading */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Quick Stats Loading */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-4"
          >
            <div className="text-center">
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-12 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mx-auto"></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions Loading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-6 w-32"></div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-100 rounded-lg animate-pulse">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                </div>
                <div>
                  <div className="h-5 bg-gray-200 rounded animate-pulse mb-2 w-32"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-40"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-36"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-44"></div>
              </div>
              <div className="mt-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}