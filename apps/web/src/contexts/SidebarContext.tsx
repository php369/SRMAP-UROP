import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
      if (stored !== null) {
        setIsCollapsed(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load sidebar state from localStorage:', error);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, JSON.stringify(isCollapsed));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, [isCollapsed]);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}