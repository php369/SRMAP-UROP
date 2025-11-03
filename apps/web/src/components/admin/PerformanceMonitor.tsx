import React, { useState, useEffect } from 'react';
import { Activity, Clock, AlertTriangle, CheckCircle, TrendingUp, Server } from 'lucide-react';

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  errorRate: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  topSlowEndpoints: Array<{
    url: string;
    averageTime: number;
    count: number;
  }>;
}

interface BudgetCheck {
  withinBudget: boolean;
  violations: string[];
  recommendations: string[];
}

export function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [budget, setBudget] = useState<BudgetCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, these would be API calls
      // const [statsResponse, budgetResponse] = await Promise.all([
      //   fetch('/api/v1/performance/stats'),
      //   fetch('/api/v1/performance/budget')
      // ]);
      
      // Mock data for demonstration
      const mockStats: PerformanceStats = {
        totalRequests: 1250,
        averageResponseTime: 245.67,
        slowRequests: 12,
        errorRate: 2.4,
        memoryUsage: {
          rss: 134217728,
          heapTotal: 67108864,
          heapUsed: 45088768,
          external: 2097152,
          arrayBuffers: 1048576,
        },
        topSlowEndpoints: [
          { url: 'POST /api/v1/assessments', averageTime: 1250.5, count: 45 },
          { url: 'GET /api/v1/submissions', averageTime: 890.2, count: 123 },
          { url: 'POST /api/v1/auth/google', averageTime: 756.8, count: 67 },
        ],
      };

      const mockBudget: BudgetCheck = {
        withinBudget: false,
        violations: [
          'Average response time (245.67ms) is acceptable but approaching budget (500ms)',
          'Error rate (2.4%) exceeds budget (1%)',
        ],
        recommendations: [
          'Review error logs and fix recurring issues',
          'Consider implementing caching for frequently accessed data',
        ],
      };

      setStats(mockStats);
      setBudget(mockBudget);
      setError(null);
    } catch (err) {
      setError('Failed to fetch performance data');
      console.error('Performance monitoring error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    return `${ms.toFixed(2)}ms`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Performance Monitor</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold">Performance Monitor</h3>
        </div>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchPerformanceData}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats || !budget) return null;

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Performance Overview</h3>
          </div>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${
            budget.withinBudget 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {budget.withinBudget ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{budget.withinBudget ? 'Within Budget' : 'Budget Exceeded'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total Requests</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.totalRequests.toLocaleString()}</p>
            <p className="text-xs text-blue-600">Last hour</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Avg Response Time</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{formatTime(stats.averageResponseTime)}</p>
            <p className="text-xs text-green-600">Target: &lt;500ms</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Slow Requests</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900">{stats.slowRequests}</p>
            <p className="text-xs text-yellow-600">&gt;1000ms</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">Error Rate</span>
            </div>
            <p className="text-2xl font-bold text-red-900">{stats.errorRate.toFixed(1)}%</p>
            <p className="text-xs text-red-600">Target: &lt;1%</p>
          </div>
        </div>
      </div>

      {/* Memory Usage */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Server className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Memory Usage</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Heap Used</span>
              <span className="text-sm text-gray-600">{formatBytes(stats.memoryUsage.heapUsed)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ 
                  width: `${(stats.memoryUsage.heapUsed / stats.memoryUsage.heapTotal) * 100}%` 
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">RSS</span>
              <span className="text-sm text-gray-600">{formatBytes(stats.memoryUsage.rss)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">External</span>
              <span className="text-sm text-gray-600">{formatBytes(stats.memoryUsage.external)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Slow Endpoints */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Slowest Endpoints</h3>
        <div className="space-y-3">
          {stats.topSlowEndpoints.map((endpoint, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{endpoint.url}</p>
                <p className="text-sm text-gray-600">{endpoint.count} requests</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">{formatTime(endpoint.averageTime)}</p>
                <p className="text-xs text-gray-500">avg response</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Violations */}
      {budget.violations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4 text-yellow-800">Performance Budget Violations</h3>
          <div className="space-y-2 mb-4">
            {budget.violations.map((violation, index) => (
              <div key={index} className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">{violation}</p>
              </div>
            ))}
          </div>

          <h4 className="font-medium mb-2 text-blue-800">Recommendations:</h4>
          <div className="space-y-1">
            {budget.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}