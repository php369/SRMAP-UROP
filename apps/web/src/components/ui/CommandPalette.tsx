import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { cn } from '../../utils/cn';

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
      icon: <HomeIcon />,
      action: () => navigate('/dashboard'),
      category: 'navigation',
      keywords: ['dashboard', 'home', 'main'],
      shortcut: 'Ctrl+D',
    },
    {
      id: 'nav-assessments',
      label: 'Go to Assessments',
      description: 'View and manage assessments',
      icon: <FileTextIcon />,
      action: () => navigate('/assessments'),
      category: 'navigation',
      keywords: ['assessments', 'assignments', 'tasks'],
      shortcut: 'Ctrl+A',
    },
    {
      id: 'nav-submissions',
      label: 'Go to Submissions',
      description: 'View your submissions',
      icon: <UploadIcon />,
      action: () => navigate('/submissions'),
      category: 'navigation',
      keywords: ['submissions', 'uploads', 'files'],
      shortcut: 'Ctrl+S',
    },
    {
      id: 'nav-profile',
      label: 'Go to Profile',
      description: 'Manage your profile',
      icon: <UserIcon />,
      action: () => navigate('/profile'),
      category: 'navigation',
      keywords: ['profile', 'account', 'settings'],
      shortcut: 'Ctrl+P',
    },
    // Admin commands (only for admin users)
    ...(user?.role === 'admin' ? [
      {
        id: 'nav-admin-users',
        label: 'Manage Users',
        description: 'Admin: Manage system users',
        icon: <UsersIcon />,
        action: () => navigate('/admin/users'),
        category: 'navigation' as const,
        keywords: ['admin', 'users', 'manage'],
      },
      {
        id: 'nav-admin-reports',
        label: 'View Reports',
        description: 'Admin: View system reports',
        icon: <ChartIcon />,
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
      icon: <LogoutIcon />,
      action: () => logout(),
      category: 'actions',
      keywords: ['logout', 'sign out', 'exit'],
    },
    // Settings commands
    {
      id: 'settings-theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      icon: <ThemeIcon />,
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
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}
