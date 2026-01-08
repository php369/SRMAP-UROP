import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { cn } from '../../utils/cn';
import {
  SearchIcon, HomeIcon, FileTextIcon, UploadIcon,
  UsersIcon, BarChart3Icon, LogOutIcon, MoonIcon
} from './Icons';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'actions' | 'settings';
  keywords: string[];
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // Define available commands
  const commands: Command[] = [
    // Navigation commands
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View your main dashboard',
      icon: <HomeIcon size={16} />,
      action: () => navigate('/dashboard'),
      category: 'navigation',
      keywords: ['dashboard', 'home', 'main'],
      shortcut: 'Ctrl+D',
    },
    {
      id: 'nav-assessments',
      label: 'Go to Assessments',
      description: 'View and manage assessments',
      icon: <FileTextIcon size={16} />,
      action: () => navigate('/dashboard/assessments'),
      category: 'navigation',
      keywords: ['assessments', 'assignments', 'tasks'],
      shortcut: 'Ctrl+A',
    },
    {
      id: 'nav-submissions',
      label: 'Go to Submissions',
      description: 'View your submissions',
      icon: <UploadIcon size={16} />,
      action: () => navigate('/dashboard/submissions'),
      category: 'navigation',
      keywords: ['submissions', 'uploads', 'files'],
      shortcut: 'Ctrl+S',
    },
    // Admin commands (only for admin users)
    ...(user?.role === 'admin' ? [
      {
        id: 'nav-admin-users',
        label: 'Manage Users',
        description: 'Admin: Manage system users',
        icon: <UsersIcon size={16} />,
        action: () => navigate('/admin/users'),
        category: 'navigation' as const,
        keywords: ['admin', 'users', 'manage'],
      },
      {
        id: 'nav-admin-reports',
        label: 'View Reports',
        description: 'Admin: View system reports',
        icon: <BarChart3Icon size={16} />,
        action: () => navigate('/admin/reports'),
        category: 'navigation' as const,
        keywords: ['admin', 'reports', 'analytics'],
      },
    ] : []),
    // Action commands
    {
      id: 'action-logout',
      label: 'Sign Out',
      description: 'Sign out of your account',
      icon: <LogOutIcon size={16} />,
      action: () => logout(),
      category: 'actions',
      keywords: ['logout', 'sign out', 'exit'],
    },
    // Settings commands
    {
      id: 'settings-theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      icon: <MoonIcon size={16} />,
      action: () => {
        // This would be handled by the theme toggle
        document.dispatchEvent(new CustomEvent('toggle-theme'));
      },
      category: 'settings',
      keywords: ['theme', 'dark', 'light', 'mode'],
      shortcut: 'Ctrl+T',
    },
  ];

  // Filter commands based on query
  const filteredCommands = commands.filter(command => {
    const searchTerm = query.toLowerCase();
    return (
      command.label.toLowerCase().includes(searchTerm) ||
      command.description?.toLowerCase().includes(searchTerm) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Actions',
    settings: 'Settings',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" className="!max-w-2xl">
      <div className="p-0">
        {/* Search input */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textSecondary" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-transparent border-none outline-none text-text placeholder:text-textSecondary text-lg"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Badge variant="glass" size="sm">
                ESC
              </Badge>
            </div>
          </div>
        </div>

        {/* Commands list */}
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-textSecondary/10 rounded-full flex items-center justify-center">
                <SearchIcon className="w-8 h-8 text-textSecondary" />
              </div>
              <p className="text-textSecondary">No commands found</p>
              <p className="text-sm text-textSecondary/70 mt-1">
                Try searching for something else
              </p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-4 py-2 text-xs font-medium text-textSecondary uppercase tracking-wider">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </div>
                  {categoryCommands.map((command) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={command.id}
                        onClick={() => {
                          command.action();
                          onClose();
                        }}
                        className={cn(
                          'w-full flex items-center px-4 py-3 text-left hover:bg-white/10 transition-colors',
                          isSelected && 'bg-primary/20 border-r-2 border-primary'
                        )}
                      >
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-textSecondary">
                          {command.icon}
                        </div>
                        <div className="flex-1 ml-3 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-text truncate">
                              {command.label}
                            </p>
                            {command.shortcut && (
                              <Badge variant="glass" size="sm" className="ml-2">
                                {command.shortcut}
                              </Badge>
                            )}
                          </div>
                          {command.description && (
                            <p className="text-xs text-textSecondary truncate">
                              {command.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-xs text-textSecondary">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Badge variant="glass" size="sm">↑↓</Badge>
                <span>Navigate</span>
              </div>
              <div className="flex items-center space-x-1">
                <Badge variant="glass" size="sm">↵</Badge>
                <span>Select</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Badge variant="glass" size="sm">Ctrl+K</Badge>
              <span>to open</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Icon components

