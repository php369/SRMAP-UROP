import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '../../components/dashboard/DashboardCard';
import TiltedCard from '../../components/ui/TiltedCard';
// GlassCard removed
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
            {/* Quick Navigation - Grid Layout */}
            <div className="border-b border-slate-100 pb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div style={{ height: '140px' }}>
                        <TiltedCard
                            imageSrc=""
                            altText="Dashboard"
                            containerHeight="100%"
                            containerWidth="100%"
                            imageHeight="100%"
                            imageWidth="100%"
                            rotateAmplitude={12}
                            scaleOnHover={1.0}
                            showMobileWarning={false}
                            showTooltip={false}
                            displayOverlayContent={false}
                        >
                            <DashboardCard
                                title="Dashboard"
                                icon={<HomeIcon size={20} />}
                                className="h-full transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none hover:bg-white"
                                onClick={() => navigate('/dashboard')}
                            />
                        </TiltedCard>
                    </div>

                    <div style={{ height: '140px' }}>
                        <TiltedCard
                            imageSrc=""
                            altText="Application"
                            containerHeight="100%"
                            containerWidth="100%"
                            imageHeight="100%"
                            imageWidth="100%"
                            rotateAmplitude={12}
                            scaleOnHover={1.0}
                            showMobileWarning={false}
                            showTooltip={false}
                            displayOverlayContent={false}
                        >
                            <DashboardCard
                                title="Application"
                                icon={<UsersIcon size={20} />}
                                className="h-full transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none hover:bg-white"
                                onClick={() => navigate('/dashboard/application')}
                            />
                        </TiltedCard>
                    </div>

                    <div style={{ height: '140px' }}>
                        <TiltedCard
                            imageSrc=""
                            altText="Submission"
                            containerHeight="100%"
                            containerWidth="100%"
                            imageHeight="100%"
                            imageWidth="100%"
                            rotateAmplitude={12}
                            scaleOnHover={1.0}
                            showMobileWarning={false}
                            showTooltip={false}
                            displayOverlayContent={false}
                        >
                            <DashboardCard
                                title="Submission"
                                icon={<UploadIcon size={20} />}
                                className="h-full transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none hover:bg-white"
                                onClick={() => navigate('/dashboard/submission')}
                            />
                        </TiltedCard>
                    </div>

                    <div style={{ height: '140px' }}>
                        <TiltedCard
                            imageSrc=""
                            altText="Assessment"
                            containerHeight="100%"
                            containerWidth="100%"
                            imageHeight="100%"
                            imageWidth="100%"
                            rotateAmplitude={12}
                            scaleOnHover={1.0}
                            showMobileWarning={false}
                            showTooltip={false}
                            displayOverlayContent={false}
                        >
                            <DashboardCard
                                title="Assessment"
                                icon={<FileTextIcon size={20} />}
                                className="h-full transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none hover:bg-white"
                                onClick={() => navigate('/dashboard/assessment')}
                            />
                        </TiltedCard>
                    </div>

                    <div style={{ height: '140px' }}>
                        <TiltedCard
                            imageSrc=""
                            altText="Meetings"
                            containerHeight="100%"
                            containerWidth="100%"
                            imageHeight="100%"
                            imageWidth="100%"
                            rotateAmplitude={12}
                            scaleOnHover={1.0}
                            showMobileWarning={false}
                            showTooltip={false}
                            displayOverlayContent={false}
                        >
                            <DashboardCard
                                title="Meetings"
                                icon={<CalendarIcon size={20} />}
                                className="h-full transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none hover:bg-white"
                                onClick={() => navigate('/dashboard/meetings')}
                            />
                        </TiltedCard>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Group Info or Solo Info */}
                {/* Group Info or Solo Info */}
                {group ? (
                    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Group Information</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${groupStatusColors[group.status as keyof typeof groupStatusColors] || groupStatusColors.forming}`}>
                                {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                            </span>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-sm text-slate-500">Group Code</p>
                                    <p className="text-2xl font-bold text-primary font-mono mt-1">{group.groupCode}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-sm text-slate-500">Your Role</p>
                                    <p className="text-lg font-semibold text-slate-900 mt-1">
                                        {isGroupLeader ? '👑 Group Leader' : '👤 Member'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-3">Members ({group.members.length} / 4)</p>
                                <div className="space-y-3">
                                    {group.members.map((member: any) => (
                                        <div key={member._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                                                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                                                        {member.name || 'Unknown'}
                                                        {member._id === getLeaderId(group.leaderId) && '👑'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{member.email || member.studentId}</p>
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
                    </div>
                ) : (
                    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Student Information</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${dashboardData?.user?.assignedProject ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {dashboardData?.user?.assignedProject ? 'Project Assigned' : 'Solo Student'}
                            </span>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-sm text-slate-500">Student ID</p>
                                <p className="text-xl font-semibold text-slate-900 mt-1">{dashboardData?.user?.studentId || 'Not set'}</p>
                            </div>

                            {dashboardData?.user?.assignedProject && (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-sm text-slate-500 mb-2">Assigned Project</p>
                                    <p className="text-lg font-semibold text-slate-900">{dashboardData.user.assignedProject.title}</p>
                                    <p className="text-sm text-slate-500 mt-1">{dashboardData.user.assignedProject.brief}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Application Status */}
                <div className="space-y-6">
                    {/* Application Status */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-slate-900">Recent Applications</h3>
                                <span className="text-xs font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-500">
                                    Total: {dashboardData?.applications?.length || 0}
                                </span>
                            </div>

                            {dashboardData?.applications?.length > 0 ? (
                                <div className="space-y-4">
                                    {dashboardData.applications.map((application: any) => (
                                        <div key={application._id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-slate-900 line-clamp-1">{application.projectId?.title}</h4>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${appStatusColors[application.status as keyof typeof appStatusColors] || appStatusColors.pending}`}>
                                                    {application.status}
                                                </span>
                                            </div>
                                            {application.projectId?.facultyName && (
                                                <p className="text-xs text-slate-500">Faculty: {application.projectId.facultyName}</p>
                                            )}
                                            <p className="text-xs text-slate-400 mt-2">Applied on {new Date(application.createdAt || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400">
                                    <p>No applications yet.</p>
                                    <button onClick={() => navigate('/dashboard/application')} className="text-primary hover:underline text-sm mt-2">Browse Projects</button>
                                </div>
                            )}

                            {dashboardData?.studentStatus && (
                                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-primary">{dashboardData.studentStatus.approvedApplications}</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Approved</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{dashboardData.studentStatus.applicationsCount}</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider">Applied</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
