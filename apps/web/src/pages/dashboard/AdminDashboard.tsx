import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '../../components/dashboard/DashboardCard';
import TiltedCard from '../../components/ui/TiltedCard';
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
                    <div style={{ height: '140px' }}>
                        <TiltedCard
                            imageSrc=""
                            altText="Overview"
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
                                className="h-full hover:bg-white transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                                onClick={() => navigate('/dashboard')}
                            />
                        </TiltedCard>
                    </div>

                    <div style={{ height: '140px' }}>
                        <TiltedCard
                            imageSrc=""
                            altText="Upload Data"
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
                                title="Eligibility Upload"
                                icon={<UploadIcon size={20} />}
                                className="h-full hover:bg-white transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                                onClick={() => navigate('/dashboard/admin/eligibility')}
                            />
                        </TiltedCard>
                    </div>

                    <div style={{ height: '140px' }}>
                        <TiltedCard
                            imageSrc=""
                            altText="Manage Windows"
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
                                title="Windows"
                                icon={<CalendarIcon size={20} />}
                                className="h-full hover:bg-white transition-colors cursor-pointer bg-slate-50 border border-slate-200 shadow-none"
                                onClick={() => navigate('/dashboard/admin/windows')}
                            />
                        </TiltedCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
