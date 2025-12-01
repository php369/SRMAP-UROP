import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard, GlowButton, Badge } from '../../components/ui';
import { fadeUp, staggerContainer, staggerItem } from '../../utils/animations';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeActions, useThemeMode } from '../../stores/themeStore';

export function PreferencesPage() {
    const { user } = useAuth();
    const themeMode = useThemeMode();
    const { toggleTheme } = useThemeActions();
    const [notifications, setNotifications] = useState(user?.preferences?.notifications ?? true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        // Show success message
        alert('Preferences saved successfully!');
    };

    return (
        <div className="min-h-screen p-8">
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="max-w-4xl mx-auto space-y-6"
            >
                {/* Header */}
                <motion.div variants={fadeUp}>
                    <h1 className="text-3xl font-bold text-text mb-2">
                        Preferences
                    </h1>
                    <p className="text-textSecondary">
                        Customize your portal experience
                    </p>
                </motion.div>

                {/* Appearance Settings */}
                <motion.div variants={staggerItem}>
                    <GlassCard variant="elevated" className="p-6">
                        <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            Appearance
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <div>
                                    <p className="font-medium text-text">Theme</p>
                                    <p className="text-sm text-textSecondary">Choose your preferred color scheme</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => themeMode === 'dark' && toggleTheme()}
                                        className={`px-4 py-2 rounded-lg transition-all ${themeMode === 'light'
                                                ? 'bg-primary text-white'
                                                : 'bg-white/10 text-textSecondary hover:bg-white/20'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => themeMode === 'light' && toggleTheme()}
                                        className={`px-4 py-2 rounded-lg transition-all ${themeMode === 'dark'
                                                ? 'bg-primary text-white'
                                                : 'bg-white/10 text-textSecondary hover:bg-white/20'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Notification Settings */}
                <motion.div variants={staggerItem}>
                    <GlassCard variant="elevated" className="p-6">
                        <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Notifications
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <div>
                                    <p className="font-medium text-text">Push Notifications</p>
                                    <p className="text-sm text-textSecondary">Receive notifications in the portal</p>
                                </div>
                                <button
                                    onClick={() => setNotifications(!notifications)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? 'bg-primary' : 'bg-white/20'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <div>
                                    <p className="font-medium text-text">Email Notifications</p>
                                    <p className="text-sm text-textSecondary">Receive updates via email</p>
                                </div>
                                <button
                                    onClick={() => setEmailNotifications(!emailNotifications)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? 'bg-primary' : 'bg-white/20'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Language & Region */}
                <motion.div variants={staggerItem}>
                    <GlassCard variant="elevated" className="p-6">
                        <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            Language & Region
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-lg">
                                <label className="block text-sm font-medium text-text mb-2">
                                    Language
                                </label>
                                <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option>English (US)</option>
                                    <option>English (UK)</option>
                                    <option>Hindi</option>
                                </select>
                            </div>

                            <div className="p-4 bg-white/5 rounded-lg">
                                <label className="block text-sm font-medium text-text mb-2">
                                    Timezone
                                </label>
                                <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option>Asia/Kolkata (IST)</option>
                                    <option>UTC</option>
                                    <option>America/New_York (EST)</option>
                                </select>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Save Button */}
                <motion.div variants={staggerItem}>
                    <GlowButton
                        onClick={handleSave}
                        loading={saving}
                        variant="primary"
                        glow
                        className="w-full"
                    >
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </GlowButton>
                </motion.div>
            </motion.div>
        </div>
    );
}
