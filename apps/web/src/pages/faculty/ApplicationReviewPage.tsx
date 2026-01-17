import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Edit2, Search } from 'lucide-react';
import { api } from '../../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ApplicationEmptyState } from './components/ApplicationEmptyState';
import { useWindowStatus } from '../../hooks/useWindowStatus';

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
    const { isApplicationOpen } = useWindowStatus();
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
            const response = await api.get<Application[]>('/applications/faculty');
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
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading applications...</p>
                </div>
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <div className="flex-1 flex flex-col w-full h-full items-center justify-center p-6">
                <ApplicationEmptyState
                    title="Application Review"
                    subtitle="Student Applications"
                    description="No applications received yet."
                    subDescription="When students apply to your projects, they will appear here for your review."
                    theme="teal"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col"
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-900 to-teal-600 dark:from-teal-100 dark:to-teal-300">
                        Application Review
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Review and manage student applications for your projects
                    </p>
                </div>

                {/* Pending Applications */}
                <div className="mb-10 space-y-6">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200 text-sm px-3 py-1">
                            Pending ({pendingApplications.length})
                        </Badge>
                    </div>

                    {pendingApplications.length === 0 ? (
                        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                            <p className="text-slate-500 text-sm">No pending applications to review</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {pendingApplications.map((application) => (
                                <Card key={application._id} className="overflow-hidden border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
                                    <div className="p-6">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    {application.groupId ? (
                                                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                            <Users className="w-5 h-5" />
                                                        </div>
                                                    ) : (
                                                        <div className="p-2 rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400">
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                                                            {application.projectId.title}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {application.groupId ? 'Group Application' : 'Individual Application'} • {application.department}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pl-14">
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                                        {application.projectId.brief}
                                                    </p>
                                                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-4">
                                                        <span>Submitted: {new Date(application.createdAt).toLocaleDateString()}</span>
                                                        {application.specialization && <span>• Spec: {application.specialization}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 min-w-[140px] justify-center">
                                                <Button
                                                    onClick={() => handleAcceptApplication(application._id, application.projectId._id)}
                                                    disabled={processingApp === application._id}
                                                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                                                    size="sm"
                                                >
                                                    {processingApp === application._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
                                                </Button>
                                                <Button
                                                    onClick={() => handleRejectApplication(application._id)}
                                                    disabled={processingApp === application._id}
                                                    variant="outline"
                                                    className="w-full text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                                                    size="sm"
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleExpand(application._id)}
                                                    className="w-full text-slate-400 hover:text-teal-600"
                                                >
                                                    {expandedApp === application._id ? (
                                                        <span className="flex items-center gap-1">Hide Details <ChevronUp className="w-3 h-3" /></span>
                                                    ) : (
                                                        <span className="flex items-center gap-1">View Details <ChevronDown className="w-3 h-3" /></span>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedApp === application._id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 ml-14">
                                                        <div className="grid md:grid-cols-2 gap-8 text-sm">
                                                            {application.groupId ? (
                                                                <div className="space-y-3">
                                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">Group Information</p>
                                                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                                                        <span className="text-slate-500">Code:</span>
                                                                        <span className="font-mono text-slate-700 dark:text-slate-300">{application.groupId.groupCode}</span>
                                                                        <span className="text-slate-500">Leader:</span>
                                                                        <span className="text-slate-700 dark:text-slate-300">{application.groupId.leaderId.name}</span>
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <p className="text-xs font-medium text-slate-500 mb-2">MEMBERS</p>
                                                                        <ul className="space-y-1">
                                                                            {application.groupId.members.map(m => (
                                                                                <li key={m._id} className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                                                    • {m.name}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">Student Information</p>
                                                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                                                        <span className="text-slate-500">Name:</span>
                                                                        <span className="text-slate-700 dark:text-slate-300">{application.studentId?.name}</span>
                                                                        <span className="text-slate-500">Email:</span>
                                                                        <span className="text-slate-700 dark:text-slate-300">{application.studentId?.email}</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="space-y-3">
                                                                <p className="font-semibold text-slate-900 dark:text-slate-100">Academic Details</p>
                                                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                                                    <span className="text-slate-500">CGPA:</span>
                                                                    <span className="text-slate-700 dark:text-slate-300 font-mono">{application.cgpa?.toFixed(2) || 'N/A'}</span>
                                                                    <span className="text-slate-500">Semester:</span>
                                                                    <span className="text-slate-700 dark:text-slate-300">{application.semester}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reviewed Applications */}
                {reviewedApplications.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-slate-600 border-slate-200">
                                History ({reviewedApplications.length})
                            </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {reviewedApplications.map((application) => (
                                <Card key={application._id} className="opacity-75 hover:opacity-100 transition-opacity">
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                {application.status === 'approved' ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Accepted</Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Rejected</Badge>
                                                )}
                                                <span className="text-xs text-slate-400">
                                                    {application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString() : ''}
                                                </span>
                                            </div>
                                            {application.status === 'approved' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-slate-400 hover:text-teal-600"
                                                    onClick={() => startEditingTitle(application.projectId._id, application.projectId.title)}
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {editingProject === application.projectId._id ? (
                                                <div className="flex gap-2 items-center">
                                                    <Input
                                                        value={newProjectTitle}
                                                        onChange={(e) => setNewProjectTitle(e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                    <Button size="sm" onClick={() => handleUpdateProjectTitle(application.projectId._id)} className="h-8 bg-teal-600 text-white">Save</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingProject(null)} className="h-8">Cancel</Button>
                                                </div>
                                            ) : (
                                                <h4 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                                                    {application.projectId.title}
                                                </h4>
                                            )}

                                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                {application.groupId ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                {application.groupId ? application.groupId.members.length + ' Students' : application.studentId?.name}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
