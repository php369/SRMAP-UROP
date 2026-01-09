import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '../../components/dashboard/DashboardCard';
// GlassCard removed
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
            <div className="border-b border-slate-100 pb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DashboardCard
                        title="Dashboard"
                        icon={<HomeIcon size={20} />}
                        className="hover:bg-white transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                        onClick={() => navigate('/dashboard')}
                    >
                        <p className="text-xs text-slate-500 mt-1">Overview</p>
                    </DashboardCard>

                    <DashboardCard
                        title="My Projects"
                        icon={<FolderOpenIcon size={20} />}
                        className="hover:bg-white transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                        onClick={() => navigate('/dashboard/projects')}
                    >
                        <p className="text-xs text-slate-500 mt-1">Manage Projects</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Applications"
                        icon={<UsersIcon size={20} />}
                        className="hover:bg-white transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                        onClick={() => navigate('/dashboard/faculty/applications')}
                    >
                        <p className="text-xs text-slate-500 mt-1">Review Applications</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Assessment"
                        icon={<AwardIcon size={20} />}
                        className="hover:bg-white transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                        onClick={() => navigate('/dashboard/faculty/assessment')}
                    >
                        <p className="text-xs text-slate-500 mt-1">Evaluate Students</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Meetings"
                        icon={<CalendarIcon size={20} />}
                        className="hover:bg-white transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                        onClick={() => navigate('/dashboard/faculty/meetings')}
                    >
                        <p className="text-xs text-slate-500 mt-1">Schedule Meetings</p>
                    </DashboardCard>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Pending Reviews</h3>
                    <div className="text-center py-8 text-slate-400">
                        <p>No pending reviews</p>
                    </div>
                </div>
                <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                    <div className="text-center py-8 text-slate-400">
                        <p>No recent activity</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
