import { useAuth } from '../../contexts/AuthContext';
import { Badge, AnimatedCounter, ProgressIndicator, QuickActionCard } from '../../components/ui';
import { 
  BentoStat, 
  BentoList, 
  BentoItem,
  BentoDashboard,
  BentoChart 
} from '../../components/layout/BentoGrid';
import { AnimatedAreaChart, AnimatedLineChart, AnimatedBarChart } from '../../components/charts';
import { HeroSection } from '../../components/sections';
import { useNavigate } from 'react-router-dom';

interface ActivityItem {
  id: number;
  type: 'submission' | 'grade' | 'assessment';
  user: string;
  action: string;
  time: string;
  avatar: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  variant?: 'default' | 'primary' | 'secondary';
  badge?: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock stats data - in real app this would come from API
  const stats = {
    totalAssessments: 12,
    submissions: 8,
    averageGrade: 85,
    pendingReviews: 4,
    completionRate: 75,
    activeProjects: 6,
  };

  // Chart data
  const submissionTrendsData = [
    { name: 'Jan', value: 12, value2: 8 },
    { name: 'Feb', value: 19, value2: 15 },
    { name: 'Mar', value: 15, value2: 12 },
    { name: 'Apr', value: 25, value2: 20 },
    { name: 'May', value: 22, value2: 18 },
    { name: 'Jun', value: 30, value2: 25 },
    { name: 'Jul', value: 28, value2: 22 },
  ];

  const gradeDistributionData = [
    { name: 'A+', value: 15, color: '#10b981' },
    { name: 'A', value: 25, color: '#059669' },
    { name: 'B+', value: 20, color: '#f59e0b' },
    { name: 'B', value: 18, color: '#d97706' },
    { name: 'C+', value: 12, color: '#ef4444' },
    { name: 'C', value: 8, color: '#dc2626' },
    { name: 'F', value: 2, color: '#991b1b' },
  ];

  const activityData = [
    { name: 'Mon', submissions: 12, grades: 8, assessments: 3 },
    { name: 'Tue', submissions: 15, grades: 10, assessments: 2 },
    { name: 'Wed', submissions: 18, grades: 12, assessments: 4 },
    { name: 'Thu', submissions: 22, grades: 15, assessments: 1 },
    { name: 'Fri', submissions: 25, grades: 18, assessments: 5 },
    { name: 'Sat', submissions: 8, grades: 6, assessments: 0 },
    { name: 'Sun', submissions: 5, grades: 3, assessments: 1 },
  ];

  const recentActivity: ActivityItem[] = [
    { 
      id: 1,
      type: 'submission', 
      user: 'John Doe', 
      action: 'submitted assignment', 
      time: '2 hours ago',
      avatar: 'JD'
    },
    { 
      id: 2,
      type: 'grade', 
      user: 'Jane Smith', 
      action: 'received grade', 
      time: '4 hours ago',
      avatar: 'JS'
    },
    { 
      id: 3,
      type: 'assessment', 
      user: 'Dr. Johnson', 
      action: 'created new assessment', 
      time: '1 day ago',
      avatar: 'DJ'
    },
    { 
      id: 4,
      type: 'submission', 
      user: 'Mike Wilson', 
      action: 'submitted project', 
      time: '2 days ago',
      avatar: 'MW'
    },
  ];

  const quickActions: QuickAction[] = user?.role === 'faculty' ? [
      {
        title: 'Create Assessment',
        description: 'Set up a new assessment with Google Meet integration',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ),
        action: () => navigate('/assessments/new'),
        variant: 'primary' as const,
      },
      {
        title: 'Review Submissions',
        description: 'Grade pending submissions and provide feedback',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        action: () => navigate('/submissions'),
        badge: stats.pendingReviews > 0 ? stats.pendingReviews.toString() : undefined,
      },
      {
        title: 'Manage Cohorts',
        description: 'View and manage student cohorts and enrollments',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        action: () => navigate('/admin/cohorts'),
      },
    ] : [
      {
        title: 'View Assessments',
        description: 'Check upcoming assessments and join meetings',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        action: () => navigate('/assessments'),
        variant: 'primary' as const,
      },
      {
        title: 'Submit Work',
        description: 'Upload your assignments and project submissions',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        ),
        action: () => navigate('/submissions/new'),
      },
      {
        title: 'View Grades',
        description: 'Check your grades and feedback from instructors',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        action: () => navigate('/grades'),
      },
    ];

  return (
    <div className="space-y-8">
      {/* Hero Section - Only show for new users or special occasions */}
      {user?.role === 'student' && (
        <div className="mb-12 -mx-4 sm:-mx-6 lg:-mx-8">
          <HeroSection
            className="h-96"
            onGetStarted={() => navigate('/assessments')}
            onLearnMore={() => navigate('/help')}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-textSecondary mt-2">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="glass" size="lg">
            {user?.role}
          </Badge>
          <div className="text-right">
            <p className="text-sm text-textSecondary">Today</p>
            <p className="text-lg font-semibold text-text">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard content using BentoDashboard */}
      <BentoDashboard className="gap-6">
        {/* Enhanced Stats with Animations */}
        <BentoStat
          title="Total Assessments"
          value={<AnimatedCounter value={stats.totalAssessments} />}
          change="+2 this week"
          trend="up"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        <BentoStat
          title="Submissions"
          value={<AnimatedCounter value={stats.submissions} />}
          change="+3 today"
          trend="up"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          }
        />

        <BentoStat
          title="Average Grade"
          value={<AnimatedCounter value={stats.averageGrade} suffix="%" />}
          change="+5% from last month"
          trend="up"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />

        <BentoStat
          title="Pending Reviews"
          value={<AnimatedCounter value={stats.pendingReviews} />}
          change="2 due today"
          trend="neutral"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Progress Overview Card */}
        <BentoItem size="md" className="col-span-1 sm:col-span-2">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">Progress Overview</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm text-textSecondary">Active</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-text">Completion Rate</span>
                  <span className="text-sm text-textSecondary">
                    <AnimatedCounter value={stats.completionRate} suffix="%" />
                  </span>
                </div>
                <ProgressIndicator 
                  value={stats.completionRate} 
                  color="success"
                  size="md"
                  showLabel={false}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <ProgressIndicator 
                    value={stats.completionRate} 
                    variant="circular"
                    color="primary"
                    size="sm"
                  />
                  <p className="text-xs text-textSecondary mt-2">Overall</p>
                </div>
                <div className="text-center">
                  <ProgressIndicator 
                    value={85} 
                    variant="circular"
                    color="secondary"
                    size="sm"
                  />
                  <p className="text-xs text-textSecondary mt-2">This Week</p>
                </div>
              </div>
            </div>
          </div>
        </BentoItem>

        {/* Active Projects Card */}
        <BentoStat
          title="Active Projects"
          value={<AnimatedCounter value={stats.activeProjects} />}
          change="2 new this month"
          trend="up"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        {/* Quick Actions */}
        <BentoItem size="lg" className="col-span-1 sm:col-span-2 lg:col-span-3">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text">Quick Actions</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm text-textSecondary">Ready</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action: QuickAction, index: number) => (
                <QuickActionCard
                  key={index}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  onClick={action.action}
                  variant={action.variant}
                  badge={action.badge}
                  className="h-full"
                />
              ))}
            </div>
          </div>
        </BentoItem>

        {/* Submission Trends Chart */}
        <BentoChart 
          title="Submission Trends"
          actions={
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-xs text-textSecondary">Submissions</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                <span className="text-xs text-textSecondary">Grades</span>
              </div>
            </div>
          }
        >
          <AnimatedAreaChart
            data={submissionTrendsData}
            height={250}
            color="#6366f1"
            color2="#14b8a6"
            gradientId="submissionTrends"
          />
        </BentoChart>

        {/* Grade Distribution Chart */}
        <BentoChart title="Grade Distribution">
          <AnimatedBarChart
            data={gradeDistributionData}
            height={250}
            variant="gradient"
            chartId="gradeDistribution"
          />
        </BentoChart>

        {/* Weekly Activity Chart */}
        <BentoChart 
          title="Weekly Activity"
          className="col-span-1 sm:col-span-2"
        >
          <AnimatedLineChart
            data={activityData}
            lines={[
              { dataKey: 'submissions', color: '#6366f1', strokeWidth: 3 },
              { dataKey: 'grades', color: '#14b8a6', strokeWidth: 2 },
              { dataKey: 'assessments', color: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 5' },
            ]}
            height={250}
            showLegend={true}
            chartId="weeklyActivity"
          />
        </BentoChart>

        {/* Enhanced Recent Activity */}
        <BentoList
          title="Recent Activity"
          items={recentActivity}
          actions={
            <button 
              onClick={() => navigate('/activity')}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              View All
            </button>
          }
          renderItem={(item) => (
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-all duration-200 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-sm font-medium text-primary">
                    {item.avatar}
                  </span>
                </div>
                {/* Activity type indicator */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center ${
                  item.type === 'submission' ? 'bg-success' :
                  item.type === 'grade' ? 'bg-warning' :
                  'bg-info'
                }`}>
                  {item.type === 'submission' && (
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {item.type === 'grade' && (
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  {item.type === 'assessment' && (
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text truncate">
                  <span className="font-medium">{item.user}</span> {item.action}
                </p>
                <p className="text-xs text-textSecondary">{item.time}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-textSecondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )}
        />
      </BentoDashboard>
    </div>
  );
}
