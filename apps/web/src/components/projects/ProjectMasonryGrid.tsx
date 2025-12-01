import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../../types';
import { ProjectCard } from './ProjectCard';
import { cn } from '../../utils/cn';

interface ProjectMasonryGridProps {
  projects: Project[];
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onStatusChange?: (projectId: string, status: Project['status']) => void;
  columns?: number;
  gap?: number;
  className?: string;
}

export function ProjectMasonryGrid({
  projects,
  onEdit,
  onDelete,
  onStatusChange,
  columns = 3,
  gap = 24,
  className,
}: ProjectMasonryGridProps) {
  const [columnHeights, setColumnHeights] = useState<number[]>([]);
  const [itemPositions, setItemPositions] = useState<{ x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Calculate responsive columns
  const getResponsiveColumns = () => {
    if (typeof window === 'undefined') return columns;
    
    const width = window.innerWidth;
    if (width < 640) return 1; // sm
    if (width < 1024) return 2; // md
    if (width < 1280) return Math.min(3, columns); // lg
    return columns; // xl and above
  };

  const [responsiveColumns, setResponsiveColumns] = useState(getResponsiveColumns);

  useEffect(() => {
    const handleResize = () => {
      setResponsiveColumns(getResponsiveColumns());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [columns]);

  // Calculate masonry layout
  useEffect(() => {
    if (!containerRef.current || projects.length === 0) return;

    const containerWidth = containerRef.current.offsetWidth;
    const columnWidth = (containerWidth - gap * (responsiveColumns - 1)) / responsiveColumns;
    
    // Initialize column heights
    const heights = new Array(responsiveColumns).fill(0);
    const positions: { x: number; y: number }[] = [];

    projects.forEach((_, index) => {
      const itemRef = itemRefs.current[index];
      if (!itemRef) return;

      // Find the shortest column
      const shortestColumnIndex = heights.indexOf(Math.min(...heights));
      
      // Calculate position
      const x = shortestColumnIndex * (columnWidth + gap);
      const y = heights[shortestColumnIndex];
      
      positions.push({ x, y });
      
      // Update column height (using a fixed height for now, could be dynamic)
      heights[shortestColumnIndex] += 320 + gap; // 320px is the card height + gap
    });

    setColumnHeights(heights);
    setItemPositions(positions);
  }, [projects, responsiveColumns, gap]);

  const containerHeight = Math.max(...columnHeights);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -50,
      transition: {
        duration: 0.3,
      },
    },
  };

  if (projects.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-text mb-2">No Projects Found</h3>
        <p className="text-textSecondary">
          Create your first project or adjust your filters to see projects here.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className={cn('relative w-full', className)}
      style={{ height: containerHeight }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {projects.map((project, index) => {
          const position = itemPositions[index];
          if (!position) return null;

          return (
            <motion.div
              key={project.id}
              ref={(el) => (itemRefs.current[index] = el)}
              className="absolute w-full"
              style={{
                left: position.x,
                top: position.y,
                width: `calc((100% - ${gap * (responsiveColumns - 1)}px) / ${responsiveColumns})`,
              }}
              variants={itemVariants}
              layout
              layoutId={project.id}
            >
              <ProjectCard
                project={project}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
