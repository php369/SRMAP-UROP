import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '../../components/dashboard/DashboardCard';
// GlassCard removed
import {
    HomeIcon,
    UploadIcon,
    CalendarIcon
} from '../../components/ui/Icons';

export function AdminDashboard() {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="border-b border-slate-100 pb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <DashboardCard
                        title="Dashboard"
                        icon={<HomeIcon size={20} />}

                        className="hover:border-primary/50 transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                        onClick={() => navigate('/dashboard')}
                    >
                        <p className="text-xs text-slate-500 mt-1">Overview</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Eligibility Upload"
                        icon={<UploadIcon size={20} />}

                        className="hover:border-primary/50 transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                        onClick={() => navigate('/dashboard/admin/eligibility')}
                    >
                        <p className="text-xs text-slate-500 mt-1">Upload Student Data</p>
                    </DashboardCard>

                    <DashboardCard
                        title="Windows"
                        icon={<CalendarIcon size={20} />}

                        className="hover:border-primary/50 transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                        onClick={() => navigate('/dashboard/admin/windows')}
                    >
                        <p className="text-xs text-slate-500 mt-1">Manage Windows</p>
                    </DashboardCard>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">System Stats</h3>
                    <div className="text-center py-8 text-slate-400">
                        <p>Stats unavailable</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
