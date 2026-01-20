import { motion } from 'framer-motion';
import { CheckCircle, Shield, User, Check, Upload, Sparkles, FileText, X, Info } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../contexts/AuthContext';

// --- Confetti Component ---
export const Confetti = ({ isActive }: { isActive: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isActive || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: any[] = [];
        const particleCount = 200;
        const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#34d399', '#f472b6'];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height * 0.8, // Start from bottom centerish
                vx: (Math.random() - 0.5) * 25,
                vy: (Math.random() - 1) * 20 - 5, // shoot up
                life: Math.random() * 100 + 100,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 3,
                gravity: 0.4
            });
        }

        let animationFrameId: number;

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.life--;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.size *= 0.96;

                ctx.globalAlpha = Math.max(0, p.life / 100);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                if (p.life <= 0 || p.size <= 0.1) {
                    particles.splice(i, 1);
                    i--;
                }
            }

            if (particles.length > 0) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isActive]);

    if (!isActive) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
        />
    );
};


// --- Compact Collaboration Info ---
interface CollaborationInfoProps {
    userGroup: any;
    isLeader: boolean;
}

export const ContextInfoRow = ({ userGroup, isLeader }: CollaborationInfoProps) => {
    const { user } = useAuth();
    return (
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/50">
                <span className={cn("w-1.5 h-1.5 rounded-full", userGroup ? "bg-violet-500" : "bg-blue-500")} />
                <span className="font-bold text-slate-700 dark:text-slate-200">
                    {userGroup ? (userGroup.groupName || userGroup.groupCode) : "Individual"}
                </span>
            </div>

            {userGroup && (
                <>
                    <span className="opacity-20 select-none">•</span>
                    <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold",
                        isLeader
                            ? "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                            : "bg-slate-100/50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400"
                    )}>
                        {isLeader ? (user?.name || "Team Leader") : (userGroup.leaderId?.name || userGroup.leaderId?.fullName || "Team Leader")}
                    </span>
                </>
            )}

            <span className="opacity-20 select-none">•</span>

            <span className="text-slate-400 dark:text-slate-500">
                {userGroup ? "Collaborative Submission" : "Solo Project"}
            </span>
        </div >
    );
};


// --- Progress Indicator ---
interface ProgressIndicatorProps {
    currentStep: number; // 0: Connect, 1: Upload, 2: Complete
}

export const SubmissionProgress = ({ currentStep }: ProgressIndicatorProps) => {
    const steps = [
        { label: "Connect", icon: Info },
        { label: "Upload", icon: Upload },
        { label: "Submit", icon: Sparkles }
    ];

    return (
        <div className="w-full flex flex-col items-center justify-center py-2 mb-8">
            <div className="flex items-center gap-1">
                {steps.map((step, idx) => (
                    <div key={idx} className="flex items-center">
                        <motion.div
                            initial={false}
                            animate={{
                                backgroundColor: idx <= currentStep
                                    ? (idx === 2 ? '#10b981' : '#7c3aed')
                                    : (idx === 2 ? 'transparent' : 'transparent'),
                                color: idx <= currentStep ? '#ffffff' : (idx === 2 ? '#cbd5e1' : '#94a3b8'), // Lightest grey for locked submit
                                borderColor: idx <= currentStep ? 'transparent' : (idx === 2 ? '#e2e8f0' : '#e2e8f0'),
                                scale: idx === 2 && currentStep === 2 ? 1.05 : 1
                            }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border relative overflow-hidden",
                                idx <= currentStep
                                    ? "shadow-lg shadow-violet-600/20"
                                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900",
                                idx === 2 && currentStep < 2 && "opacity-50 grayscale border-dashed", // Locked state
                                idx === 2 && currentStep === 2 && "ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 shadow-emerald-500/30" // Active glow
                            )}>
                            {/* Shimmer effect for active Submit step */}
                            {idx === 2 && currentStep === 2 && (
                                <motion.div
                                    className="absolute inset-0 bg-white/20"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                />
                            )}

                            {idx < currentStep ? (
                                <Check className="w-3 h-3" />
                            ) : (
                                <span className={cn(
                                    "w-4 h-4 flex items-center justify-center rounded-full text-[9px]",
                                    idx === currentStep ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                                )}>
                                    {idx + 1}
                                </span>
                            )}
                            <span>{step.label}</span>
                        </motion.div>
                        {idx < steps.length - 1 && (
                            <div className={cn(
                                "w-8 h-0.5 mx-2 rounded-full transition-colors duration-500",
                                idx < currentStep ? "bg-violet-600" : "bg-slate-200 dark:bg-slate-800"
                            )} />
                        )}
                    </div>
                ))}
            </div>
            <p className="mt-4 text-xs text-slate-400 font-medium">
                {currentStep === 0 && "Link your repository to start"}
                {currentStep === 1 && "Upload required documents"}
                {currentStep === 2 && "Ready for submission!"}
                {currentStep === 3 && "Submission Complete"}
            </p>
        </div>
    )
}

// --- Enhanced Input Components ---

export const RepoChip = ({ url }: { url: string }) => {
    try {
        const clean = url.replace('https://github.com/', '').replace('github.com/', '');
        const [owner, repo] = clean.split('/');
        if (!owner || !repo) return null;

        return (
            <div className="absolute right-3 top-2.5 flex items-center gap-2 px-2 py-1 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-bold border border-violet-100 dark:border-violet-500/20 animate-in fade-in slide-in-from-left-2">
                <span className="opacity-75">{owner}</span>
                <span className="opacity-30">/</span>
                <span>{repo}</span>
                <CheckCircle className="w-3 h-3 ml-1 text-emerald-500" />
            </div>
        );
    } catch (e) {
        return null;
    }
};
