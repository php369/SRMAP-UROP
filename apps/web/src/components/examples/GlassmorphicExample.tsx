import { motion } from 'framer-motion';
import { GlassCard, GlowButton, GradientBorderBox } from '../ui';
import { fadeUp, slideIn, staggerContainer, staggerItem } from '../../utils/animations';

/**
 * Example component demonstrating the glassmorphic design system
 * This showcases all the UI components and animations required by Task 4
 */
export function GlassmorphicExample() {
    return (
        <div className="min-h-screen bg-gradient-mesh p-8">
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="max-w-6xl mx-auto space-y-8"
            >
                {/* Header */}
                <motion.div variants={fadeUp} className="text-center">
                    <h1 className="text-4xl font-bold text-text mb-2">
                        Glassmorphic Design System
                    </h1>
                    <p className="text-textSecondary">
                        Modern UI components with frosted-glass effects and smooth animations
                    </p>
                </motion.div>

                {/* GlassCard Examples */}
                <motion.div variants={staggerItem}>
                    <h2 className="text-2xl font-semibold text-text mb-4">Glass Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <GlassCard variant="default" className="p-6">
                            <h3 className="text-lg font-semibold text-text mb-2">Default</h3>
                            <p className="text-textSecondary">
                                Standard glass card with medium blur
                            </p>
                        </GlassCard>

                        <GlassCard variant="elevated" blur="lg" className="p-6">
                            <h3 className="text-lg font-semibold text-text mb-2">Elevated</h3>
                            <p className="text-textSecondary">
                                Enhanced shadow with large blur
                            </p>
                        </GlassCard>

                        <GlassCard variant="subtle" blur="sm" className="p-6">
                            <h3 className="text-lg font-semibold text-text mb-2">Subtle</h3>
                            <p className="text-textSecondary">
                                Minimal effect with small blur
                            </p>
                        </GlassCard>
                    </div>
                </motion.div>

                {/* GradientBorderBox Examples */}
                <motion.div variants={staggerItem}>
                    <h2 className="text-2xl font-semibold text-text mb-4">Gradient Borders</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GradientBorderBox gradient="primary" glow className="p-6">
                            <h3 className="text-lg font-semibold text-text mb-2">Primary Gradient</h3>
                            <p className="text-textSecondary">
                                With glow effect
                            </p>
                        </GradientBorderBox>

                        <GradientBorderBox gradient="rainbow" borderWidth="3" className="p-6">
                            <h3 className="text-lg font-semibold text-text mb-2">Rainbow Gradient</h3>
                            <p className="text-textSecondary">
                                Thicker border
                            </p>
                        </GradientBorderBox>
                    </div>
                </motion.div>

                {/* GlowButton Examples */}
                <motion.div variants={staggerItem}>
                    <h2 className="text-2xl font-semibold text-text mb-4">Glow Buttons</h2>
                    <div className="flex flex-wrap gap-4">
                        <GlowButton variant="primary" glow>
                            Primary with Glow
                        </GlowButton>
                        <GlowButton variant="secondary" size="lg">
                            Secondary Large
                        </GlowButton>
                        <GlowButton variant="accent" size="sm">
                            Accent Small
                        </GlowButton>
                        <GlowButton variant="ghost">
                            Ghost Button
                        </GlowButton>
                    </div>
                </motion.div>

                {/* Animation Examples */}
                <motion.div variants={slideIn}>
                    <h2 className="text-2xl font-semibold text-text mb-4">Animations</h2>
                    <GlassCard className="p-6">
                        <p className="text-textSecondary mb-4">
                            This component demonstrates:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-textSecondary">
                            <li>Fade-up animation (header)</li>
                            <li>Slide-in animation (this card)</li>
                            <li>Stagger animation (all sections)</li>
                            <li>Hover effects on interactive elements</li>
                            <li>Duration range: 150-600ms</li>
                        </ul>
                    </GlassCard>
                </motion.div>

                {/* Responsive Design Note */}
                <motion.div variants={fadeUp}>
                    <GlassCard variant="elevated" className="p-6">
                        <h3 className="text-lg font-semibold text-text mb-2">
                            ✨ Responsive & Accessible
                        </h3>
                        <p className="text-textSecondary">
                            All components are fully responsive with mobile optimizations and
                            support both light and dark themes.
                        </p>
                    </GlassCard>
                </motion.div>
            </motion.div>
        </div>
    );
}
