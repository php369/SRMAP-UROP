import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoginLayout } from '../../components/auth/LoginLayout';
import { ROUTES } from '../../utils/constants';
import { CheckCircle2, XCircle, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthError {
  message: string;
  guidance?: string;
  code?: string;
  details?: any;
}

type AuthState = 'authenticating' | 'success' | 'error';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [authState, setAuthState] = useState<AuthState>('authenticating');
  const [error, setError] = useState<AuthError | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const urlError = searchParams.get('error');

      if (urlError) {
        setAuthState('error');
        setError({
          message: 'Authentication was cancelled or failed',
          guidance: 'Please try signing in again',
          code: 'AUTH_CANCELLED'
        });
        return;
      }

      if (!code) {
        setAuthState('error');
        setError({
          message: 'No authorization code received',
          guidance: 'Please try signing in again',
          code: 'NO_CODE'
        });
        return;
      }

      try {
        await login({ code, state: state || undefined });

        // Show success state for 3 seconds before redirecting
        setAuthState('success');

        setTimeout(() => {
          navigate(ROUTES.DASHBOARD, { replace: true });
        }, 3000);

      } catch (err) {
        console.error('Login failed:', err);
        setAuthState('error');

        // Parse error response to extract user-friendly messages
        let errorMessage = 'Login failed';
        let guidance: string | undefined;
        let code: string | undefined;
        let details: any;

        if (err instanceof Error) {
          try {
            // Try to parse JSON error response
            const errorData = JSON.parse(err.message);
            if (errorData.error) {
              errorMessage = errorData.error.message || errorMessage;
              guidance = errorData.error.guidance;
              code = errorData.error.code;
              details = errorData.error.details;
            }
          } catch {
            // If not JSON, use the error message directly
            errorMessage = err.message;
          }
        }

        setError({
          message: errorMessage,
          guidance,
          code,
          details
        });
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  return (
    <LoginLayout>
      <div className="w-full max-w-md mx-auto min-h-[400px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {authState === 'authenticating' && (
            <motion.div
              key="authenticating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-8"
            >
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src="/branding/srm-icon.svg" alt="SRM" className="w-10 h-10 opacity-50" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">Verifying Credentials</h2>
                <p className="text-slate-500">Please wait while we securely sign you in...</p>
              </div>
            </motion.div>
          )}

          {authState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-8"
            >
              <div className="relative w-24 h-24 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-green-500 opacity-20"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1.2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Welcome Back!</h2>
                <p className="text-slate-500">Successfully authenticated. Redirecting to dashboard...</p>
              </div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3 }}
                className="h-1 bg-green-100 rounded-full overflow-hidden max-w-[200px] mx-auto"
              >
                <div className="h-full bg-green-500 w-full origin-left" />
              </motion.div>
            </motion.div>
          )}

          {authState === 'error' && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full text-center"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-red-50/50 p-8 border-b border-red-100">
                  <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50">
                    <ShieldAlert className="w-10 h-10 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-red-900 mb-2">Authentication Failed</h2>
                  <p className="text-red-600 font-medium">{error.message}</p>
                </div>

                <div className="p-8 space-y-6">
                  {error.guidance && (
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl text-left border border-slate-100">
                      <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">Suggestion</p>
                        <p className="text-sm text-slate-600 leading-relaxed">{error.guidance}</p>
                      </div>
                    </div>
                  )}

                  {error.details && (
                    <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-hidden">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Error Details</p>
                      <pre className="text-xs text-slate-600 overflow-x-auto font-mono">
                        {JSON.stringify(error.details, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => window.location.href = ROUTES.LOGIN}
                      className="group w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-200 active:scale-[0.98]"
                    >
                      <span>Try Signing In Again</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>

                    {error.code === 'DOMAIN_RESTRICTION_FAILED' && (
                      <p className="mt-4 text-xs text-slate-400">
                        Must use an @srmap.edu.in email address
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LoginLayout>
  );
}
