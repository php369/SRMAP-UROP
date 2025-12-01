/**
 * Loading component for lazy-loaded pages
 */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <p className="text-textSecondary text-sm">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Minimal loading component for smaller sections
 */
export function InlineLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
