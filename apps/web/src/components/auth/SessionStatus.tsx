import { useEffect, useState } from 'react';
import { persistentAuth } from '../../utils/persistent-auth';

interface SessionStatusProps {
  className?: string;
}

export function SessionStatus({ className = '' }: SessionStatusProps) {
  const [sessionInfo, setSessionInfo] = useState<{
    hasSession: boolean;
    expiresAt?: Date;
    rememberMe?: boolean;
  }>({ hasSession: false });

  useEffect(() => {
    const updateSessionInfo = () => {
      const session = persistentAuth.getCurrentSession();
      if (session) {
        setSessionInfo({
          hasSession: true,
          expiresAt: new Date(session.expiresAt),
          rememberMe: session.rememberMe,
        });
      } else {
        setSessionInfo({ hasSession: false });
      }
    };

    updateSessionInfo();

    // Update every minute
    const interval = setInterval(updateSessionInfo, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!sessionInfo.hasSession || !sessionInfo.expiresAt) {
    return null;
  }

  const daysUntilExpiry = Math.ceil(
    (sessionInfo.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`text-xs text-textSecondary ${className}`}>
      {sessionInfo.rememberMe ? (
        <span>
          ✅ Signed in for {daysUntilExpiry} more days
        </span>
      ) : (
        <span>
          🔒 Session expires when browser closes
        </span>
      )}
    </div>
  );
}