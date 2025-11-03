import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
  flipOnHover?: boolean;
}

export function FlipCard({ 
  front, 
  back, 
  className, 
  flipOnHover = false 
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    if (!flipOnHover) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleMouseEnter = () => {
    if (flipOnHover) {
      setIsFlipped(true);
    }
  };

  const handleMouseLeave = () => {
    if (flipOnHover) {
      setIsFlipped(false);
    }
  };

  return (
    <div 
      className={cn("relative w-full h-64 perspective-1000", className)}
      onClick={handleFlip}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative w-full h-full preserve-3d cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-lg">
          {front}
        </div>
        
        {/* Back */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-lg rotate-y-180">
          {back}
        </div>
      </motion.div>
    </div>
  );
}