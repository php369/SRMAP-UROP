import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SystemAnalytics } from '../../types';
import { GlassCard, Badge, ProgressIndicator, AnimatedCounter } from '../../components/ui';
import { AnimatedLineChart, AnimatedBarChart, AnimatedAreaChart } from '../../components/charts';
import { cn } from '../../utils/cn';

// Mock data
const mockAnalytics: SystemAnalytics = {
  totalUsers: 1247,
  activeUsers: 892,
  totalAssessments: 156,
  totalSubmissions: 3421,
  averageGradingTime: 2.4,
  systemUptime: 99.8,
  storageUsed: 15728640000, // ~14.6 GB
  storageLimit: 107374182400, // 100 GB
  recentActivity: [
    {
      id: '1',
      userId: 'user123',
      userName: 'John Doe',
      action: 'submitted_assignment',
      resource: 'ML Assignment 1',
      timestamp: '2024-01-28T14:30:00Z',
      details: { assessmentId: 'assess123', submissionId: 'sub456' },
    },
    {
      id: '2',
      userId: 'faculty456',
      userName: 'Dr. Smith',
      action: 'graded_submission',
      resource: 'Data Structures Quiz',
      timestamp: '2024-01-28T14:25:00Z',
      details: { grade: 85, submissionId: 'sub789' },
    },
    {
      id: '3',
      userId: 'admin789',
      userName: 'Admin User',
      action: 'created_cohort',
      resource: 'CS 2024 Batch',
      timestamp: '2024-01-28T14:20:00Z',
      details: { cohortId: 'cohort123', studentCount: 45 },
    },
  ],
};

const mockChartData = {
  userGrowth: [
    { month: 'Jan', users: 850 },
    { month: 'Feb', users: 920 },
    { month: 'Mar', users: 1050 },
    { month: 'Apr', users: 1180 },
    { month: 'May', users: 1247 },
  ],
  submissionTrends: [
    { day: 'Mon', submissions: 45 },
    { day: 'Tue', submissions: 52 },
    { day: 'Wed', submissions: 38 },
    { day: 'Thu', submissions: 61 },
    { day: 'Fri', submissions: 73 },
    { day: 'Sat', submissions: 29 },
    { day: 'Sun', submissions: 18 },
  ],
  gradingMetrics: [
    { hour: '0-2h', count: 156 },
    { hour: '2-4h', count: 89 },
    { hour: '4-8h', count: 45 },
    { hour: '8-24h', count: 23 },
    { hour: '1-3d', count: 12 },
    { hour: '3d+', count: 8 },
  ],
};

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState<SystemAnalytics>(mockAnalytics);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    // Simulate API call
    const fetchAnalytics = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchAnalytics();
  }, [selectedTimeRange]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'submitted_assignment':
        return '📤';
      case 'graded_submission':
        return '✅';
      case 'created_cohort':
        return '👥';
      case 'created_assessment':
        return '📝';
      case 'user_login':
        return '🔐';
      default:
        return '📋';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'submitted_assignment':
        return 'bg-info';
      case 'graded_submission':
        return 'bg-success';
      case 'created_cohort':
        return 'bg-warning';
      case 'created_assessment':
        return 'bg-primary';
      case 'user_login':
        return 'bg-secondary';
      default:
        return 'bg-gray-500';
    }
  };

  const storagePercentage = (analytics.storageUsed / analytics.storageLimit) * 100;
  const activeUserPercentage = (analytics.activeUsers / analytics.totalUsers) * 100;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Admin Dashboard</h1>
            <p className="text-textSecondary">
              System overview and analytics for the SRM Portal
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-surface border border-border rounded-lg p-1">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  selectedTimeRange === range
                    ? 'bg-primary text-white'
                    : 'text-textSecondary hover:text-text'
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <GlassCard variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textSecondary text-sm mb-1">Total Users</p>
                <AnimatedCounter
                  value={analytics.totalUsers}
                  className="text-2xl font-bold text-text"
                />
              </div>
              <div className="text-3xl">👥</div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-textSecondary">Active</span>
                <span className="text-success font-medium">
                  {analytics.activeUsers} ({activeUserPercentage.toFixed(1)}%)
                </span>
              </div>
              <ProgressIndicator
                value={activeUserPercentage}
                color="success"
                className="mt-2"
                showLabel={false}
              />
            </div>
          </GlassCard>

          <GlassCard variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textSecondary text-sm mb-1">Assessments</p>
                <AnimatedCounter
                  value={analytics.totalAssessments}
                  className="text-2xl font-bold text-text"
                />
              </div>
              <div className="text-3xl">📝</div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-textSecondary">Submissions</span>
                <span className="text-info font-medium">{analytics.totalSubmissions}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textSecondary text-sm mb-1">Avg Grading Time</p>
                <div className="text-2xl font-bold text-text">
                  {analytics.averageGradingTime}h
                </div>
              </div>
              <div className="text-3xl">⏱️</div>
            </div>
            <div className="mt-4">
              <Badge 
                variant="glass" 
                className={analytics.averageGradingTime < 4 ? 'bg-success' : 'bg-warning'}
              >
                {analytics.averageGradingTime < 4 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
          </GlassCard>

          <GlassCard variant="elevated" className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textSecondary text-sm mb-1">System Uptime</p>
                <div className="text-2xl font-bold text-text">
                  {analytics.systemUptime}%
                </div>
              </div>
              <div className="text-3xl">🚀</div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-textSecondary">Storage</span>
                <span className="text-warning font-medium">
                  {formatBytes(analytics.storageUsed)} / {formatBytes(analytics.storageLimit)}
                </span>
              </div>
              <ProgressIndicator
                value={storagePercentage}
                color={storagePercentage > 80 ? 'error' : storagePercentage > 60 ? 'warning' : 'success'}
                className="mt-2"
                showLabel={false}
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard variant="elevated" className="p-6">
              <h3 className="text-lg font-semibold text-text mb-4">User Growth</h3>
              <AnimatedLineChart
                data={mockChartData.userGrowth.map(item => ({ name: item.month, users: item.users }))}
                lines={[{ dataKey: 'users', color: '#3B82F6' }]}
                height={300}
              />
            </GlassCard>
          </motion.div>

          {/* Submission Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlassCard variant="elevated" className="p-6">
              <h3 className="text-lg font-semibold text-text mb-4">Weekly Submissions</h3>
              <AnimatedBarChart
                data={mockChartData.submissionTrends.map(item => ({ name: item.day, value: item.submissions }))}
                color="#10B981"
                height={300}
              />
            </GlassCard>
          </motion.div>
        </div>

        {/* Grading Metrics and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Grading Response Times */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <GlassCard variant="elevated" className="p-6">
              <h3 className="text-lg font-semibold text-text mb-4">Grading Response Times</h3>
              <AnimatedAreaChart
                data={mockChartData.gradingMetrics.map(item => ({ name: item.hour, value: item.count }))}
                color="#F59E0B"
                height={300}
              />
            </GlassCard>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlassCard variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text">Recent Activity</h3>
                <Badge variant="glass" className="bg-primary">
                  Live
                </Badge>
              </div>
              
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {analytics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Badge 
                        variant="glass" 
                        size="sm"
                        className={getActionColor(activity.action)}
                      >
                        {getActionIcon(activity.action)}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text">
                        <span className="font-medium">{activity.userName}</span>
                        {' '}
                        <span className="text-textSecondary">
                          {activity.action.replace('_', ' ')}
                        </span>
                        {' '}
                        <span className="font-medium">{activity.resource}</span>
                      </p>
                      <p className="text-xs text-textSecondary">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <button className="w-full px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors">
                  View All Activity
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <GlassCard variant="subtle" className="p-6">
            <h3 className="text-lg font-semibold text-text mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm font-medium text-text">Manage Users</div>
              </button>
              <button className="p-4 bg-success/10 hover:bg-success/20 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">🎓</div>
                <div className="text-sm font-medium text-text">Manage Cohorts</div>
              </button>
              <button className="p-4 bg-warning/10 hover:bg-warning/20 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm font-medium text-text">Generate Reports</div>
              </button>
              <button className="p-4 bg-info/10 hover:bg-info/20 rounded-lg transition-colors text-center">
                <div className="text-2xl mb-2">⚙️</div>
                <div className="text-sm font-medium text-text">System Settings</div>
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}