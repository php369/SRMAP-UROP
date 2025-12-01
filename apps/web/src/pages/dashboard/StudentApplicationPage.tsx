import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, GlowButton, Badge } from '../../components/ui';
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations';
import { cohortService, Cohort } from '../../services/cohortService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export function StudentApplicationPage() {
    const { user } = useAuth();
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [myCohorts, setMyCohorts] = useState<Cohort[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        fetchCohorts();
        if (user?.id) {
            fetchMyCohorts();
        }
    }, [user]);

    const fetchCohorts = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await cohortService.getCohorts({ status: 'active' });
            setCohorts(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch cohorts');
            toast.error('Failed to load cohorts');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyCohorts = async () => {
        if (!user?.id) return;

        try {
            const data = await cohortService.getUserCohorts(user.id);
            setMyCohorts(data);
        } catch (err: any) {
            console.error('Error fetching user cohorts:', err);
        }
    };

    const handleJoinCohort = async () => {
        if (!selectedCohort) return;

        setJoining(true);
        try {
            await cohortService.joinCohort(selectedCohort._id);
            toast.success(`Successfully joined ${selectedCohort.name}!`);
            setShowJoinModal(false);
            setSelectedCohort(null);

            // Refresh data
            await fetchCohorts();
            await fetchMyCohorts();
        } catch (err: any) {
            toast.error(err.message || 'Failed to join cohort');
        } finally {
            setJoining(false);
        }
    };

    const isAlreadyInCohort = (cohortId: string) => {
        return myCohorts.some(c => c._id === cohortId);
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
                <motion.div variants={fadeUp}>
                    <h1 className="text-3xl font-bold text-text mb-2">Join a Cohort</h1>
                    <p className="text-textSecondary">
                        Browse and join cohorts to connect with students in your department and year
                    </p>
                </motion.div>

                {/* My Cohorts Section */}
                {myCohorts.length > 0 && (
                    <motion.div variants={staggerItem}>
                        <GlassCard variant="elevated" className="p-6">
                            <h2 className="text-xl font-semibold text-text mb-4">My Cohorts</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {myCohorts.map((cohort) => (
                                    <div
                                        key={cohort._id}
                                        className="p-4 bg-primary/10 border border-primary/30 rounded-lg"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-text">{cohort.name}</h3>
                                            <Badge variant="glass" className="bg-success/20 text-success border-success/30">
                                                Joined
                                            </Badge>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-textSecondary">Year:</span>
                                                <span className="text-text font-medium">{cohort.year}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-textSecondary">Department:</span>
                                                <span className="text-text font-medium">{cohort.department}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-textSecondary">Members:</span>
                                                <span className="text-text font-medium">{cohort.members?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {/* Error Message */}
                {error && (
                    <motion.div variants={staggerItem}>
                        <GlassCard variant="elevated" className="p-4 bg-error/10 border-error/30">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-error">{error}</p>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {/* Available Cohorts */}
                <motion.div variants={staggerItem}>
                    <GlassCard variant="elevated" className="p-6">
                        <h2 className="text-xl font-semibold text-text mb-4">Available Cohorts</h2>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="text-textSecondary mt-4">Loading cohorts...</p>
                            </div>
                        ) : cohorts.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="w-16 h-16 mx-auto text-textSecondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-textSecondary">No cohorts available at the moment.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cohorts.map((cohort) => {
                                    const alreadyJoined = isAlreadyInCohort(cohort._id);

                                    return (
                                        <motion.div
                                            key={cohort._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group"
                                        >
                                            <GlassCard variant="elevated" className="p-6 h-full flex flex-col">
                                                <div className="flex items-start justify-between mb-4">
                                                    <h3 className="text-lg font-semibold text-text">{cohort.name}</h3>
                                                    {alreadyJoined && (
                                                        <Badge variant="glass" className="bg-success/20 text-success border-success/30">
                                                            Joined
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="space-y-3 mb-4 flex-grow">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-textSecondary">Year:</span>
                                                        <span className="text-text font-medium">{cohort.year}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-textSecondary">Department:</span>
                                                        <span className="text-text font-medium text-right">{cohort.department}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-textSecondary">Members:</span>
                                                        <span className="text-text font-medium">{cohort.members?.length || 0}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-textSecondary">Status:</span>
                                                        <Badge variant="glass" className="bg-success/20 text-success border-success/30">
                                                            {cohort.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <GlowButton
                                                    onClick={() => {
                                                        setSelectedCohort(cohort);
                                                        setShowJoinModal(true);
                                                    }}
                                                    variant="primary"
                                                    className="w-full"
                                                    disabled={alreadyJoined}
                                                >
                                                    {alreadyJoined ? 'Already Joined' : 'Join Cohort'}
                                                </GlowButton>
                                            </GlassCard>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </GlassCard>
                </motion.div>

                {/* Join Confirmation Modal */}
                {showJoinModal && selectedCohort && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-surface border border-white/10 rounded-lg p-6 max-w-md w-full"
                        >
                            <h3 className="text-xl font-bold text-text mb-4">Join Cohort</h3>

                            <div className="mb-6">
                                <p className="text-textSecondary mb-4">
                                    Are you sure you want to join <span className="text-text font-semibold">{selectedCohort.name}</span>?
                                </p>

                                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-textSecondary">Year:</span>
                                        <span className="text-text font-medium">{selectedCohort.year}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-textSecondary">Department:</span>
                                        <span className="text-text font-medium">{selectedCohort.department}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-textSecondary">Current Members:</span>
                                        <span className="text-text font-medium">{selectedCohort.members?.length || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowJoinModal(false);
                                        setSelectedCohort(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-white/5 text-text rounded-lg hover:bg-white/10 transition-colors"
                                    disabled={joining}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleJoinCohort}
                                    disabled={joining}
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {joining ? 'Joining...' : 'Join Cohort'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
