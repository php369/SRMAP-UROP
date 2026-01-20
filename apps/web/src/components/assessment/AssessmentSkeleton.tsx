import { Skeleton } from "../ui/skeleton";

export function AssessmentSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-10 w-48 bg-amber-500/10" />
                <Skeleton className="h-4 w-64 bg-slate-200/60 dark:bg-slate-700/60" />
            </div>

            {/* Content Skeletons */}
            <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white/5 backdrop-blur-sm">
                        <div className="flex justify-between items-start">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                    <Skeleton className="h-6 w-40" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-20 rounded-full" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-24 rounded-full" />
                        </div>

                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Skeleton className="h-24 w-full rounded-2xl" />
                                <Skeleton className="h-24 w-full rounded-2xl" />
                                <Skeleton className="h-24 w-full rounded-2xl" />
                            </div>

                            <div className="space-y-3">
                                <Skeleton className="h-6 w-32" />
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function FacultyAssessmentSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-10 w-64 bg-amber-500/10" />
                <Skeleton className="h-4 w-48 bg-slate-200/60 dark:bg-slate-700/60" />
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-32" />
            </div>

            <div className="grid gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center bg-white/5">
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-5 w-24 rounded-full" />
                            </div>
                            <div className="flex gap-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}
