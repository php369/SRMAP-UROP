import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '../../components/dashboard/DashboardCard';
import TiltedCard from '../../components/ui/TiltedCard';
// GlassCard removed
import {
    HomeIcon,
    FolderOpenIcon,
    UsersIcon,
    SettingsIcon,
    CalendarIcon
} from '../../components/ui/Icons';
import { useStats } from '../coordinator/ControlPanel/hooks/useStats';
import { StatsCards } from '../coordinator/ControlPanel/components/Dashboard/StatsCards';
import { Loader } from '../../components/ui/Loader';

export function CoordinatorDashboard() {
    const navigate = useNavigate();
    const { stats, statsLoading, fetchStats } = useStats();

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
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
                                className="h-full hover:border-primary/50 transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                                onClick={() => navigate('/dashboard')}
                            >
                                <p className="text-xs text-slate-500 mt-1">Overview</p>
                            </DashboardCard>
                        </TiltedCard>
                    </div>

                    <div style={{ height: '140px' }}>
                        <TiltedCard
                            imageSrc=""
                            altText="My Projects"
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
                                title="My Projects"
                                icon={<FolderOpenIcon size={20} />}
                                className="h-full hover:border-primary/50 transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                                onClick={() => navigate('/dashboard/projects')}
                            >
                                <p className="text-xs text-slate-500 mt-1">Manage Projects</p>
                            </DashboardCard>
                        </TiltedCard>
                    </div>

                    <div style={{ height: '140px' }}>
                        <TiltedCard
                            imageSrc=""
                            altText="Applications"
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
                                title="Applications"
                                icon={<UsersIcon size={20} />}
                                className="h-full hover:border-primary/50 transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                                onClick={() => navigate('/dashboard/faculty/applications')}
                            >
                                <p className="text-xs text-slate-500 mt-1">All Applications</p>
                            </DashboardCard>
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
                                className="h-full hover:border-primary/50 transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                                onClick={() => navigate('/dashboard/faculty/meetings')}
                            >
                                <p className="text-xs text-slate-500 mt-1">Schedule Meetings</p>
                            </DashboardCard>
                        </TiltedCard>
                    </div>

                    <div style={{ height: '140px' }}>
                        <TiltedCard
                            imageSrc=""
                            altText="Control Panel"
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
                                title="Control Panel"
                                icon={<SettingsIcon size={20} />}
                                className="h-full hover:border-primary/50 transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                                onClick={() => navigate('/dashboard/control')}
                            >
                                <p className="text-xs text-slate-500 mt-1">System Settings</p>
                            </DashboardCard>
                        </TiltedCard>
                    </div>
                </div>
            </div>

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
