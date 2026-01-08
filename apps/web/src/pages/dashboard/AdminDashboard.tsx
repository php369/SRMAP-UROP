import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '../../components/dashboard/DashboardCard';
import { GlassCard } from '../../components/ui/GlassCard';
import {
    LayoutDashboard,
    Upload,
    Calendar
} from 'lucide-react';

export function AdminDashboard() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                        title="Eligibility Upload"
                        icon={<Upload size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/admin/eligibility')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Upload Student Data</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Windows"
                        icon={<Calendar size={20} />}
                        glass={false}
                        className="hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => navigate('/dashboard/admin/windows')}
                    >
                        <p className="text-xs text-textSecondary mt-1">Manage Windows</p>
                    </DashboardCard>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                    <h3 className="text-lg font-semibold text-text mb-4">System Stats</h3>
                    <div className="text-center py-8 text-textSecondary">
                        <p>Stats unavailable</p>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
