import { motion } from 'framer-motion';

export function AuthVisual() {
    return (
        <div className="relative w-full h-full bg-surface overflow-hidden flex flex-col justify-between p-12">
            {/* Background Grain Effect */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Modern Gradient Blobs */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute -top-[20%] -right-[10%] w-[80%] h-[80%] rounded-full bg-primary/20 blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, -50, 0],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                    className="absolute top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-accent/20 blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        y: [0, 50, 0],
                        opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 5
                    }}
                    className="absolute -bottom-[20%] left-[20%] w-[70%] h-[70%] rounded-full bg-textSecondary/10 blur-3xl"
                />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 mt-auto mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    <div className="w-16 h-16 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg mb-8 border border-white/50">
                        <img src="/branding/srm-icon.svg" alt="SRM Logo" className="w-8 h-8 opacity-80" />
                    </div>

                    <h2 className="text-4xl font-bold text-textPrimary tracking-tight mb-4 leading-tight">
                        Manage Academic Projects <br />
                        <span className="text-primary">With Excellence.</span>
                    </h2>

                    <p className="text-lg text-textSecondary max-w-md leading-relaxed">
                        Experience a seamless workflow for UROP, IDP, and Capstone projects.
                        Designed for the innovators of SRM University-AP.
                    </p>
                </motion.div>
            </div>

            {/* Decorative Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black_40%,transparent_100%)] pointer-events-none" />
        </div>
    );
}
