import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { LoginLayout } from '../../components/auth/LoginLayout';
import { ROUTES } from '../../utils/constants';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setError('Authentication was cancelled or failed');
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        await login({ code, state: state || undefined });
        navigate(ROUTES.DASHBOARD, { replace: true });
      } catch (err) {
        console.error('Login failed:', err);
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <LoginLayout>
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-red-500 text-lg font-medium">Authentication Failed</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
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
