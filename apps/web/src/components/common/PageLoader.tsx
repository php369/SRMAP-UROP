import { Loader } from '../ui/Loader';

/**
 * Loading component for lazy-loaded pages
 */
export function PageLoader() {
  return (
    <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
      <Loader size="lg" text="Loading..." />
    </div>
  );
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
