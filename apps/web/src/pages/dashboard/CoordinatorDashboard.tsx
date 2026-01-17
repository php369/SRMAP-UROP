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
                <div className="flex justify-between items-center">
                    {statsLoading && (
                        <div className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-wider">
                            Refreshing...
                        </div>
                    )}
                </div>

                {stats || statsLoading ? (
                    <StatsCards stats={stats} loading={statsLoading} />
                ) : (
                    <div className="p-12 rounded-2xl border border-slate-200 bg-white/50 shadow-sm text-center">
                        <div className="inline-flex p-4 rounded-full bg-rose-50 mb-4">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Failed to load statistics</h3>
                        <p className="text-slate-500 text-sm mb-6">We couldn't reach the data server.</p>
                        <button
                            onClick={() => fetchStats()}
                            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                        >
                            Retry Connection
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
