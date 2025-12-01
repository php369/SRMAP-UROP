/**
 * Virtual List Component
 * Renders only visible items for better performance with large lists
 * 
 * ✅ Package installed: @tanstack/react-virtual
 */

import { ReactNode, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  height?: string | number;
}

export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 50,
  overscan = 5,
  className = '',
  height = '100%',
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * import { VirtualList } from '@/components/common/VirtualList';
 * 
 * function ProjectsPage() {
 *   const { data: projects } = useProjects();
 * 
 *   return (
 *     <VirtualList
 *       items={projects || []}
 *       renderItem={(project) => (
 *         <ProjectCard key={project._id} project={project} />
 *       )}
 *       estimateSize={120}
 *       height="calc(100vh - 200px)"
 *       className="p-4"
 *     />
 *   );
 * }
 */
