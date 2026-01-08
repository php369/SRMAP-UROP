import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { isStudentRole } from '../../utils/constants';
import { api } from '../../utils/api';
import { StudentDashboard } from './StudentDashboard';
import { FacultyDashboard } from './FacultyDashboard';
import { CoordinatorDashboard } from './CoordinatorDashboard';
import { AdminDashboard } from './AdminDashboard';

// Configure axios base URL (only once)
if (!axios.defaults.baseURL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
}

// Add auth token interceptor (only once)
let interceptorAdded = false;
if (!interceptorAdded) {
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('srm_portal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  interceptorAdded = true;
}

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
    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header with greeting */}
      <div className="glass p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-textSecondary mt-2">
            {isStudentRole(user?.role) && 'Track your project progress and collaborate with your team.'}
            {user?.role === 'faculty' && 'Manage your projects, applications and students.'}
            {user?.role === 'coordinator' && 'Oversee project approvals and coordinate activities.'}
            {user?.role === 'admin' && 'Manage system-wide settings and windows.'}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm text-textSecondary uppercase tracking-widest font-semibold">Today</p>
          <p className="text-xl font-mono text-text">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Role Specific Content */}
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
    </div>
  );
}