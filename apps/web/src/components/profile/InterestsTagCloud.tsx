import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface TagCloudProps {
  interests: string[];
  onTagClick?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
  editable?: boolean;
  maxTags?: number;
  className?: string;
}



export function InterestsTagCloud({
  interests,
  onTagClick,
  onTagRemove,
  editable = false,
  maxTags = 50,
  className,
}: TagCloudProps) {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');

  // Color palette for tags
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
  ];

  // Calculate tag weights based on frequency (mock implementation)
  const tagWeights = useMemo(() => {
    const weights: Record<string, number> = {};
    interests.forEach(tag => {
      // Mock weight calculation - in real app this could be based on usage, endorsements, etc.
      weights[tag] = Math.random() * 5 + 1;
    });
    return weights;
  }, [interests]);

  // Generate tag cloud data
  const tagCloudData = useMemo(() => {
    const filteredInterests = interests
      .filter(tag => 
        tag.toLowerCase().includes(searchFilter.toLowerCase())
      )
      .slice(0, maxTags);

    const maxWeight = Math.max(...Object.values(tagWeights));
    const minWeight = Math.min(...Object.values(tagWeights));

    return filteredInterests.map((tag, index) => {
      const weight = tagWeights[tag] || 1;
      const normalizedWeight = (weight - minWeight) / (maxWeight - minWeight);
      
      return {
        text: tag,
        size: 12 + normalizedWeight * 20, // 12px to 32px
        color: colors[index % colors.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        weight: normalizedWeight,
      };
    });
  }, [interests, tagWeights, searchFilter, maxTags]);

  // Animate tags on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trigger re-render for animation
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleTagClick = (tag: string) => {
    if (editable) {
      setSelectedTags(prev => {
        const newSet = new Set(prev);
        if (newSet.has(tag)) {
          newSet.delete(tag);
        } else {
          newSet.add(tag);
        }
        return newSet;
      });
    }
    onTagClick?.(tag);
  };

  const handleTagRemove = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTagRemove?.(tag);
  };

  const getTagVariants = (index: number) => ({
    hidden: { 
      opacity: 0, 
      scale: 0,
      rotate: Math.random() * 360 - 180,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: {
        delay: index * 0.05,
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    hover: {
      scale: 1.1,
      rotate: Math.random() * 20 - 10,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  });

  if (interests.length === 0) {
    return (
      <GlassCard variant="subtle" className={cn('p-8 text-center', className)}>
        <div className="text-4xl mb-4">🏷️</div>
        <h3 className="text-lg font-medium text-text mb-2">No Interests Added</h3>
        <p className="text-textSecondary">Add your interests and expertise areas to see them visualized.</p>
      </GlassCard>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <GlassCard variant="elevated" className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-text">Interests & Expertise</h3>
            <Badge variant="glass" className="bg-primary">
              {interests.length} tags
            </Badge>
          </div>

          {/* Search Filter */}
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Filter tags..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {editable && selectedTags.size > 0 && (
              <button
                onClick={() => {
                  selectedTags.forEach(tag => onTagRemove?.(tag));
                  setSelectedTags(new Set());
                }}
                className="px-3 py-1.5 bg-error/20 text-error rounded-lg hover:bg-error/30 transition-colors text-sm"
              >
                Remove Selected ({selectedTags.size})
              </button>
            )}
          </div>
        </div>

        {/* Tag Cloud */}
        <div className="relative min-h-96 overflow-hidden rounded-lg bg-gradient-to-br from-surface/30 to-surface/10 p-8">
          <motion.div
            className="relative w-full h-full"
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {tagCloudData.map((tag, index) => (
                <motion.div
                  key={tag.text}
                  className="absolute cursor-pointer select-none"
                  style={{
                    left: `${tag.x}%`,
                    top: `${tag.y}%`,
                    fontSize: `${tag.size}px`,
                    color: tag.color,
                    fontWeight: 500 + tag.weight * 300,
                    transform: 'translate(-50%, -50%)',
                  }}
                  variants={getTagVariants(index)}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover="hover"
                  onClick={() => handleTagClick(tag.text)}
                  onMouseEnter={() => setHoveredTag(tag.text)}
                  onMouseLeave={() => setHoveredTag(null)}
                >
                  <div className={cn(
                    'relative px-2 py-1 rounded-lg transition-all duration-200',
                    hoveredTag === tag.text && 'bg-surface/50 backdrop-blur-sm',
                    selectedTags.has(tag.text) && 'bg-primary/20 ring-2 ring-primary/50',
                    editable && 'hover:bg-surface/30'
                  )}>
                    {tag.text}
                    
                    {editable && hoveredTag === tag.text && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => handleTagRemove(tag.text, e)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center text-xs hover:bg-error/80 transition-colors"
                      >
                        ×
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Hover Info */}
          {hoveredTag && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 p-3 bg-surface/90 backdrop-blur-sm border border-border rounded-lg"
            >
              <h4 className="font-medium text-text">{hoveredTag}</h4>
              <p className="text-sm text-textSecondary">
                Weight: {(tagWeights[hoveredTag] || 1).toFixed(1)}
              </p>
              {editable && (
                <p className="text-xs text-textSecondary mt-1">
                  Click to select • Hover to remove
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Tag Statistics */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-text">{interests.length}</div>
              <div className="text-sm text-textSecondary">Total Tags</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text">
                {Math.max(...Object.values(tagWeights)).toFixed(1)}
              </div>
              <div className="text-sm text-textSecondary">Max Weight</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text">
                {(Object.values(tagWeights).reduce((a, b) => a + b, 0) / Object.values(tagWeights).length).toFixed(1)}
              </div>
              <div className="text-sm text-textSecondary">Avg Weight</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-text">
                {tagCloudData.length}
              </div>
              <div className="text-sm text-textSecondary">Visible</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tag List View */}
      <GlassCard variant="subtle" className="p-6">
        <h4 className="text-md font-semibold text-text mb-4">All Tags</h4>
        <div className="flex flex-wrap gap-2">
          {interests.map((tag) => (
            <button
              key={tag}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium cursor-pointer transition-all duration-200',
                selectedTags.has(tag) ? 'bg-primary text-textPrimary' : 'bg-secondary/50 hover:bg-secondary/70',
                hoveredTag === tag && 'scale-105'
              )}
              onClick={() => handleTagClick(tag)}
              onMouseEnter={() => setHoveredTag(tag)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              {tag}
              {editable && (
                <button
                  onClick={(e) => handleTagRemove(tag, e)}
                  className="ml-2 text-error hover:text-error/80"
                >
                  ×
                </button>
              )}
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
