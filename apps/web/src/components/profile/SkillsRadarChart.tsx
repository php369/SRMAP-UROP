import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserSkill } from '../../types';
import { GlassCard, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface SkillsRadarChartProps {
  skills: UserSkill[];
  selectedCategory?: string;
  onCategoryChange?: (category: string | undefined) => void;
  className?: string;
}

export function SkillsRadarChart({
  skills,
  selectedCategory,
  onCategoryChange,
  className,
}: SkillsRadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredSkill] = useState<UserSkill | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  const categories = ['technical', 'soft', 'language', 'domain'] as const;
  const categoryColors = {
    technical: '#3B82F6',
    soft: '#10B981',
    language: '#F59E0B',
    domain: '#8B5CF6',
  };

  // Filter skills by category if selected
  const filteredSkills = selectedCategory
    ? skills.filter(skill => skill.category === selectedCategory)
    : skills;

  // Take top 8 skills for radar chart
  const radarSkills = filteredSkills
    .sort((a, b) => b.level - a.level)
    .slice(0, 8);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || radarSkills.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = size * 0.35;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Draw concentric circles
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (maxRadius * i) / 5, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw axes
    const angleStep = (2 * Math.PI) / radarSkills.length;
    radarSkills.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * maxRadius;
      const y = centerY + Math.sin(angle) * maxRadius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // Draw skill labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    radarSkills.forEach((skill, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelRadius = maxRadius + 20;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;

      // Adjust text alignment based on position
      if (Math.cos(angle) > 0.1) {
        ctx.textAlign = 'left';
      } else if (Math.cos(angle) < -0.1) {
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'center';
      }

      ctx.fillText(skill.name, x, y);
    });

    // Draw skill polygon with animation
    if (animationProgress > 0) {
      ctx.beginPath();
      ctx.strokeStyle = selectedCategory 
        ? categoryColors[selectedCategory as keyof typeof categoryColors]
        : '#3B82F6';
      ctx.fillStyle = selectedCategory 
        ? `${categoryColors[selectedCategory as keyof typeof categoryColors]}20`
        : '#3B82F620';
      ctx.lineWidth = 2;

      radarSkills.forEach((skill, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const radius = (maxRadius * skill.level * animationProgress) / 10;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw skill points
      radarSkills.forEach((skill, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const radius = (maxRadius * skill.level * animationProgress) / 10;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = skill.verified ? '#10B981' : '#3B82F6';
        ctx.fill();
        
        if (skill.verified) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    }

    // Draw level indicators
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 2; i <= 10; i += 2) {
      const radius = (maxRadius * i) / 10;
      ctx.fillText(i.toString(), centerX + radius + 5, centerY - 5);
    }
  }, [radarSkills, animationProgress, selectedCategory]);

  // Animate on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Reset animation when category changes
  useEffect(() => {
    setAnimationProgress(0);
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedCategory]);

  const getSkillsByCategory = (category: string) => {
    return skills.filter(skill => skill.category === category);
  };

  const getCategoryStats = (category: string) => {
    const categorySkills = getSkillsByCategory(category);
    const avgLevel = categorySkills.length > 0 
      ? categorySkills.reduce((sum, skill) => sum + skill.level, 0) / categorySkills.length
      : 0;
    const verifiedCount = categorySkills.filter(skill => skill.verified).length;
    
    return { count: categorySkills.length, avgLevel, verifiedCount };
  };

  if (skills.length === 0) {
    return (
      <GlassCard variant="subtle" className={cn('p-8 text-center', className)}>
        <div className="text-4xl mb-4">🎯</div>
        <h3 className="text-lg font-medium text-text mb-2">No Skills Added</h3>
        <p className="text-textSecondary">Add your skills to see a radar chart visualization.</p>
      </GlassCard>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <GlassCard variant="elevated" className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-text">Skills Radar</h3>
            <Badge variant="glass" className="bg-primary">
              {filteredSkills.length} skills
            </Badge>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onCategoryChange?.(undefined)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                !selectedCategory
                  ? 'bg-primary text-textPrimary'
                  : 'bg-surface text-textSecondary hover:text-text'
              )}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange?.(category)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
                  selectedCategory === category
                    ? 'text-white'
                    : 'bg-surface text-textSecondary hover:text-text'
                )}
                style={{
                  backgroundColor: selectedCategory === category 
                    ? categoryColors[category] 
                    : undefined
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="relative">
          <motion.canvas
            ref={canvasRef}
            className="w-full h-96 max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Hover tooltip */}
          {hoveredSkill && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 right-4 p-3 bg-surface/90 backdrop-blur-sm border border-border rounded-lg"
            >
              <h4 className="font-medium text-text">{hoveredSkill.name}</h4>
              <p className="text-sm text-textSecondary">Level: {hoveredSkill.level}/10</p>
              {hoveredSkill.verified && (
                <p className="text-xs text-success">✓ Verified</p>
              )}
              {hoveredSkill.endorsements && (
                <p className="text-xs text-textSecondary">
                  {hoveredSkill.endorsements} endorsements
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-text mb-3">Legend</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm text-textSecondary">Skill Level</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-success rounded-full border-2 border-white"></div>
              <span className="text-sm text-textSecondary">Verified</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-border rounded-full"></div>
              <span className="text-sm text-textSecondary">Grid Lines (2, 4, 6, 8, 10)</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Category Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => {
          const stats = getCategoryStats(category);
          return (
            <GlassCard key={category} variant="subtle" className="p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoryColors[category] }}
                />
                <h4 className="font-medium text-text capitalize">{category}</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-textSecondary">Skills:</span>
                  <span className="text-text">{stats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Avg Level:</span>
                  <span className="text-text">{stats.avgLevel.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textSecondary">Verified:</span>
                  <span className="text-success">{stats.verifiedCount}</span>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
