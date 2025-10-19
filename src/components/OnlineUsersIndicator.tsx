import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OnlineAvatar from '@/components/OnlineAvatar';
import { usePresence } from '@/contexts/PresenceContext';
import { Users } from 'lucide-react';

export const OnlineUsersIndicator: React.FC = () => {
  const { onlineUsers, totalOnlineUsers, getUserPresence } = usePresence();

  // Always show the component, but with different content when no users are online
  const displayUsers = onlineUsers.length > 0;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-green-500" />
          Online Now
          <Badge variant="secondary" className="ml-auto">
            {totalOnlineUsers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {displayUsers ? (
          <div className="flex flex-wrap gap-2">
            {onlineUsers.slice(0, 8).map((userId) => {
              const presence = getUserPresence(userId);
              return (
                <div key={userId} className="flex flex-col items-center gap-1">
                  <OnlineAvatar
                    userId={userId}
                    src={presence?.avatar_url}
                    fallback={presence?.user_name?.charAt(0) || 'U'}
                    size="md"
                  />
                  <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                    {presence?.user_name || 'User'}
                  </span>
                </div>
              );
            })}
            {totalOnlineUsers > 8 && (
              <div className="flex flex-col items-center gap-1">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  +{totalOnlineUsers - 8}
                </div>
                <span className="text-xs text-muted-foreground">more</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="h-8 w-8 rounded-full bg-gray-200 mx-auto mb-2 flex items-center justify-center">
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-muted-foreground">No users online</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnlineUsersIndicator;