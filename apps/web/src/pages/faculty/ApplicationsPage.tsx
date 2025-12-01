import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, CheckCircle, XCircle, Eye, Filter, Edit2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard, GlowButton } from '../../components/ui';
import toast from 'react-hot-toast';

interface Application {
  _id: string;
  groupId?: {
    _id: string;
    groupCode: string;
    members: any[];
    leaderId: any;
  };
  studentId?: {
    _id: string;
    name: string;
    email: string;
    idNumber: string;
  };
  projectId: {
    _id: string;
    projectId: string;
    title: string;
    projectType: string;
  };
  projectPreferences: string[];
  department: string;
  stream: string;
  specialization: string;
  cgpa: number;
  status: 'pending' | 'accepted' | 'rejected';
  applicationType: 'solo' | 'group';
  createdAt: string;
}

export function FacultyApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/v1/applications/faculty/${user?._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        }
      });
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (applicationId: string, status: 'accepted' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${status === 'accepted' ? 'accept' : 'reject'} this application?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/v1/applications/${applicationId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`Application ${status === 'accepted' ? 'accepted' : 'rejected'} successfully`);
        fetchApplications();
        setSelectedApplication(null);
      } else {
        const error = await response.json();
        toast.error(error.error?.message || 'Failed to review application');
      }
    } catch (error) {
      toast.error('Failed to review application');
    }
  };

  const handleUpdateProjectTitle = async () => {
    if (!selectedApplication || !newTitle.trim()) {
      toast.error('Please enter a new title');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/v1/projects/${selectedApplication.projectId._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('srm_portal_token')}`
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (response.ok) {
        toast.success('Project title updated successfully');
        setShowEditModal(false);
        setNewTitle('');
        fetchApplications();
      } else {
        toast.error('Failed to update project title');
      }
    } catch (error) {
      toast.error('Failed to update project title');
    }
  };

  const filteredApplications = applications.filter(app => 
    filterStatus === 'all' ? true : app.status === filterStatus
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      accepted: 'bg-green-500/20 text-green-300 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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
              {(['all', 'pending', 'accepted', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === status
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
                        {application.applicationType === 'group' ? (
                          <Users className="w-5 h-5 text-primary" />
                        ) : (
                          <User className="w-5 h-5 text-secondary" />
                        )}
                        <h3 className="text-lg font-semibold text-text">
                          {application.applicationType === 'group' 
                            ? `Group ${application.groupId?.groupCode}` 
                            : application.studentId?.name}
                        </h3>
                        {getStatusBadge(application.status)}
                        <span className="px-2 py-1 bg-secondary/20 text-secondary text-xs font-medium rounded-lg border border-secondary/30">
                          {application.projectId.projectType}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div>
                          <span className="text-sm font-medium text-text">Project: </span>
                          <span className="text-sm text-textSecondary">{application.projectId.title}</span>
                        </div>
                        {application.applicationType === 'group' && application.groupId && (
                          <div>
                            <span className="text-sm font-medium text-text">Members: </span>
                            <span className="text-sm text-textSecondary">
                              {application.groupId.members.length} students
                            </span>
                          </div>
                        )}
                        <div className="flex gap-4 text-sm text-textSecondary">
                          <span>CGPA: {application.cgpa}</span>
                          <span>•</span>
                          <span>{application.specialization}</span>
                          <span>•</span>
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
                      {application.status === 'accepted' && (
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setNewTitle(application.projectId.title);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                          title="Edit project title"
                        >
                          <Edit2 className="w-4 h-4 text-text" />
                        </button>
                      )}
                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReview(application._id, 'accepted')}
                            className="p-2 hover:bg-success/20 rounded-lg transition-all"
                            title="Accept"
                          >
                            <CheckCircle className="w-4 h-4 text-success" />
                          </button>
                          <button
                            onClick={() => handleReview(application._id, 'rejected')}
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
        {selectedApplication && !showEditModal && (
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
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold text-text mb-6">Application Details</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-textSecondary">Type</label>
                    <p className="text-text capitalize">{selectedApplication.applicationType}</p>
                  </div>

                  {selectedApplication.applicationType === 'group' && selectedApplication.groupId && (
                    <div>
                      <label className="text-sm font-medium text-textSecondary">Group Members</label>
                      <div className="mt-2 space-y-2">
                        {selectedApplication.groupId.members.map((member: any) => (
                          <div key={member._id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                            <User className="w-4 h-4 text-textSecondary" />
                            <div>
                              <p className="text-sm text-text">{member.name}</p>
                              <p className="text-xs text-textSecondary">{member.email}</p>
                            </div>
                            {member._id === selectedApplication.groupId.leaderId && (
                              <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded">Leader</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApplication.applicationType === 'solo' && selectedApplication.studentId && (
                    <div>
                      <label className="text-sm font-medium text-textSecondary">Student</label>
                      <div className="mt-2 p-3 bg-white/5 rounded-lg">
                        <p className="text-text font-medium">{selectedApplication.studentId.name}</p>
                        <p className="text-sm text-textSecondary">{selectedApplication.studentId.email}</p>
                        <p className="text-sm text-textSecondary">ID: {selectedApplication.studentId.idNumber}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Project</label>
                    <p className="text-text">{selectedApplication.projectId.title}</p>
                    <p className="text-xs text-textSecondary">ID: {selectedApplication.projectId.projectId}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-textSecondary">CGPA</label>
                      <p className="text-text">{selectedApplication.cgpa}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-textSecondary">Department</label>
                      <p className="text-text">{selectedApplication.department}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Specialization</label>
                    <p className="text-text">{selectedApplication.specialization}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-textSecondary">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text transition-all"
                  >
                    Close
                  </button>
                  {selectedApplication.status === 'pending' && (
                    <>
                      <GlowButton
                        onClick={() => {
                          handleReview(selectedApplication._id, 'rejected');
                        }}
                        variant="secondary"
                        className="flex-1"
                      >
                        Reject
                      </GlowButton>
                      <GlowButton
                        onClick={() => {
                          handleReview(selectedApplication._id, 'accepted');
                        }}
                        variant="primary"
                        glow
                        className="flex-1"
                      >
                        Accept
                      </GlowButton>
                    </>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Title Modal */}
      <AnimatePresence>
        {showEditModal && selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowEditModal(false);
              setNewTitle('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold text-text mb-6">Edit Project Title</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Current Title
                    </label>
                    <p className="text-textSecondary text-sm">{selectedApplication.projectId.title}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      New Title
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter new project title"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setNewTitle('');
                    }}
                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text transition-all"
                  >
                    Cancel
                  </button>
                  <GlowButton
                    onClick={handleUpdateProjectTitle}
                    variant="primary"
                    glow
                    className="flex-1"
                  >
                    Update Title
                  </GlowButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
