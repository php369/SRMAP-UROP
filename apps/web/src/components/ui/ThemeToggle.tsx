import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'switch' | 'icon';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  variant = 'button',
  showLabel = false,
}) => {
  const { mode, toggleTheme, isLoading } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} ${className} animate-pulse bg-gray-200 rounded-full`} />
    );
  }

  if (variant === 'switch') {
    return (
      <label className={`inline-flex items-center cursor-pointer ${className}`}>
        <input
          type="checkbox"
          className="sr-only"
          checked={mode === 'dark'}
          onChange={toggleTheme}
        />
        <div className="relative">
          <div className={`block w-14 h-8 rounded-full transition-colors duration-300 ${
            mode === 'dark' 
              ? 'bg-gray-600' 
              : 'bg-gray-300'
          }`} />
          <div className={`absolute left-1 top-1 w-6 h-6 rounded-full transition-transform duration-300 flex items-center justify-center ${
            mode === 'dark' 
              ? 'transform translate-x-6 bg-gray-800' 
              : 'bg-white'
          }`}>
            {mode === 'dark' ? (
              <Moon size={12} className="text-yellow-400" />
            ) : (
              <Sun size={12} className="text-yellow-500" />
            )}
          </div>
        </div>
        {showLabel && (
          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        )}
      </label>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-full transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      >
        {mode === 'dark' ? (
          <Sun size={iconSizes[size]} className="text-yellow-400" />
        ) : (
          <Moon size={iconSizes[size]} className="text-gray-600" />
        )}
      </button>
    );
  }

  // Default button variant
  return (
    <button
      onClick={toggleTheme}
      className={`${sizeClasses[size]} ${className} flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      {mode === 'dark' ? (
        <Sun size={iconSizes[size]} className="text-yellow-400" />
      ) : (
        <Moon size={iconSizes[size]} className="text-gray-600" />
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {mode === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};