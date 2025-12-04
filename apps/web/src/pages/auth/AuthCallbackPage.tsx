import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { LoginLayout } from '../../components/auth/LoginLayout';
import { ROUTES } from '../../utils/constants';

interface AuthError {
  message: string;
  guidance?: string;
  code?: string;
}

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<AuthError | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (isProcessing) return;
    
    const handleCallback = async () => {
      setIsProcessing(true);
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const urlError = searchParams.get('error');

      if (urlError) {
        setError({
          message: 'Authentication was cancelled or failed',
          guidance: 'Please try signing in again',
        });
        return;
      }

      if (!code) {
        setError({
          message: 'No authorization code received',
          guidance: 'Please try signing in again',
        });
        return;
      }

      try {
        await login({ code, state: state || undefined });

        // Note: The user state will be updated by the login function
        // We'll redirect to the default dashboard route for now
        // The AppLayout or dashboard will handle role-specific routing
        navigate(ROUTES.DASHBOARD, { replace: true });
      } catch (err) {
        console.error('Login failed:', err);

        // Parse error response to extract user-friendly messages
        let errorMessage = 'Login failed';
        let guidance: string | undefined;
        let code: string | undefined;

        if (err instanceof Error) {
          try {
            // Try to parse JSON error response
            const errorData = JSON.parse(err.message);
            if (errorData.error) {
              errorMessage = errorData.error.message || errorMessage;
              guidance = errorData.error.guidance;
              code = errorData.error.code;
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
        });
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <LoginLayout>
        <div className="max-w-md w-full text-center space-y-6">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <div className="text-red-600 text-xl font-semibold">
            Access Denied
          </div>

          {/* Error Message */}
          <div className="space-y-3">
            <p className="text-gray-700 text-base leading-relaxed">
              {error.message}
            </p>

            {error.guidance && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    {error.guidance}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary button approach */}
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Go Back button clicked - attempting navigation');
                try {
                  navigate(ROUTES.HOME, { replace: true });
                  console.log('Navigation successful');
                } catch (error) {
                  console.error(
                    'Navigation failed, using window.location:',
                    error
                  );
                  window.location.href = '/';
                }
              }}
              className="w-full px-4 py-3 text-white rounded-lg hover:opacity-90 transition-colors font-medium cursor-pointer relative z-10"
              style={{ backgroundColor: '#c89643', minHeight: '48px' }}
              type="button"
            >
              Go Back
            </button>

            {error.code === 'DOMAIN_RESTRICTION_FAILED' && (
              <div className="text-sm text-gray-500">
                Need help? Contact{' '}
                <a
                  href="mailto:support@srmap.edu.in"
                  className="text-primary hover:underline"
                >
                  support@srmap.edu.in
                </a>
              </div>
            )}

            {error.code === 'NOT_ELIGIBLE' && (
              <div className="text-sm text-gray-500">
                Questions about eligibility? Contact the{' '}
                <a
                  href="mailto:academic.office@srmap.edu.in"
                  className="text-primary hover:underline"
                >
                  Academic Office
                </a>
              </div>
            )}
          </div>
        </div>
      </LoginLayout>
    );
  }

  return (
    <LoginLayout>
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </LoginLayout>
  );
}
