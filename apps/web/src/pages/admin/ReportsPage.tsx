import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ReportFilter, 
  SubmissionReport, 
  GradingLatencyReport, 
  ExportProgress 
} from '../../types';
import { GlassCard, Badge, Input, GlowButton, ProgressIndicator } from '../../components/ui';
import { AnimatedLineChart } from '../../components/charts';
import { cn } from '../../utils/cn';

// Mock data
const mockSubmissionReports: SubmissionReport[] = [
  {
    id: '1',
    studentName: 'Alice Johnson',
    studentEmail: 'alice@srmap.edu.in',
    assessmentTitle: 'ML Assignment 1',
    courseName: 'Machine Learning',
    submittedAt: '2024-01-25T14:30:00Z',
    gradedAt: '2024-01-26T10:15:00Z',
    score: 85,
    maxScore: 100,
    status: 'graded',
    gradingLatency: 19.75,
    attempt: 1,
    facultyName: 'Dr. Smith',
  },
  // Add more mock data...
];

const mockGradingLatency: GradingLatencyReport[] = [
  {
    facultyId: '1',
    facultyName: 'Dr. Smith',
    department: 'Computer Science',
    totalSubmissions: 45,
    gradedSubmissions: 42,
    averageLatency: 18.5,
    medianLatency: 16.0,
    maxLatency: 72.0,
    pendingSubmissions: 3,
  },
];

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState<'submissions' | 'grading' | 'courses' | 'usage'>('submissions');
  const [filters, setFilters] = useState<ReportFilter>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  });
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  const reportTypes = [
    { id: 'submissions', label: 'Submissions', icon: '📤', description: 'Student submission analytics' },
    { id: 'grading', label: 'Grading Latency', icon: '⏱️', description: 'Faculty grading performance' },
    { id: 'courses', label: 'Course Analytics', icon: '📚', description: 'Course performance metrics' },
    { id: 'usage', label: 'System Usage', icon: '📊', description: 'Platform usage statistics' },
  ];

  const handleExportCSV = async () => {
    const exportId = `export_${Date.now()}`;
    
    setExportProgress({
      id: exportId,
      type: 'csv',
      status: 'preparing',
      progress: 0,
      totalRecords: mockSubmissionReports.length,
      processedRecords: 0,
      createdAt: new Date().toISOString(),
    });

    // Simulate export progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setExportProgress(prev => prev ? {
        ...prev,
        status: i === 100 ? 'completed' : 'generating',
        progress: i,
        processedRecords: Math.floor((i / 100) * prev.totalRecords),
        downloadUrl: i === 100 ? `/downloads/${exportId}.csv` : undefined,
        completedAt: i === 100 ? new Date().toISOString() : undefined,
      } : null);
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2">Reports & Analytics</h1>
          <p className="text-textSecondary">
            Generate comprehensive reports and export data for analysis
          </p>
        </motion.div>

        {/* Report Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveReport(type.id as any)}
                className={cn(
                  'p-6 rounded-lg border transition-all duration-200 text-left',
                  activeReport === type.id
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-border bg-surface/50 hover:bg-surface/70'
                )}
              >
                <div className="text-3xl mb-3">{type.icon}</div>
                <h3 className="font-semibold text-text mb-1">{type.label}</h3>
                <p className="text-sm text-textSecondary">{type.description}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <GlassCard variant="subtle" className="p-6">
            <h3 className="text-lg font-semibold text-text mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Start Date</label>
                <Input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">End Date</label>
                <Input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Department</label>
                <select className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">All Departments</option>
                  <option value="cs">Computer Science</option>
                  <option value="ece">Electronics</option>
                  <option value="me">Mechanical</option>
                </select>
              </div>
              <div className="flex items-end">
                <GlowButton
                  onClick={() => handleExportCSV()}
                  className="w-full"
                >
                  Export CSV
                </GlowButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Export Progress */}
        <AnimatePresence>
          {exportProgress && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <GlassCard variant="elevated" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text">Export Progress</h3>
                  <Badge 
                    variant="glass" 
                    className={
                      exportProgress.status === 'completed' ? 'bg-success' :
                      exportProgress.status === 'failed' ? 'bg-error' : 'bg-info'
                    }
                  >
                    {exportProgress.status}
                  </Badge>
                </div>
                
                <ProgressIndicator
                  value={exportProgress.progress}
                  color={exportProgress.status === 'failed' ? 'error' : 'primary'}
                  className="mb-4"
                />
                
                <div className="flex items-center justify-between text-sm text-textSecondary">
                  <span>
                    {exportProgress.processedRecords} / {exportProgress.totalRecords} records
                  </span>
                  {exportProgress.downloadUrl && (
                    <button
                      onClick={() => downloadCSV(mockSubmissionReports, 'submissions_report')}
                      className="px-4 py-2 bg-success/20 text-success rounded-lg hover:bg-success/30 transition-colors"
                    >
                      Download CSV
                    </button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Content */}
        <motion.div
          key={activeReport}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeReport === 'submissions' && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlassCard variant="elevated" className="p-6 text-center">
                  <div className="text-3xl font-bold text-text mb-2">1,247</div>
                  <div className="text-textSecondary">Total Submissions</div>
                </GlassCard>
                <GlassCard variant="elevated" className="p-6 text-center">
                  <div className="text-3xl font-bold text-success mb-2">1,089</div>
                  <div className="text-textSecondary">Graded</div>
                </GlassCard>
                <GlassCard variant="elevated" className="p-6 text-center">
                  <div className="text-3xl font-bold text-warning mb-2">158</div>
                  <div className="text-textSecondary">Pending</div>
                </GlassCard>
                <GlassCard variant="elevated" className="p-6 text-center">
                  <div className="text-3xl font-bold text-text mb-2">78.5%</div>
                  <div className="text-textSecondary">Avg Score</div>
                </GlassCard>
              </div>

              {/* Submissions Chart */}
              <GlassCard variant="elevated" className="p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Submissions Over Time</h3>
                <AnimatedLineChart
                  data={[
                    { name: '2024-01-01', submissions: 45 },
                    { name: '2024-01-02', submissions: 52 },
                    { name: '2024-01-03', submissions: 38 },
                    { name: '2024-01-04', submissions: 61 },
                    { name: '2024-01-05', submissions: 73 },
                  ]}
                  lines={[{ dataKey: 'submissions', color: '#3B82F6' }]}
                  height={300}
                />
              </GlassCard>
            </div>
          )}

          {activeReport === 'grading' && (
            <div className="space-y-8">
              {/* Grading Latency Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard variant="elevated" className="p-6 text-center">
                  <div className="text-3xl font-bold text-text mb-2">18.5h</div>
                  <div className="text-textSecondary">Avg Grading Time</div>
                </GlassCard>
                <GlassCard variant="elevated" className="p-6 text-center">
                  <div className="text-3xl font-bold text-success mb-2">87%</div>
                  <div className="text-textSecondary">Graded Within 24h</div>
                </GlassCard>
                <GlassCard variant="elevated" className="p-6 text-center">
                  <div className="text-3xl font-bold text-warning mb-2">23</div>
                  <div className="text-textSecondary">Overdue Submissions</div>
                </GlassCard>
              </div>

              {/* Faculty Performance */}
              <GlassCard variant="elevated" className="p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Faculty Grading Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 text-text">Faculty</th>
                        <th className="text-left py-3 text-text">Department</th>
                        <th className="text-left py-3 text-text">Avg Latency</th>
                        <th className="text-left py-3 text-text">Pending</th>
                        <th className="text-left py-3 text-text">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockGradingLatency.map((faculty) => (
                        <tr key={faculty.facultyId} className="border-b border-border/50">
                          <td className="py-3 text-text">{faculty.facultyName}</td>
                          <td className="py-3 text-textSecondary">{faculty.department}</td>
                          <td className="py-3 text-text">{faculty.averageLatency}h</td>
                          <td className="py-3">
                            <Badge 
                              variant="glass" 
                              className={faculty.pendingSubmissions > 5 ? 'bg-error' : 'bg-success'}
                            >
                              {faculty.pendingSubmissions}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <ProgressIndicator
                              value={(faculty.gradedSubmissions / faculty.totalSubmissions) * 100}
                              color={faculty.averageLatency < 24 ? 'success' : 'warning'}
                              showLabel={false}
                              className="w-24"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
