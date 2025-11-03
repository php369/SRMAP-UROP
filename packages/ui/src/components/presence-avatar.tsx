import { cn } from '../utils/cn';

interface PresenceAvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
  showStatus?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

const statusClasses = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500'
};

export function PresenceAvatar({
  src,
  alt = 'Avatar',
  size = 'md',
  status = 'offline',
  className,
  showStatus = true
}: PresenceAvatarProps) {
  return (
    <div className={cn("relative inline-block", className)}>
      <div className={cn(
        "rounded-full overflow-hidden bg-gray-200 flex items-center justify-center",
        sizeClasses[size]
      )}>
        {src ? (
          <img 
            src={src} 
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            {alt.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      {showStatus && (
        <div className={cn(
          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
          statusClasses[status]
        )} />
      )}
    </div>
  );
}