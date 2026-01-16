import { useAuth } from '../../contexts/AuthContext';
import { Loader } from '../../components/ui/Loader';
import { useEffect, useState } from 'react';

import { isStudentRole } from '../../utils/constants';
import { api } from '../../utils/api';
import { StudentDashboard } from './StudentDashboard';
import { FacultyDashboard } from './FacultyDashboard';
import { CoordinatorDashboard } from './CoordinatorDashboard';
import { AdminDashboard } from './AdminDashboard';
import { ScrollReveal as Reveal } from '../../components/ui/ScrollReveal';



interface GroupData {
  _id: string;
  groupCode: string;
  groupName?: string;
  leaderId: string;
  members: any[];
  status: 'forming' | 'complete' | 'applied' | 'approved' | 'frozen';
  projectType: string;
  semester: string;
  year: number;
}

interface DashboardData {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    studentId?: string;
    facultyId?: string;
    assignedProject?: any;
    assignedFaculty?: any;
  };
  group?: GroupData;
  applications?: any[];
  studentStatus?: {
    hasGroup: boolean;
    hasProject: boolean;
    hasFaculty: boolean;
    applicationsCount: number;
    approvedApplications: number;
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // For students, use the new comprehensive dashboard endpoint
      if (isStudentRole(user?.role)) {
        try {
          const response = await api.get('/users/dashboard-data');
          if (response.success && response.data) {
            setDashboardData(response.data as DashboardData);
          }
        } catch (err: any) {
          console.error('Error fetching dashboard data:', err);
          // Fallback to old group endpoint if new endpoint fails
          try {
            const groupRes = await api.get('/groups/my-group');
            if (groupRes.success && groupRes.data) {
              setDashboardData({
                user: {
                  _id: user?.id || '',
                  name: user?.name || '',
                  email: user?.email || '',
                  role: user?.role || '',
                  department: user?.profile?.department
                },
                group: groupRes.data as any
              });
            }
          } catch (fallbackErr: any) {
            if (fallbackErr.response?.status !== 404) {
              console.error('Error fetching group fallback:', fallbackErr);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleRefresh = () => {
      fetchDashboardData();
    };
    document.addEventListener('refresh-active-view', handleRefresh);
    return () => document.removeEventListener('refresh-active-view', handleRefresh);
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" text="Loading Dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header with greeting */}
      <Reveal direction="down" fullWidth>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b border-slate-200/60">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name?.split(' ').slice(0, 4).join(' ')}! 👋
            </h1>

          </div>
          <div className="text-right self-end md:self-auto flex-shrink-0 bg-white/50 backdrop-blur-sm p-3 rounded-xl shadow-sm">
            <p className="text-xl font-mono text-slate-600 font-medium">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </Reveal>

      {/* Role Specific Content */}
      <Reveal delay={0.1} fullWidth>
        <div className="min-h-[500px]">
          {isStudentRole(user?.role) && (
            <StudentDashboard
              user={user}
              dashboardData={dashboardData}
              refreshData={fetchDashboardData}
            />
          )}

          {user?.role === 'faculty' && <FacultyDashboard />}
          {user?.role === 'coordinator' && <CoordinatorDashboard />}
          {user?.role === 'admin' && <AdminDashboard />}
        </div>
      </Reveal>
    </div>
  );
}