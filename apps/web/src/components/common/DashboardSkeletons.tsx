import { Skeleton } from '../ui/skeleton';

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8 p-6 w-full animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="space-y-4 w-full md:w-1/2">
          <Skeleton className="h-10 w-2/3 md:w-3/4 max-w-sm rounded-lg" />
          <Skeleton className="h-4 w-1/2 md:w-1/3 rounded-lg" />
        </div>
        <div className="w-full md:w-auto mt-4 md:mt-0 flex justify-end">
          <Skeleton className="h-12 w-32 rounded-xl" />
        </div>
      </div>

      {/* Stats/Summary Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-1/2 mb-2 rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton - Two Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-sm min-h-[300px]">
             <div className="flex justify-between items-center mb-6">
               <Skeleton className="h-6 w-1/3 rounded-lg" />
               <Skeleton className="h-8 w-24 rounded-lg" />
             </div>
             <div className="space-y-4">
               {[1, 2, 3, 4].map((j) => (
                 <Skeleton key={j} className="h-16 w-full rounded-lg" />
               ))}
             </div>
          </div>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          <div className="bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-sm min-h-[300px]">
             <Skeleton className="h-6 w-1/2 rounded-lg mb-6" />
             <div className="space-y-4">
               <Skeleton className="h-12 w-full rounded-lg" />
               <Skeleton className="h-12 w-full rounded-lg" />
               <Skeleton className="h-12 w-full rounded-lg" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
