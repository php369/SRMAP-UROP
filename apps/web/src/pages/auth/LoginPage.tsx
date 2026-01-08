import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  ROUTES,
} from '../../utils/constants';
import { AuthVisual } from '../../components/auth/AuthVisual';

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    // Force light mode for login page
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');

    // Debug auth configuration
    if (import.meta.env.DEV) {
      console.log('🔐 Login page loaded');
      console.log('Google Client ID:', GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      console.error('Google Client ID is not configured');
      alert('Authentication error. Please contact support.');
      return;
    }

    const state = Math.random().toString(36).substring(2, 15);
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state: state,
      include_granted_scopes: 'true',
    });

    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('remember_me', rememberMe.toString());

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <div className="min-h-screen w-full flex bg-background overflow-hidden relative">
      {/* Texture Overlay for Left Side */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none z-50 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Left Column - Login Form */}
      <div className="w-full lg:w-[480px] xl:w-[560px] flex-shrink-0 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-[#F2F3F5] relative z-10 transition-all duration-500 ease-in-out">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md mx-auto bg-[#F2F3F5] p-10 rounded-3xl shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff]"
        >
          {/* Header */}
          <div className="mb-10 text-center flex flex-col items-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-[#F2F3F5] rounded-2xl flex items-center justify-center shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff]">
                <img src="/branding/srm-icon.svg" alt="SRM" className="w-7 h-7" />
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">SRM University-AP</span>
            </div>

            <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
              Welcome back
            </h1>
            <p className="text-slate-500 text-lg">
              Sign in to manage your projects
            </p>
          </div>

          {/* Login Actions */}
          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#F2F3F5] text-slate-700 rounded-xl font-semibold transition-all duration-300 shadow-[5px_5px_10px_#b8b9be,-5px_-5px_10px_#ffffff] hover:shadow-[inset_5px_5px_10px_#b8b9be,inset_-5px_-5px_10px_#ffffff] active:translate-y-0.5"
            >
              <svg className="w-6 h-6 transition-transform group-hover:scale-110 duration-200" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center justify-center gap-3 select-none group cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all shadow-sm ${rememberMe ? 'bg-primary border-primary shadow-none' : 'bg-transparent border-slate-300'}`}>
                {rememberMe && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Keep me signed in</span>
            </div>
          </div>

        </motion.div>

        {/* Footer - Moved outside card to prevent clipping */}
        <div className="mt-8 w-full max-w-md mx-auto">
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-xs text-slate-400 font-medium text-center">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span>© 2025 SRM-AP</span>
          </div>
        </div>
      </div>

      {/* Right Column - Visual */}
      <div className="hidden lg:flex flex-1 relative bg-slate-50">
        <AuthVisual />
      </div>
    </div>
  );
}
