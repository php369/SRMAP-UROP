import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/userService';
import { toast } from 'react-hot-toast';

interface UserOnboardingModalProps {
    isOpen: boolean;
}

export function UserOnboardingModal({ isOpen }: UserOnboardingModalProps) {
    const { updateUser } = useAuthStore();
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If not open or user already has a name, don't render
    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Please enter your full name');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Update on server
            const updatedUser = await userService.updateProfile({ name: name.trim() });

            // 2. Update local store
            if (updatedUser) {
                updateUser(updatedUser);
                toast.success(`Welcome, ${updatedUser.name}!`);
            } else {
                // Fallback if server doesn't return user, update local with what we sent
                updateUser({ name: name.trim() });
                toast.success('Profile updated successfully');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop - heavily blurred and blocking */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/80 backdrop-blur-md"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
                >
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">👋</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                Welcome to Project Portal
                            </h2>
                            <p className="text-slate-500">
                                Please enter your full name to continue. This helps your team identify you.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="fullName"
                                    className="block text-sm font-medium text-slate-700 mb-2"
                                >
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="e.g. John Doe"
                                    autoFocus
                                    disabled={isSubmitting}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !name.trim()}
                                className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Complete Profile'
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
