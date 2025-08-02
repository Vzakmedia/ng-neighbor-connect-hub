import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserPresence } from '@/hooks/useUserPresence';
import { cn } from '@/lib/utils';

interface OnlineAvatarProps {
  userId?: string;
  src?: string;
  fallback: string;
  className?: string;
  showOnlineStatus?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

const dotSizeClasses = {
  sm: 'h-2 w-2 bottom-0 right-0',
  md: 'h-2.5 w-2.5 bottom-0 right-0',
  lg: 'h-3 w-3 bottom-0 right-0', 
  xl: 'h-3.5 w-3.5 bottom-0.5 right-0.5',
};

export const OnlineAvatar: React.FC<OnlineAvatarProps> = ({
  userId,
  src,
  fallback,
  className,
  showOnlineStatus = true,
  size = 'md',
}) => {
  const { isUserOnline } = useUserPresence();
  const isOnline = userId && showOnlineStatus ? isUserOnline(userId) : false;

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={src} />
        <AvatarFallback className={cn(
          'text-xs',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-xs', 
          size === 'lg' && 'text-sm',
          size === 'xl' && 'text-base'
        )}>
          {fallback}
        </AvatarFallback>
      </Avatar>
      
      {isOnline && showOnlineStatus && (
        <div 
          className={cn(
            'absolute rounded-full bg-green-500 border-2 border-background animate-pulse-online',
            dotSizeClasses[size]
          )}
        />
      )}
    </div>
  );
};

export default OnlineAvatar;