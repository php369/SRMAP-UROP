import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '../../components/dashboard/DashboardCard';
import { GlassCard } from '../../components/ui/GlassCard';
import {
    HomeIcon,
    UsersIcon,
    UploadIcon,
    FileTextIcon,
    CalendarIcon
} from '../../components/ui/Icons';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

interface StudentDashboardProps {
    user: any;
    dashboardData: any;
    refreshData: () => void;
}

export function StudentDashboard({ user, dashboardData, refreshData }: StudentDashboardProps) {
    const navigate = useNavigate();
    const group = dashboardData?.group;

    const getLeaderId = (leaderId: any) => {
        if (!leaderId) return null;
        if (typeof leaderId === 'object' && leaderId._id) return leaderId._id;
        return leaderId;
    };

    const isGroupLeader = group && user && (
        getLeaderId(group.leaderId) === user.id ||
        String(getLeaderId(group.leaderId)) === String(user.id)
    );

    const handleRemoveMember = async (memberId: string) => {
        if (!window.confirm('Are you sure you want to remove this member from the group?')) {
            return;
        }

        try {
            const response = await api.post(`/groups/${group?._id}/remove-member`, {
                memberId
            });

            if (response.success) {
                toast.success('Member removed successfully');
                refreshData();
            } else {
                toast.error('Failed to remove member');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Failed to remove member');
        }
    };

    const groupStatusColors = {
        forming: 'bg-yellow-500/10 text-yellow-500',
        complete: 'bg-purple-500/10 text-purple-500',
        applied: 'bg-blue-500/10 text-blue-500',
        approved: 'bg-green-500/10 text-green-500',
        frozen: 'bg-gray-500/10 text-gray-500',
    } as const;

    const appStatusColors = {
        pending: 'bg-yellow-500/10 text-yellow-500',
        approved: 'bg-green-500/10 text-green-500',
        rejected: 'bg-red-500/10 text-red-500',
    } as const;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Quick Navigation - Grid Layout */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <DashboardCard
                        title="Dashboard"
                        icon={<HomeIcon size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Overview</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Application"
                        icon={<UsersIcon size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/application')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Manage Applications</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Submission"
                        icon={<UploadIcon size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/submission')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Project Submissions</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Assessment"
                        icon={<FileTextIcon size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/assessment')}
                    >
                        <p className="text-xs text-textSecondary mt-1">View Assessments</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Meetings"
                        icon={<CalendarIcon size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/meetings')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Schedule Meetings</p>
                    </DashboardCard>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Group Info or Solo Info */}
                {group ? (
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-text">Group Information</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${groupStatusColors[group.status as keyof typeof groupStatusColors] || groupStatusColors.forming}`}>
                                {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                            </span>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-surface/30 border border-border/50">
                                    <p className="text-sm text-textSecondary">Group Code</p>
                                    <p className="text-2xl font-bold text-primary font-mono mt-1">{group.groupCode}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-surface/30 border border-border/50">
                                    <p className="text-sm text-textSecondary">Your Role</p>
                                    <p className="text-lg font-semibold text-text mt-1">
                                        {isGroupLeader ? '👑 Group Leader' : '👤 Member'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-textSecondary mb-3">Members ({group.members.length} / 4)</p>
                                <div className="space-y-3">
                                    {group.members.map((member: any) => (
                                        <div key={member._id} className="flex items-center justify-between p-3 rounded-lg bg-surface/40 border border-border/30 hover:bg-surface/60 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                                                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-text flex items-center gap-1">
                                                        {member.name || 'Unknown'}
                                                        {member._id === getLeaderId(group.leaderId) && '👑'}
                                                    </p>
                                                    <p className="text-xs text-textSecondary">{member.email || member.studentId}</p>
                                                </div>
                                            </div>
                                            {isGroupLeader && member._id !== getLeaderId(group.leaderId) && (
                                                <button
                                                    onClick={() => handleRemoveMember(member._id)}
                                                    className="text-red-400 hover:text-red-500 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                                                    title="Remove member"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                ) : (
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-text">Student Information</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${dashboardData?.user?.assignedProject ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {dashboardData?.user?.assignedProject ? 'Project Assigned' : 'Solo Student'}
                            </span>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-surface/30 border border-border/50">
                                <p className="text-sm text-textSecondary">Student ID</p>
                                <p className="text-xl font-semibold text-text mt-1">{dashboardData?.user?.studentId || 'Not set'}</p>
                            </div>

                            {dashboardData?.user?.assignedProject && (
                                <div className="p-4 rounded-xl bg-surface/30 border border-border/50">
                                    <p className="text-sm text-textSecondary mb-2">Assigned Project</p>
                                    <p className="text-lg font-semibold text-text">{dashboardData.user.assignedProject.title}</p>
                                    <p className="text-sm text-textSecondary mt-1">{dashboardData.user.assignedProject.brief}</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                )}

                {/* Application Status */}
                <div className="space-y-6">
                    <GlassCard className="p-6 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-text">Recent Applications</h3>
                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-surface/50 text-textSecondary">
                                Total: {dashboardData?.applications?.length || 0}
                            </span>
                        </div>

                        {dashboardData?.applications?.length > 0 ? (
                            <div className="space-y-4">
                                {dashboardData.applications.map((application: any) => (
                                    <div key={application._id} className="p-4 rounded-xl bg-surface/40 border border-border/30 hover:bg-surface/60 transition-all cursor-default">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-text line-clamp-1">{application.projectId?.title}</h4>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${appStatusColors[application.status as keyof typeof appStatusColors] || appStatusColors.pending}`}>
                                                {application.status}
                                            </span>
                                        </div>
                                        {application.projectId?.facultyName && (
                                            <p className="text-xs text-textSecondary">Faculty: {application.projectId.facultyName}</p>
                                        )}
                                        <p className="text-xs text-textSecondary mt-2">Applied on {new Date(application.createdAt || Date.now()).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-textSecondary">
                                <p>No applications yet.</p>
                                <button onClick={() => navigate('/dashboard/application')} className="text-primary hover:underline text-sm mt-2">Browse Projects</button>
                            </div>
                        )}

                        {dashboardData?.studentStatus && (
                            <div className="mt-6 pt-6 border-t border-border/20 grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-primary">{dashboardData.studentStatus.approvedApplications}</p>
                                    <p className="text-xs text-textSecondary uppercase tracking-wider">Approved</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-text">{dashboardData.studentStatus.applicationsCount}</p>
                                    <p className="text-xs text-textSecondary uppercase tracking-wider">Applied</p>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
