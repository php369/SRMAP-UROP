import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '../../components/dashboard/DashboardCard';
import { GlassCard } from '../../components/ui/GlassCard';
import {
    LayoutDashboard,
    Briefcase,
    CheckSquare,
    FileText,
    Settings
} from 'lucide-react';

export function CoordinatorDashboard() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <DashboardCard
                        title="Dashboard"
                        icon={<LayoutDashboard size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Overview</p>
                    </DashboardCard>

                    <DashboardCard
                        title="My Projects"
                        icon={<Briefcase size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/projects')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Manage Projects</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Approvals"
                        icon={<CheckSquare size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/projects/approvals')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Pending Approvals</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Applications"
                        icon={<FileText size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/faculty/applications')}
                    >
                        <p className="text-xs text-textSecondary mt-1">All Applications</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Control Panel"
                        icon={<Settings size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/control')}
                    >
                        <p className="text-xs text-textSecondary mt-1">System Settings</p>
                    </DashboardCard>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-text mb-4">Pending Approvals</h3>
                    <div className="text-center py-8 text-textSecondary">
                        <p>No pending approvals</p>
                    </div>
                </GlassCard>
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-text mb-4">System Status</h3>
                    <div className="p-4 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 text-center">
                        <p className="font-semibold">System Operational</p>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
