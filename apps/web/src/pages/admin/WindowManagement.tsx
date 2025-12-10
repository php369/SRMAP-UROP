import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { GlassCard, GlowButton, Badge } from '../../components/ui';
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations';
import { apiClient } from '../../utils/api';
import { useWindowStatus } from '../../hooks/useWindowStatus';
import toast from 'react-hot-toast';

interface WindowData {
    _id: string;
    windowType: 'application' | 'proposal' | 'submission';
    projectType: 'IDP' | 'UROP' | 'CAPSTONE';
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
}

export function WindowManagement() {
    const { windows, loading: windowsLoading, refresh } = useWindowStatus();
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingWindow, setEditingWindow] = useState<WindowData | null>(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [formData, setFormData] = useState({
        windowType: 'application' as 'application' | 'proposal' | 'submission',
        projectType: 'IDP' as 'IDP' | 'UROP' | 'CAPSTONE',
        startDate: '',
        endDate: '',
        isActive: true
    });

    // Auto-refresh every 30 seconds and update last refresh time
    useEffect(() => {
        const interval = setInterval(() => {
            refresh();
            setLastRefresh(new Date());
        }, 30000);
        
        return () => clearInterval(interval);
    }, [refresh]);

    const handleManualRefresh = async () => {
        await refresh();
        setLastRefresh(new Date());
        toast.success('Window status refreshed');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingWindow) {
                const response = await apiClient.put(`/windows/${editingWindow._id}`, formData);
                if (response.success) {
                    toast.success('Window updated successfully');
                    await refresh();
                    setLastRefresh(new Date());
                    handleCloseModal();
                } else {
                    toast.error(response.error?.message || 'Failed to update window');
                }
            } else {
                const response = await apiClient.post('/windows', formData);
                if (response.success) {
                    toast.success('Window created successfully');
                    await refresh();
                    setLastRefresh(new Date());
                    handleCloseModal();
                } else {
                    toast.error(response.error?.message || 'Failed to create window');
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this window?')) return;

        try {
            const response = await apiClient.delete(`/windows/${id}`);
            if (response.success) {
                toast.success('Window deleted successfully');
                await refresh();
                setLastRefresh(new Date());
            } else {
                toast.error(response.error?.message || 'Failed to delete window');
            }
        } catch (error) {
            toast.error('Failed to delete window');
        }
    };

    const handleEdit = (window: WindowData) => {
        setEditingWindow(window);
        setFormData({
            windowType: window.windowType,
            projectType: window.projectType,
            startDate: window.startDate.split('T')[0],
            endDate: window.endDate.split('T')[0],
            isActive: window.isActive
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingWindow(null);
        setFormData({
            windowType: 'application',
            projectType: 'IDP',
            startDate: '',
            endDate: '',
            isActive: true
        });
    };

    const getWindowTypeColor = (type: string) => {
        switch (type) {
            case 'application': return 'from-blue-500 to-blue-600';
            case 'proposal': return 'from-purple-500 to-purple-600';
            case 'submission': return 'from-green-500 to-green-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    return (
        <div className="min-h-screen p-8">
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="max-w-7xl mx-auto space-y-6"
            >
                {/* Header */}
                <motion.div variants={fadeUp} className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text mb-2">
                            Window Management
                        </h1>
                        <div className="flex items-center gap-4">
                            <p className="text-textSecondary">
                                Manage application, proposal, and submission windows
                            </p>
                            <div className="flex items-center gap-2 text-xs text-textSecondary">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleManualRefresh}
                            disabled={windowsLoading}
                            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text transition-all flex items-center gap-2 disabled:opacity-50"
                            title="Refresh window status"
                        >
                            <RefreshCw className={`w-4 h-4 ${windowsLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <GlowButton
                            variant="primary"
                            glow
                            onClick={() => setShowModal(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Window
                        </GlowButton>
                    </div>
                </motion.div>

                {/* Windows Grid */}
                <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {windows.map((window) => (
                        <GlassCard key={window._id} variant="elevated" className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${getWindowTypeColor(window.windowType)} text-white`}>
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const now = new Date();
                                        const start = new Date(window.startDate);
                                        const end = new Date(window.endDate);
                                        const isCurrentlyActive = window.isActive && now >= start && now <= end;
                                        
                                        if (isCurrentlyActive) {
                                            return <Badge variant="success" size="sm">Active</Badge>;
                                        } else if (window.isActive && now < start) {
                                            return <Badge variant="warning" size="sm">Scheduled</Badge>;
                                        } else if (window.isActive && now > end) {
                                            return <Badge variant="error" size="sm">Expired</Badge>;
                                        } else {
                                            return <Badge variant="error" size="sm">Inactive</Badge>;
                                        }
                                    })()}
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-text mb-1 capitalize">
                                {window.windowType} Window
                            </h3>
                            <p className="text-sm text-textSecondary mb-4">
                                {window.projectType}
                            </p>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-textSecondary">Start:</span>
                                    <span className="text-text font-medium">
                                        {new Date(window.startDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-textSecondary">End:</span>
                                    <span className="text-text font-medium">
                                        {new Date(window.endDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(window as WindowData)}
                                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(window._id)}
                                    className="px-3 py-2 bg-error/10 hover:bg-error/20 border border-error/30 rounded-lg text-error transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                </motion.div>

                {windows.length === 0 && !loading && (
                    <motion.div variants={fadeUp}>
                        <GlassCard variant="subtle" className="p-12 text-center">
                            <Calendar className="w-16 h-16 text-textSecondary mx-auto mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold text-text mb-2">No Windows Created</h3>
                            <p className="text-textSecondary mb-6">
                                Create your first window to enable applications, proposals, or submissions
                            </p>
                            <GlowButton variant="primary" onClick={() => setShowModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Window
                            </GlowButton>
                        </GlassCard>
                    </motion.div>
                )}

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-md"
                        >
                            <GlassCard variant="elevated" className="p-6">
                                <h2 className="text-2xl font-bold text-text mb-6">
                                    {editingWindow ? 'Edit Window' : 'Create Window'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text mb-2">
                                            Window Type
                                        </label>
                                        <select
                                            value={formData.windowType}
                                            onChange={(e) => setFormData({ ...formData, windowType: e.target.value as any })}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        >
                                            <option value="application">Application</option>
                                            <option value="proposal">Proposal</option>
                                            <option value="submission">Submission</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text mb-2">
                                            Project Type
                                        </label>
                                        <select
                                            value={formData.projectType}
                                            onChange={(e) => setFormData({ ...formData, projectType: e.target.value as any })}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        >
                                            <option value="IDP">IDP</option>
                                            <option value="UROP">UROP</option>
                                            <option value="CAPSTONE">CAPSTONE</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text mb-2">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text mb-2">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-2 focus:ring-primary"
                                        />
                                        <label htmlFor="isActive" className="text-sm font-medium text-text">
                                            Active
                                        </label>
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-text transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <GlowButton
                                            type="submit"
                                            variant="primary"
                                            glow
                                            className="flex-1"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : editingWindow ? 'Update' : 'Create'}
                                        </GlowButton>
                                    </div>
                                </form>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
