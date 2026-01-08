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
    const { user } = useAuth();
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
                setApplications(response.data);
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
                <Loader className="w-8 h-8 animate-spin text-blue-500" />
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
                    <h1 className="text-3xl font-bold mb-2">Application Review</h1>
                    <p className="text-gray-600">Review and manage student applications for your projects</p>
                </motion.div>

                {/* Pending Applications */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">
                        Pending Applications ({pendingApplications.length})
                    </h2>

                    {pendingApplications.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">📭</div>
                            <h3 className="text-xl font-semibold mb-2">No Pending Applications</h3>
                            <p className="text-gray-600">
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
                                    className="bg-white rounded-xl shadow-lg overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center mb-2">
                                                    {application.groupId ? (
                                                        <Users className="w-5 h-5 text-blue-500 mr-2" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-green-500 mr-2" />
                                                    )}
                                                    <span className="font-medium text-gray-600">
                                                        {application.groupId ? 'Group Application' : 'Solo Application'}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold mb-1">
                                                    {application.projectId.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {application.projectId.brief}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>Department: {application.department}</span>
                                                    {application.specialization && (
                                                        <span>Specialization: {application.specialization}</span>
                                                    )}
                                                    <span>Submitted: {new Date(application.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleExpand(application._id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                                                className="mt-4 pt-4 border-t border-gray-200"
                                            >
                                                {application.groupId ? (
                                                    <div>
                                                        <h4 className="font-bold mb-2">Group Details</h4>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            Group Code: <span className="font-mono font-bold">{application.groupId.groupCode}</span>
                                                        </p>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            Group Leader: {application.groupId.leaderId.name} ({application.groupId.leaderId.studentId})
                                                        </p>
                                                        <div className="mb-3">
                                                            <p className="text-sm font-medium mb-1">Members:</p>
                                                            <ul className="list-disc list-inside text-sm text-gray-600">
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
                                                        <h4 className="font-bold mb-2">Student Details</h4>
                                                        <p className="text-sm text-gray-600">
                                                            Name: {application.studentId?.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Student ID: {application.studentId?.studentId}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Email: {application.studentId?.email}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Department: {application.studentId?.department}
                                                        </p>
                                                    </div>
                                                )}

                                                {application.cgpa && (
                                                    <p className="text-sm text-gray-600 mt-2">
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
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                    className="bg-white rounded-xl shadow-lg p-6"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {application.groupId ? (
                                                    <Users className="w-5 h-5 text-blue-500" />
                                                ) : (
                                                    <User className="w-5 h-5 text-green-500" />
                                                )}
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${application.status === 'approved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-bold">{application.projectId.title}</h3>
                                                {application.status === 'approved' && (
                                                    <button
                                                        onClick={() => startEditingTitle(application.projectId._id, application.projectId.title)}
                                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        title="Edit project title"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                )}
                                            </div>

                                            {editingProject === application.projectId._id && (
                                                <div className="mt-2 flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newProjectTitle}
                                                        onChange={(e) => setNewProjectTitle(e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="New project title"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateProjectTitle(application.projectId._id)}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingProject(null);
                                                            setNewProjectTitle('');
                                                        }}
                                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}

                                            <p className="text-sm text-gray-600 mb-2">
                                                {application.groupId
                                                    ? `Group: ${application.groupId.groupCode} (${application.groupId.members.length} members)`
                                                    : `Student: ${application.studentId?.name}`
                                                }
                                            </p>
                                            <p className="text-xs text-gray-500">
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
