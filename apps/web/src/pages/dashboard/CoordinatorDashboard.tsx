import { useEffect } from 'react';
// GlassCard removed
import { useStats } from '../coordinator/ControlPanel/hooks/useStats';
import { StatsCards } from '../coordinator/ControlPanel/components/Dashboard/StatsCards';
import { Loader } from '../../components/ui/Loader';

export function CoordinatorDashboard() {
    const { stats, statsLoading, fetchStats } = useStats();

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Quick Actions Removed */}

            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">System Overview</h3>
                {statsLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader />
                    </div>
                ) : stats ? (
                    <StatsCards stats={stats} />
                ) : (
                    <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm text-center text-slate-500">
                        Failed to load system statistics.
                    </div>
                )}
            </div>
        </div>
    );
}
