import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '../../components/dashboard/DashboardCard';
import { GlassCard } from '../../components/ui/GlassCard';
import {
    HomeIcon,
    FolderOpenIcon,
    UsersIcon,
    AwardIcon,
    CalendarIcon
} from '../../components/ui/Icons';

export function FacultyDashboard() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        title="My Projects"
                        icon={<FolderOpenIcon size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/projects')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Manage Projects</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Applications"
                        icon={<UsersIcon size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/faculty/applications')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Review Applications</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Assessment"
                        icon={<AwardIcon size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/faculty/assessment')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Evaluate Students</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Meetings"
                        icon={<CalendarIcon size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/faculty/meetings')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Schedule Meetings</p>
                    </DashboardCard>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-text mb-4">Pending Reviews</h3>
                    <div className="text-center py-8 text-textSecondary">
                        <p>No pending reviews</p>
                    </div>
                </GlassCard>
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-text mb-4">Recent Activity</h3>
                    <div className="text-center py-8 text-textSecondary">
                        <p>No recent activity</p>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
