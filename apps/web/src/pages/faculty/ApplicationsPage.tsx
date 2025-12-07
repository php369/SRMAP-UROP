import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, CheckCircle, XCircle, Eye, Filter, Edit2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard, GlowButton } from '../../components/ui';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import { WindowClosedMessage } from '../../components/common/WindowClosedMessage';

interface Application {
  _id: string;
  groupId?: {
    _id: string;
    groupCode: string;
    groupNumber?: number;
    members: Array<{
      _id: string;
      name: string;
      email: string;
      studentId: string;
    }>;
    leaderId: {
      _id: string;
      name: string;
      email: string;
      studentId: string;
    };
  };
  studentId?: {
    _id: string;
    name: string;
    email: string;
    studentId: string;
    department: string;
  };
  projectId: {
    _id: string;
    title: string;
    brief: string;
    facultyName: string;
  };
  projectType: string;
  department: string;
  stream?: string;
  specialization?: string;
  cgpa?: number;
  semester: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
}

export function FacultyApplicationsPage() {
  const { user } = useAuth();
  const { isApplicationOpen, loading: windowLoading } = useWindowStatus();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [projectType, setProjectType] = useState<'IDP' | 'UROP' | 'CAPSTONE'>('IDP');

  useEffect(() => {
    fetchApplications();
  }, []);

  // Check if application window is open
  const canReviewApplications = isApplicationOpen(projectType);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/applications/faculty');
      if (response.success && response.data) {
        setApplications(response.data);
      } else {
        setApplications([]);
      }
    } catch (error) {
      toast.error('Failed to fetch applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (applicationId: string, projectId: string) => {
    if (!confirm('Are you sure you want to accept this application?')) {
      return;
    }

    try {
      const response = await api.post(`/applications/${applicationId}/accept`, { projectId });

      if (response.success) {
        toast.success('Application accepted successfully');
        fetchApplications();
        setSelectedApplication(null);
      } else {
        toast.error(response.error?.message || 'Failed to accept application');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept application');
    }
  };

  const handleReject = async (applicationId: string) => {
    const reason = prompt('Enter rejection reason (optional):');

    if (!confirm('Are you sure you want to reject this application?')) {
      return;
    }

    try {
      const response = await api.post(`/applications/${applicationId}/reject`, {
        reason: reason || undefined
      });

      if (response.success) {
        toast.success('Application rejected');
        fetchApplications();
        setSelectedApplication(null);
      } else {
        toast.error(response.error?.message || 'Failed to reject application');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject application');
    }
  };



  const filteredApplications = applications.filter(app =>
    filterStatus === 'all' ? true : app.status === filterStatus
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      approved: 'bg-green-500/20 text-green-300 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Show window closed message if application window is not open
  if (!windowLoading && !canReviewApplications) {
    return <WindowClosedMessage windowType="application" projectType={projectType} />;
  }

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text">Applications</h1>
          <p className="text-textSecondary mt-1">
            Review and manage student applications for your projects
          </p>
        </div>

        {/* Filters */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-textSecondary" />
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-textSecondary hover:bg-white/10'
                    }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-2 text-xs opacity-70">
                    ({applications.filter(a => status === 'all' ? true : a.status === status).length})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text mb-2">No Applications</h3>
              <p className="text-textSecondary">
                {filterStatus === 'all'
                  ? 'No applications received yet'
                  : `No ${filterStatus} applications`}
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid gap-4">
            {filteredApplications.map((application) => (
              <motion.div
                key={application._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-6 hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {application.groupId ? (
                          <Users className="w-5 h-5 text-primary" />
                        ) : (
                          <User className="w-5 h-5 text-secondary" />
                        )}
                        <h3 className="text-lg font-semibold text-text">
                          {application.groupId
                            ? `${application.groupId.leaderId?.name || 'Group Leader'}${application.groupId.groupNumber ? ` - Group #${application.groupId.groupNumber}` : ` (${application.groupId.groupCode})`}`
                            : application.studentId?.name}
                        </h3>
                        {application.groupId && (
                          <span className="text-xs text-textSecondary">
                            (Group Leader)
                          </span>
                        )}
                        {getStatusBadge(application.status)}
                        <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs font-medium rounded-lg border border-secondary/30">
                          {application.projectType}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div>
                          <span className="text-sm font-medium text-text">Project: </span>
                          <span className="text-sm text-textSecondary">
                            {application.projectId.title}
                          </span>
                        </div>
                        {application.groupId && (
                          <div>
                            <span className="text-sm font-medium text-text">Members: </span>
                            <span className="text-sm text-textSecondary">
                              {application.groupId.members.length} students
                            </span>
                          </div>
                        )}
                        <div className="flex gap-4 text-sm text-textSecondary">
                          {application.cgpa && <span>CGPA: {application.cgpa.toFixed(2)}</span>}
                          {application.cgpa && application.specialization && <span>•</span>}
                          {application.specialization && <span>{application.specialization}</span>}
                          {application.specialization && <span>•</span>}
                          <span>{application.department}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-textSecondary">
                        <span>Applied: {new Date(application.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-text" />
                      </button>

                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAccept(application._id, application.projectId._id)}
                            className="p-2 hover:bg-success/20 rounded-lg transition-all"
                            title="Accept application"
                          >
                            <CheckCircle className="w-4 h-4 text-success" />
                          </button>
                          <button
                            onClick={() => handleReject(application._id)}
                            className="p-2 hover:bg-error/20 rounded-lg transition-all"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4 text-error" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedApplication(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="text-gray-900 capitalize">{selectedApplication.groupId ? 'Group' : 'Solo'}</p>
                  </div>

                  {selectedApplication.groupId && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Group Members {selectedApplication.groupId.groupNumber ? `(Group #${selectedApplication.groupId.groupNumber})` : `(${selectedApplication.groupId.groupCode})`}
                      </label>
                      <div className="mt-2 space-y-2">
                        {selectedApplication.groupId.members.map((member) => (
                          <div key={member._id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <User className="w-4 h-4 text-gray-500" />
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 font-medium">{member.name}</p>
                              <p className="text-xs text-gray-600">{member.email}</p>
                              <p className="text-xs text-gray-500">ID: {member.studentId}</p>
                            </div>
                            {member._id === selectedApplication.groupId.leaderId._id && (
                              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                                Leader
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!selectedApplication.groupId && selectedApplication.studentId && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Student</label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-900 font-medium">{selectedApplication.studentId.name}</p>
                        <p className="text-sm text-gray-600">{selectedApplication.studentId.email}</p>
                        <p className="text-sm text-gray-500">ID: {selectedApplication.studentId.studentId}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Project</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 font-medium">{selectedApplication.projectId.title}</p>
                      {selectedApplication.projectId.brief && (
                        <p className="text-xs text-gray-600 mt-1">{selectedApplication.projectId.brief}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {selectedApplication.cgpa && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">CGPA</label>
                        <p className="text-gray-900">{selectedApplication.cgpa.toFixed(2)}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600">Department</label>
                      <p className="text-gray-900">{selectedApplication.department}</p>
                    </div>
                  </div>

                  {selectedApplication.specialization && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Specialization</label>
                      <p className="text-gray-900">{selectedApplication.specialization}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-700 font-medium transition-all"
                  >
                    Close
                  </button>
                  {selectedApplication.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReject(selectedApplication._id)}
                        className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-300 rounded-lg text-red-700 font-medium transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          handleAccept(selectedApplication._id, selectedApplication.projectId._id);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all"
                      >
                        Accept
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
