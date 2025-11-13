import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNativeContacts } from '@/hooks/mobile/useNativeContacts';
import { UsersIcon, ArrowPathIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContactMatch {
  userId: string;
  displayName: string;
  phoneNumber: string;
  avatarUrl?: string;
}

export const FindFriendsButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [matches, setMatches] = useState<ContactMatch[]>([]);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
  const { isNative, isLoading, findFriends } = useNativeContacts();
  const { toast } = useToast();

  if (!isNative) {
    return null;
  }

  const handleFindFriends = async () => {
    setIsOpen(true);
    const foundMatches = await findFriends();
    setMatches(foundMatches);
  };

  const handleSendRequest = async (userId: string) => {
    setSendingRequests(prev => new Set(prev).add(userId));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // In production, implement friend request system
      // For now, just show success message
      toast({
        title: 'Request Sent',
        description: 'Friend request sent successfully!',
      });

      // Remove from matches list
      setMatches(prev => prev.filter(m => m.userId !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send friend request',
        variant: 'destructive',
      });
    } finally {
      setSendingRequests(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <>
      <Button onClick={handleFindFriends} disabled={isLoading}>
        {isLoading ? (
          <>
            <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
            Finding...
          </>
        ) : (
          <>
            <UsersIcon className="mr-2 h-4 w-4" />
            Find Friends from Contacts
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Friends from Contacts</DialogTitle>
            <DialogDescription>
              {matches.length > 0
                ? `Found ${matches.length} friend(s) from your contacts`
                : 'No friends found from your contacts'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {matches.map((match) => (
              <div
                key={match.userId}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={match.avatarUrl} />
                    <AvatarFallback>
                      {match.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{match.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {match.phoneNumber}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSendRequest(match.userId)}
                  disabled={sendingRequests.has(match.userId)}
                >
                  {sendingRequests.has(match.userId) ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlusIcon className="mr-2 h-4 w-4" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
