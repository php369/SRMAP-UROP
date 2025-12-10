import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { isStudentRole } from '../../utils/constants';
import { api } from '../../utils/api';

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

interface EligibilityData {
  type: 'IDP' | 'UROP' | 'CAPSTONE';
  year: number;
  semester: number;
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

interface ApplicationData {
  status: 'pending' | 'approved' | 'rejected' | 'released';
  selectedProjectId?: string;
}

interface ProjectData {
  facultyName: string;
  facultyId: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);



  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Determine eligibility from user role for students
        if (user && isStudentRole(user.role)) {
          try {
            // Map role to project type
            const roleToProjectType: Record<string, 'IDP' | 'UROP' | 'CAPSTONE'> = {
              'idp-student': 'IDP',
              'urop-student': 'UROP',
              'capstone-student': 'CAPSTONE'
            };

            const projectType = roleToProjectType[user.role];
            
            if (projectType) {
              // Set eligibility based on role
              setEligibility({
                type: projectType,
                year: new Date().getFullYear(),
                semester: Math.ceil((new Date().getMonth() + 1) / 6) // 1 for Jan-Jun, 2 for Jul-Dec
              });
              console.log(`✅ User eligible for ${projectType} based on role: ${user.role}`);
            }
          } catch (err: any) {
            console.error('Error determining eligibility:', err);
          }
        }

        // Fetch group if student
        if (isStudentRole(user?.role)) {
          try {
            const groupRes = await api.get('/groups/my-group');
            if (groupRes.success && groupRes.data) {
              setGroup(groupRes.data as any);
            }
          } catch (err: any) {
            // No group found is okay
            if (err.response?.status !== 404) {
              console.error('Error fetching group:', err);
            }
          }

          // Fetch application
          try {
            const appRes = await api.get('/applications/my-application');
            if (appRes.success && appRes.data) {
              const appData = Array.isArray(appRes.data) ? appRes.data[0] : appRes.data;
              console.log('✅ Dashboard: Setting application data:', appData);
              setApplication(appData);

              // If approved, fetch project details
              if (appData.status === 'approved' && appData.selectedProjectId) {
                console.log('🎯 Dashboard: Application approved, fetching project details...');
                const projectRes = await api.get(`/projects/${appData.selectedProjectId}`);
                if (projectRes.success && projectRes.data) {
                  setProject(projectRes.data as any);
                }
              }
            }
          } catch (err: any) {
            // No application found is okay
            if (err.response?.status !== 404) {
              console.error('Error fetching application:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Get application status display text
  const getApplicationStatus = () => {
    if (!application) return 'Not Applied';
    if (application.status === 'approved') return 'Approved';
    if (application.status === 'pending') return 'Pending';
    if (application.status === 'rejected') return 'Rejected';
    return 'Frozen';
  };

  // Check if user is group leader
  // leaderId might be populated (object) or just an ID (string)
  const getLeaderId = (leaderId: any) => {
    if (!leaderId) return null;
    if (typeof leaderId === 'object' && leaderId._id) return leaderId._id;
    return leaderId;
  };

  const isGroupLeader = group && user && (
    getLeaderId(group.leaderId) === user.id ||
    String(getLeaderId(group.leaderId)) === String(user.id)
  );

  // Handle remove member
  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    try {
      const response = await axios.post(`/api/v1/groups/${group?._id}/remove-member`, {
        memberId
      });

      if (response.data?.success) {
        toast.success('Member removed successfully');
        // Refresh group data
        const groupRes = await api.get('/groups/my-group');
        if (groupRes.success && groupRes.data) {
          setGroup(groupRes.data as any);
        }
      } else {
        toast.error(response.data?.error?.message || 'Failed to remove member');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header with greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-textSecondary mt-2">
            {isStudentRole(user?.role) && 'Track your project progress, manage applications, and collaborate with your team.'}
            {user?.role === 'faculty' && 'Manage your projects, review applications, and guide your students.'}
            {user?.role === 'coordinator' && 'Oversee project approvals, manage applications, and coordinate activities.'}
            {user?.role === 'admin' && 'Manage system-wide settings, user eligibility, and application windows.'}
          </p>
        </div>
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

      {/* Student Dashboard Content */}
      {isStudentRole(user?.role) && (
        <div className="space-y-6">
          {/* Quick Navigation and Application Status - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Navigation - Takes 2 columns */}
            <div className="lg:col-span-2 bg-surface/50 backdrop-blur-md rounded-lg p-6 border border-border shadow-lg">
              <h3 className="text-lg font-semibold text-text mb-4">Quick Navigation</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm font-medium text-text">Dashboard</span>
                </button>

                <button
                  onClick={() => navigate('/dashboard/application')}
                  className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-text">Application</span>
                </button>

                <button
                  onClick={() => navigate('/dashboard/submission')}
                  className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-medium text-text">Submission</span>
                </button>

                <button
                  onClick={() => navigate('/dashboard/assessment')}
                  className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="text-sm font-medium text-text">Assessment</span>
                </button>

                <button
                  onClick={() => navigate('/dashboard/meetings')}
                  className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
                >
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-text">Meetings</span>
                </button>
              </div>
            </div>

            {/* Application Status - Takes 1 column */}
            <div className="bg-surface/50 backdrop-blur-md rounded-lg p-6 border border-border shadow-lg">
              <h3 className="text-lg font-semibold text-text mb-4">Application Status</h3>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${!application ? 'bg-gray-400' :
                  application.status === 'approved' ? 'bg-success' :
                    application.status === 'pending' ? 'bg-warning' :
                      application.status === 'rejected' ? 'bg-error' :
                        'bg-gray-400'
                  }`}></div>
                <p className="text-xl font-bold text-text">{getApplicationStatus()}</p>
              </div>
              {!application && (
                <button
                  onClick={() => navigate('/dashboard/application')}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                >
                  Apply Now
                </button>
              )}
              {application && (
                <p className="text-sm text-textSecondary mt-2">
                  {application.status === 'approved' && 'Your application has been approved! Check your mentor information below.'}
                  {application.status === 'pending' && 'Your application is under review. We\'ll notify you once it\'s processed.'}
                  {application.status === 'rejected' && 'Your application was not approved. Please contact your coordinator.'}
                </p>
              )}
            </div>
          </div>

          {/* Project Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Project Type Card */}
            {eligibility && (
              <div className="bg-surface/50 backdrop-blur-md rounded-lg p-6 border border-border shadow-lg">
                <h3 className="text-lg font-semibold text-text mb-2">Project Type</h3>
                <p className="text-2xl font-bold text-primary">{eligibility.type}</p>
                <p className="text-sm text-textSecondary mt-1">
                  Year {eligibility.year}, Semester {eligibility.semester}
                </p>
              </div>
            )}

            {/* Group Information Card */}
            {group && (
              <div className="bg-surface/50 backdrop-blur-md rounded-lg p-6 border border-border shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text">Group Information</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${group.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      group.status === 'applied' ? 'bg-blue-500/20 text-blue-400' :
                        group.status === 'complete' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-yellow-500/20 text-yellow-400'
                    }`}>
                    {group.status === 'forming' ? '🔄 Forming' :
                      group.status === 'complete' ? '✓ Complete' :
                        group.status === 'applied' ? '📝 Applied' :
                          group.status === 'approved' ? '✅ Approved' :
                            group.status === 'frozen' ? '❄️ Frozen' : group.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-textSecondary">Group Code</p>
                    <p className="text-xl font-bold text-primary font-mono">{group.groupCode}</p>
                  </div>

                  <div>
                    <p className="text-sm text-textSecondary">Your Role</p>
                    <p className="text-md font-semibold text-text">
                      {isGroupLeader ? '👑 Group Leader' : '👤 Member'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-textSecondary mb-2">Members ({group.members.length} / 4)</p>
                    <div className="space-y-2">
                      {group.members && group.members.map((member: any, index: number) => (
                        <div key={member._id || index} className="flex items-center justify-between p-2 bg-surface/80 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                              {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text">
                                {member.name || 'Unknown'}
                                {member._id === getLeaderId(group.leaderId) && ' 👑'}
                              </p>
                              <p className="text-xs text-textSecondary">{member.email || member.studentId || 'No email'}</p>
                            </div>
                          </div>
                          {isGroupLeader && member._id !== getLeaderId(group.leaderId) && (
                            <button
                              onClick={() => handleRemoveMember(member._id)}
                              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                              title="Remove member"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mentor Information Card (only if approved) */}
            {application?.status === 'approved' && project && (
              <div className="bg-surface/50 backdrop-blur-md rounded-lg p-6 border border-border shadow-lg">
                <h3 className="text-lg font-semibold text-text mb-4">Mentor Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-textSecondary">Mentor Name</p>
                    <p className="text-xl font-bold text-primary">{project.facultyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-textSecondary">Faculty ID</p>
                    <p className="text-xl font-bold text-text font-mono">{project.facultyId}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Faculty Dashboard */}
      {user?.role === 'faculty' && (
        <div className="bg-surface/50 backdrop-blur-md rounded-lg p-6 border border-border shadow-lg">
          <h3 className="text-lg font-semibold text-text mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm font-medium text-text">Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/projects')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-sm font-medium text-text">My Projects</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/faculty/applications')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="text-sm font-medium text-text">Applications</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/faculty/assessment')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span className="text-sm font-medium text-text">Assessment</span>
            </button>
          </div>
        </div>
      )}

      {/* Coordinator Dashboard */}
      {user?.role === 'coordinator' && (
        <div className="bg-surface/50 backdrop-blur-md rounded-lg p-6 border border-border shadow-lg">
          <h3 className="text-lg font-semibold text-text mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm font-medium text-text">Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/projects')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-sm font-medium text-text">My Projects</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/projects/approvals')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-text">Approvals</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/faculty/applications')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="text-sm font-medium text-text">Applications</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/control')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-text">Control Panel</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Dashboard */}
      {user?.role === 'admin' && (
        <div className="bg-surface/50 backdrop-blur-md rounded-lg p-6 border border-border shadow-lg">
          <h3 className="text-lg font-semibold text-text mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-sm font-medium text-text">Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/admin/eligibility')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm font-medium text-text">Eligibility Upload</span>
            </button>

            <button
              onClick={() => navigate('/dashboard/admin/windows')}
              className="flex flex-col items-center gap-2 p-4 bg-surface/80 rounded-lg hover:bg-hover transition-all duration-200 border border-border hover:border-primary/50 hover:shadow-md"
            >
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-text">Windows</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
