import { useState } from 'react';
import { GlassCard, GlowButton, Input, Badge, Modal } from '../../components/ui';
import { useTheme } from '../../hooks/ui/useTheme';

export function DesignSystemPage() {
  const { toggleTheme, isDark, colors } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-text mb-4">Design System Showcase</h1>
        <p className="text-textSecondary">
          Explore the glassmorphism design system components
        </p>
      </div>

      {/* Theme Toggle */}
      <div className="flex justify-center">
        <GlowButton onClick={toggleTheme} glow>
          Switch to {isDark ? 'Light' : 'Dark'} Mode
        </GlowButton>
      </div>

      {/* Color Palette */}
      <GlassCard variant="elevated" className="p-6">
        <h2 className="text-2xl font-semibold text-text mb-4">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(colors).map(([name, color]) => (
            <div key={name} className="text-center">
              <div 
                className="w-16 h-16 rounded-xl mx-auto mb-2 border border-white/20"
                style={{ backgroundColor: color }}
              />
              <p className="text-sm font-medium text-text capitalize">{name}</p>
              <p className="text-xs text-textSecondary">{color}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard variant="subtle" className="p-6">
          <h3 className="text-lg font-semibold text-text mb-2">Subtle Glass</h3>
          <p className="text-textSecondary">Low opacity glassmorphism effect</p>
        </GlassCard>
        
        <GlassCard variant="default" className="p-6">
          <h3 className="text-lg font-semibold text-text mb-2">Default Glass</h3>
          <p className="text-textSecondary">Standard glassmorphism effect</p>
        </GlassCard>
        
        <GlassCard variant="elevated" className="p-6">
          <h3 className="text-lg font-semibold text-text mb-2">Elevated Glass</h3>
          <p className="text-textSecondary">Enhanced glassmorphism with more depth</p>
        </GlassCard>
      </div>

      {/* Buttons */}
      <GlassCard variant="default" className="p-6">
        <h2 className="text-2xl font-semibold text-text mb-4">Glow Buttons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlowButton variant="primary" glow>Primary</GlowButton>
          <GlowButton variant="secondary" glow>Secondary</GlowButton>
          <GlowButton variant="accent" glow>Accent</GlowButton>
          <GlowButton variant="ghost">Ghost</GlowButton>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4">
          <GlowButton variant="primary" size="sm">Small</GlowButton>
          <GlowButton variant="primary" size="md">Medium</GlowButton>
          <GlowButton variant="primary" size="lg">Large</GlowButton>
        </div>
      </GlassCard>

      {/* Badges */}
      <GlassCard variant="default" className="p-6">
        <h2 className="text-2xl font-semibold text-text mb-4">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="glass">Glass</Badge>
        </div>
      </GlassCard>

      {/* Inputs */}
      <GlassCard variant="default" className="p-6">
        <h2 className="text-2xl font-semibold text-text mb-4">Input Fields</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Default Input"
            placeholder="Enter text..."
            variant="default"
          />
          <Input 
            label="Glass Input"
            placeholder="Enter text..."
            variant="glass"
          />
          <Input 
            label="Input with Error"
            placeholder="Enter text..."
            error="This field is required"
            variant="default"
          />
          <Input 
            label="Input with Helper"
            placeholder="Enter text..."
            helperText="This is helper text"
            variant="glass"
          />
        </div>
      </GlassCard>

      {/* Modal Demo */}
      <GlassCard variant="default" className="p-6">
        <h2 className="text-2xl font-semibold text-text mb-4">Modal</h2>
        <GlowButton onClick={() => setIsModalOpen(true)}>
          Open Modal
        </GlowButton>
        
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Design System Modal"
          size="md"
        >
          <div className="p-6">
            <p className="text-textSecondary mb-4">
              This is a glassmorphism modal with backdrop blur and elegant styling.
            </p>
            <div className="flex justify-end space-x-2">
              <GlowButton 
                variant="ghost" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </GlowButton>
              <GlowButton 
                variant="primary" 
                onClick={() => setIsModalOpen(false)}
                glow
              >
                Confirm
              </GlowButton>
            </div>
          </div>
        </Modal>
      </GlassCard>
    </div>
  );
}
