import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  ROUTES,
} from '../../utils/constants';
import { LoginLayout } from '../../components/auth/LoginLayout';


export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    // Force light mode for login page
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    
    // Debug auth configuration in development
    if (import.meta.env.DEV) {
      console.log('🔐 Login page loaded in development mode');
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
      // Don't remove the light class on cleanup as user might navigate away
    };
  }, []);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  const handleGoogleLogin = () => {
    // Check if we have the required configuration
    if (!GOOGLE_CLIENT_ID) {
      console.error('Google Client ID is not configured');
      alert(
        'Authentication is not properly configured. Please contact support.'
      );
      return;
    }

    // Add a random state parameter for security and to avoid caching issues
    const state = Math.random().toString(36).substring(2, 15);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account', // Changed from 'consent' to reduce rate limiting
      state: state,
      include_granted_scopes: 'true',
    });

    // Store state and remember preference for after login
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('remember_me', rememberMe.toString());

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <LoginLayout>
      <div className="login-card">
        <div className="login-header">
          <img
            src="/branding/srm-logo.svg"
            alt="SRM University-AP"
            className="login-logo"
          />
          <h1 className="login-title">
            SRM-AP Project Management Portal
          </h1>
        </div>

        <div className="login-form">
          {/* Remember Me Option */}
          <div className="remember-me-container">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="remember-me-checkbox"
            />
            <label htmlFor="remember-me" className="remember-me-label">
              Keep me signed in
            </label>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="google-login-button"
          >
            <svg className="google-icon" viewBox="0 0 24 24">
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
            Continue with Google
          </button>

          {/* Information note */}
          <div className="access-requirements-note">
            <div className="flex items-start space-x-3">
              <svg className="access-requirements-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="access-requirements-content">
                <p className="access-requirements-title">Access Requirements</p>
                <p className="access-requirements-text">Only eligible SRM University-AP students and faculties with official @srmap.edu.in email addresses can access this portal.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LoginLayout>
  );
}
