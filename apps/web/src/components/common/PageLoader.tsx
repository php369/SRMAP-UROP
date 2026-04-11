import { DashboardPageSkeleton } from './DashboardSkeletons';
import { Loader } from '../ui/Loader';

/**
 * Loading component for lazy-loaded pages
 */
export function PageLoader() {
  return <DashboardPageSkeleton />;
}

/**
 * Minimal loading component for smaller sections
 */
export function InlineLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader size="md" />
    </div>
  );
}
