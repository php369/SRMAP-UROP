import { useEffect, ReactNode } from 'react';
import { resetToLightTheme, restoreThemeFromStorage } from '../../utils/theme-reset';
import '../../styles/login.css';

interface LoginLayoutProps {
  children: ReactNode;
}

export function LoginLayout({ children }: LoginLayoutProps) {
  useEffect(() => {
    // Force light theme for login page
    resetToLightTheme();
    
    return () => {
      // Restore theme when leaving login page
      restoreThemeFromStorage();
    };
  }, []);

  return (
    <div className="login-container theme-transition">
      {/* Background decoration using earth-toned palette */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: 'var(--tussock)' }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: 'var(--sycamore)' }}
        />
      </div>
      
      {children}
    </div>
  );
}