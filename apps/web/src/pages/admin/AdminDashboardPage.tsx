import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassCard, GlowButton, Badge } from '../../components/ui';
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, Users, Settings } from 'lucide-react';

export function AdminDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const quickActions = [
        {
            title: 'Upload Eligibility Lists',
            description: 'Upload CSV files for IDP, UROP, and CAPSTONE eligibility',
            icon: <Upload className="w-8 h-8" />,
            color: 'from-blue-500 to-blue-600',
            action: () => navigate('/dashboard/admin/eligibility'),
            primary: true
        },
        {
            title: 'Manage Users',
            description: 'View and manage all system users',
            icon: <Users className="w-8 h-8" />,
            color: 'from-purple-500 to-purple-600',
            action: () => navigate('/dashboard/admin/users')
        },
        {
            title: 'Manage Windows',
            description: 'Control application, proposal, and submission windows',
            icon: <Settings className="w-8 h-8" />,
            color: 'from-green-500 to-green-600',
            action: () => navigate('/dashboard/admin/windows')
        }
    ];

    return (
        <div className="min-h-screen p-8">
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="max-w-7xl mx-auto space-y-8"
            >
                {/* Header */}
                <motion.div variants={fadeUp}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-text mb-2">
                                Admin Dashboard
                            </h1>
                            <p className="text-textSecondary">
                                Welcome back, {user?.name}
                            </p>
                        </div>
                        <Badge variant="glass" size="lg">
                            Administrator
                        </Badge>
                    </div>
                </motion.div>

                {/* Quick Actions Grid */}
                <motion.div variants={staggerItem}>
                    <h2 className="text-2xl font-semibold text-text mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {quickActions.map((action, index) => (
                            <motion.div
                                key={action.title}
                                variants={staggerItem}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <GlassCard
                                    variant={action.primary ? 'elevated' : 'default'}
                                    className={`p-6 cursor-pointer ${action.primary ? 'ring-2 ring-primary/50' : ''}`}
                                    onClick={action.action}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} text-white`}>
                                            {action.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-text mb-1">
                                                {action.title}
                                            </h3>
                                            <p className="text-sm text-textSecondary">
                                                {action.description}
                                            </p>
                                        </div>
                                        <svg
                                            className="w-5 h-5 text-textSecondary"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* System Overview */}
                <motion.div variants={staggerItem}>
                    <h2 className="text-2xl font-semibold text-text mb-4">
                        System Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <GlassCard variant="subtle" className="p-6">
                            <div className="text-3xl font-bold text-primary mb-2">
                                0
                            </div>
                            <div className="text-sm text-textSecondary">
                                Total Users
                            </div>
                        </GlassCard>
                        <GlassCard variant="subtle" className="p-6">
                            <div className="text-3xl font-bold text-success mb-2">
                                0
                            </div>
                            <div className="text-sm text-textSecondary">
                                Active Projects
                            </div>
                        </GlassCard>
                        <GlassCard variant="subtle" className="p-6">
                            <div className="text-3xl font-bold text-warning mb-2">
                                0
                            </div>
                            <div className="text-sm text-textSecondary">
                                Pending Applications
                            </div>
                        </GlassCard>
                        <GlassCard variant="subtle" className="p-6">
                            <div className="text-3xl font-bold text-info mb-2">
                                0
                            </div>
                            <div className="text-sm text-textSecondary">
                                Submissions
                            </div>
                        </GlassCard>
                    </div>
                </motion.div>

                {/* Important Notice */}
                <motion.div variants={staggerItem}>
                    <GlassCard variant="elevated" className="p-6 bg-primary/10 border-primary/30">
                        <div className="flex items-start space-x-4">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Settings className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-text mb-2">
                                    Getting Started
                                </h3>
                                <p className="text-textSecondary mb-4">
                                    To enable students and faculty to use the portal, start by uploading eligibility lists.
                                    This will determine who can access IDP, UROP, and CAPSTONE projects.
                                </p>
                                <GlowButton
                                    variant="primary"
                                    glow
                                    onClick={() => navigate('/dashboard/admin/eligibility')}
                                >
                                    Upload Eligibility Lists
                                </GlowButton>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            </motion.div>
        </div>
    );
}
