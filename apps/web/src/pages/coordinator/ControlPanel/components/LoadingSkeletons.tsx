
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function WindowsListSkeleton() {
    return (
        <div className="space-y-8">
            {/* Header / Toggle Skeleton */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-24" />
            </div>

            {/* Project Type Groups */}
            {[1, 2, 3].map((groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                    {/* Group Header */}
                    <div className="flex items-center space-x-3 mb-2">
                        <Skeleton className="h-8 w-20 rounded-md" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>

                    {/* Cards Grid */}
                    <div className="space-y-3">
                        {[1, 2].map((cardIndex) => (
                            <div
                                key={cardIndex}
                                className="p-5 border border-slate-100 rounded-xl bg-white shadow-sm flex flex-col md:flex-row gap-4"
                            >
                                {/* Content */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-5 rounded-full" />
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                    </div>
                                    <div className="space-y-2 pl-7">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 self-end md:self-start">
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function EvaluatorListSkeleton() {
    return (
        <div className="space-y-6">
            {/* Cards Grid */}
            <div className="grid gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6"
                    >
                        {/* Left Info */}
                        <div className="flex-1 w-full space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full rounded-lg" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function WizardSkeleton() {
    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-8 max-w-7xl mx-auto p-6 md:p-8 overflow-hidden">
            {/* Sidebar Skeleton */}
            <div className="w-full md:w-80 flex-shrink-0 flex flex-col h-full bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                <div className="mb-8 space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
                <div className="p-8 border-b border-slate-100 space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>

                <div className="flex-1 p-8">
                    <div className="grid md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-48 w-full rounded-xl" />
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        </div>
    );
}
