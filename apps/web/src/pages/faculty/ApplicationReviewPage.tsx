import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface Application {
    _id: string;
    studentId?: {
        _id: string;
        name: string;
        email: string;
        studentId: string;
        department: string;
    };
    groupId?: {
        _id: string;
        groupCode: string;
        leaderId: {
            _id: string;
            name: string;
            email: string;
            studentId: string;
        };
        members: Array<{
            _id: string;
            name: string;
            email: string;
            studentId: string;
        }>;
    };
    projectId: {
        _id: string;
        title: string;
        brief: string;
        facultyName: string;
    };
    department: string;
    stream?: string;
    specialization?: string;
    cgpa?: number;
    semester: number;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    reviewedAt?: string;
}

export function ApplicationReviewPage() {
    useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedApp, setExpandedApp] = useState<string | null>(null);
    const [processingApp, setProcessingApp] = useState<string | null>(null);
    const [editingProject, setEditingProject] = useState<string | null>(null);
    const [newProjectTitle, setNewProjectTitle] = useState('');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/applications/faculty');
            if (response.success && response.data) {
                setApplications(response.data as Application[]);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptApplication = async (applicationId: string, projectId: string) => {
        if (!confirm('Are you sure you want to accept this application? This will assign the project to this student/group and reject other applicants.')) {
            return;
        }

        setProcessingApp(applicationId);
        try {
            const response = await api.post(`/applications/${applicationId}/accept`, {
                projectId
            });

            if (response.success) {
                toast.success('Application accepted successfully!');
                await fetchApplications();
            } else {
                toast.error(response.error?.message || 'Failed to accept application');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to accept application');
        } finally {
            setProcessingApp(null);
        }
    };

    const handleRejectApplication = async (applicationId: string) => {
        const reason = prompt('Optional: Provide a reason for rejection');

        setProcessingApp(applicationId);
        try {
            const response = await api.post(`/applications/${applicationId}/reject`, {
                reason: reason || undefined
            });

            if (response.success) {
                toast.success('Application rejected');
                await fetchApplications();
            } else {
                toast.error(response.error?.message || 'Failed to reject application');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to reject application');
        } finally {
            setProcessingApp(null);
        }
    };

    const handleUpdateProjectTitle = async (projectId: string) => {
        if (!newProjectTitle.trim()) {
            toast.error('Please enter a new title');
            return;
        }

        try {
            const response = await api.put(`/projects/${projectId}`, {
                title: newProjectTitle
            });

            if (response.success) {
                toast.success('Project title updated successfully!');
                setEditingProject(null);
                setNewProjectTitle('');
                await fetchApplications();
            } else {
                toast.error(response.error?.message || 'Failed to update project title');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update project title');
        }
    };

    const toggleExpand = (appId: string) => {
        setExpandedApp(expandedApp === appId ? null : appId);
    };

    const startEditingTitle = (projectId: string, currentTitle: string) => {
        setEditingProject(projectId);
        setNewProjectTitle(currentTitle);
    };

    const pendingApplications = applications.filter(app => app.status === 'pending');
    const reviewedApplications = applications.filter(app => app.status !== 'pending');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-text mb-2">Application Review</h1>
                    <p className="text-textSecondary">Review and manage student applications for your projects</p>
                </motion.div>

                {/* Pending Applications */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">
                        Pending Applications ({pendingApplications.length})
                    </h2>

                    {pendingApplications.length === 0 ? (
                        <div className="bg-surface border border-border rounded-xl shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">📭</div>
                            <h3 className="text-xl font-semibold text-text mb-2">No Pending Applications</h3>
                            <p className="text-textSecondary">
                                You don't have any pending applications to review at this time.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingApplications.map((application) => (
                                <motion.div
                                    key={application._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-surface border border-border/60 rounded-xl shadow-lg overflow-hidden transition-all hover:bg-surface/80"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center mb-2">
                                                    {application.groupId ? (
                                                        <Users className="w-5 h-5 text-primary mr-2" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-secondary mr-2" />
                                                    )}
                                                    <span className="font-medium text-textSecondary">
                                                        {application.groupId ? 'Group Application' : 'Solo Application'}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold text-text mb-1">
                                                    {application.projectId.title}
                                                </h3>
                                                <p className="text-sm text-textSecondary mb-2">
                                                    {application.projectId.brief}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-textSecondary/80">
                                                    <span>Department: {application.department}</span>
                                                    {application.specialization && (
                                                        <span>Specialization: {application.specialization}</span>
                                                    )}
                                                    <span>Submitted: {new Date(application.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleExpand(application._id)}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text"
                                            >
                                                {expandedApp === application._id ? (
                                                    <ChevronUp className="w-5 h-5" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedApp === application._id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-4 pt-4 border-t border-border"
                                            >
                                                {application.groupId ? (
                                                    <div>
                                                        <h4 className="font-bold text-text mb-2">Group Details</h4>
                                                        <p className="text-sm text-textSecondary mb-2">
                                                            Group Code: <span className="font-mono font-bold text-text">{application.groupId.groupCode}</span>
                                                        </p>
                                                        <p className="text-sm text-textSecondary mb-2">
                                                            Group Leader: {application.groupId.leaderId.name} ({application.groupId.leaderId.studentId})
                                                        </p>
                                                        <div className="mb-3">
                                                            <p className="text-sm font-medium text-text mb-1">Members:</p>
                                                            <ul className="list-disc list-inside text-sm text-textSecondary">
                                                                {application.groupId.members.map((member) => (
                                                                    <li key={member._id}>
                                                                        {member.name} ({member.studentId}) - {member.email}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <h4 className="font-bold text-text mb-2">Student Details</h4>
                                                        <p className="text-sm text-textSecondary">
                                                            Name: {application.studentId?.name}
                                                        </p>
                                                        <p className="text-sm text-textSecondary">
                                                            Student ID: {application.studentId?.studentId}
                                                        </p>
                                                        <p className="text-sm text-textSecondary">
                                                            Email: {application.studentId?.email}
                                                        </p>
                                                        <p className="text-sm text-textSecondary">
                                                            Department: {application.studentId?.department}
                                                        </p>
                                                    </div>
                                                )}

                                                {application.cgpa && (
                                                    <p className="text-sm text-textSecondary mt-2">
                                                        CGPA: {application.cgpa.toFixed(2)}
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => handleAcceptApplication(application._id, application.projectId._id)}
                                                disabled={processingApp === application._id}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {processingApp === application._id ? (
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Accept
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleRejectApplication(application._id)}
                                                disabled={processingApp === application._id}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {processingApp === application._id ? (
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4" />
                                                        Reject
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reviewed Applications */}
                {reviewedApplications.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">
                            Reviewed Applications ({reviewedApplications.length})
                        </h2>
                        <div className="space-y-4">
                            {reviewedApplications.map((application) => (
                                <motion.div
                                    key={application._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-surface border border-border/60 rounded-xl shadow-lg p-6"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {application.groupId ? (
                                                    <Users className="w-5 h-5 text-primary" />
                                                ) : (
                                                    <User className="w-5 h-5 text-secondary" />
                                                )}
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${application.status === 'approved'
                                                    ? 'bg-success/20 text-success'
                                                    : 'bg-error/20 text-error'
                                                    }`}>
                                                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold text-text">{application.projectId.title}</h3>
                                                {application.status === 'approved' && (
                                                    <button
                                                        onClick={() => startEditingTitle(application.projectId._id, application.projectId.title)}
                                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                                        title="Edit project title"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-textSecondary" />
                                                    </button>
                                                )}
                                            </div>

                                            {editingProject === application.projectId._id && (
                                                <div className="mt-2 flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newProjectTitle}
                                                        onChange={(e) => setNewProjectTitle(e.target.value)}
                                                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-text focus:ring-2 focus:ring-primary focus:border-primary"
                                                        placeholder="New project title"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateProjectTitle(application.projectId._id)}
                                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingProject(null);
                                                            setNewProjectTitle('');
                                                        }}
                                                        className="px-4 py-2 bg-secondary/10 text-textSecondary rounded-lg hover:bg-secondary/20"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}

                                            <p className="text-sm text-textSecondary mb-2">
                                                {application.groupId
                                                    ? `Group: ${application.groupId.groupCode} (${application.groupId.members.length} members)`
                                                    : `Student: ${application.studentId?.name}`
                                                }
                                            </p>
                                            <p className="text-xs text-textSecondary/70">
                                                Reviewed: {application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
