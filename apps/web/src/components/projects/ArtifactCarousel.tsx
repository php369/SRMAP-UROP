import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectArtifact } from '../../types';
import { GlassCard, Badge } from '../ui';
import { cn } from '../../utils/cn';

interface ArtifactCarouselProps {
  artifacts: ProjectArtifact[];
  onArtifactClick?: (artifact: ProjectArtifact) => void;
  className?: string;
}

export function ArtifactCarousel({
  artifacts,
  onArtifactClick,
  className,
}: ArtifactCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const getArtifactIcon = (type: ProjectArtifact['type']) => {
    switch (type) {
      case 'document':
        return '📄';
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'code':
        return '💻';
      case 'link':
        return '🔗';
      default:
        return '📎';
    }
  };

  const getArtifactTypeColor = (type: ProjectArtifact['type']) => {
    switch (type) {
      case 'document':
        return 'bg-blue-500';
      case 'image':
        return 'bg-green-500';
      case 'video':
        return 'bg-red-500';
      case 'code':
        return 'bg-purple-500';
      case 'link':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % artifacts.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + artifacts.length) % artifacts.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsAutoPlaying(false);
    } else {
      intervalRef.current = setInterval(nextSlide, 3000);
      setIsAutoPlaying(true);
    }
  };

  // Get visible artifacts for 3D effect
  const getVisibleArtifacts = () => {
    if (artifacts.length === 0) return [];
    if (artifacts.length === 1) return [{ artifact: artifacts[0], position: 'center' }];
    if (artifacts.length === 2) {
      return [
        { artifact: artifacts[currentIndex], position: 'center' },
        { artifact: artifacts[(currentIndex + 1) % artifacts.length], position: 'right' },
      ];
    }

    return [
      { artifact: artifacts[(currentIndex - 1 + artifacts.length) % artifacts.length], position: 'left' },
      { artifact: artifacts[currentIndex], position: 'center' },
      { artifact: artifacts[(currentIndex + 1) % artifacts.length], position: 'right' },
    ];
  };

  const visibleArtifacts = getVisibleArtifacts();

  if (artifacts.length === 0) {
    return (
      <GlassCard variant="subtle" className={cn('p-8 text-center', className)}>
        <div className="text-4xl mb-4">📎</div>
        <h3 className="text-lg font-medium text-text mb-2">No Artifacts</h3>
        <p className="text-textSecondary">No files or resources have been added to this project yet.</p>
      </GlassCard>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <GlassCard variant="elevated" className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-text">Project Artifacts</h3>
            <Badge variant="glass" className="bg-primary">
              {artifacts.length} files
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAutoPlay}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isAutoPlaying 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-surface text-textSecondary hover:text-text'
              )}
              title={isAutoPlaying ? 'Pause slideshow' : 'Start slideshow'}
            >
              {isAutoPlaying ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>

            {artifacts.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="p-2 bg-surface text-textSecondary hover:text-text rounded-lg transition-colors"
                  title="Previous artifact"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={nextSlide}
                  className="p-2 bg-surface text-textSecondary hover:text-text rounded-lg transition-colors"
                  title="Next artifact"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3D Carousel */}
        <div className="relative h-64 mb-6 perspective-1000">
          <div className="relative w-full h-full preserve-3d">
            <AnimatePresence mode="wait">
              {visibleArtifacts.map(({ artifact, position }) => (
                <motion.div
                  key={`${artifact.id}-${position}`}
                  className="absolute inset-0 cursor-pointer"
                  initial={{ 
                    opacity: 0,
                    rotateY: position === 'left' ? -45 : position === 'right' ? 45 : 0,
                    z: position === 'center' ? 0 : -100,
                    scale: position === 'center' ? 1 : 0.8,
                  }}
                  animate={{ 
                    opacity: position === 'center' ? 1 : 0.6,
                    rotateY: position === 'left' ? -25 : position === 'right' ? 25 : 0,
                    z: position === 'center' ? 0 : -50,
                    scale: position === 'center' ? 1 : 0.85,
                  }}
                  exit={{ 
                    opacity: 0,
                    rotateY: position === 'left' ? -45 : position === 'right' ? 45 : 0,
                    z: -100,
                    scale: 0.8,
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  onClick={() => onArtifactClick?.(artifact)}
                  whileHover={{ scale: position === 'center' ? 1.05 : 0.9 }}
                  whileTap={{ scale: position === 'center' ? 0.95 : 0.8 }}
                >
                  <GlassCard 
                    variant="subtle" 
                    className={cn(
                      'h-full p-6 transition-all duration-300',
                      position === 'center' && 'ring-2 ring-primary/20'
                    )}
                  >
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      {/* Artifact Preview */}
                      <div className="mb-4">
                        {artifact.thumbnail ? (
                          <img 
                            src={artifact.thumbnail} 
                            alt={artifact.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-surface/50 rounded-lg flex items-center justify-center text-4xl">
                            {getArtifactIcon(artifact.type)}
                          </div>
                        )}
                      </div>

                      {/* Artifact Info */}
                      <h4 className="font-medium text-text mb-2 line-clamp-2">
                        {artifact.name}
                      </h4>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge 
                          variant="glass" 
                          size="sm"
                          className={getArtifactTypeColor(artifact.type)}
                        >
                          {artifact.type}
                        </Badge>
                        {artifact.size && (
                          <span className="text-xs text-textSecondary">
                            {formatFileSize(artifact.size)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-textSecondary">
                        {formatDate(artifact.uploadedAt)}
                      </p>

                      {artifact.description && (
                        <p className="text-xs text-textSecondary mt-2 line-clamp-2">
                          {artifact.description}
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Indicators */}
        {artifacts.length > 1 && (
          <div className="flex justify-center space-x-2">
            {artifacts.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === currentIndex 
                    ? 'bg-primary scale-125' 
                    : 'bg-border hover:bg-textSecondary'
                )}
              />
            ))}
          </div>
        )}

        {/* Current Artifact Details */}
        {artifacts[currentIndex] && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 p-4 bg-surface/30 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-text mb-1">
                  {artifacts[currentIndex].name}
                </h4>
                {artifacts[currentIndex].description && (
                  <p className="text-sm text-textSecondary">
                    {artifacts[currentIndex].description}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => window.open(artifacts[currentIndex].url, '_blank')}
                className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm"
              >
                Open
              </button>
            </div>
          </motion.div>
        )}
      </GlassCard>
    </div>
  );
}