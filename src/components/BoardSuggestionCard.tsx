import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  MapPin, 
  Globe, 
  Hash, 
  Crown,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DiscussionBoard {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  is_public: boolean;
  member_limit: number | null;
  location: string | null;
  location_scope: 'neighborhood' | 'city' | 'state' | 'public';
  requires_approval: boolean;
  auto_approve_members: boolean;
  member_count: number;
  user_role: string | null;
}

interface BoardSuggestionCardProps {
  board: DiscussionBoard;
  onJoin?: () => void;
}

const BoardSuggestionCard = ({ board, onJoin }: BoardSuggestionCardProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'neighborhood':
        return <Hash className="h-4 w-4" />;
      case 'city':
        return <MapPin className="h-4 w-4" />;
      case 'state':
        return <Shield className="h-4 w-4" />;
      case 'public':
        return <Globe className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'neighborhood':
        return 'Neighborhood';
      case 'city':
        return 'City';
      case 'state':
        return 'State';
      case 'public':
        return 'Public';
      default:
        return scope;
    }
  };

  const getScopeBadgeVariant = (scope: string) => {
    switch (scope) {
      case 'neighborhood':
        return 'default';
      case 'city':
        return 'secondary';
      case 'state':
        return 'outline';
      case 'public':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleJoinBoard = async () => {
    if (!user) return;

    setIsJoining(true);
    try {
      if (board.requires_approval && !board.auto_approve_members) {
        // Create join request
        const { error: requestError } = await supabase
          .from('board_join_requests')
          .insert({
            board_id: board.id,
            user_id: user.id,
            message: `Request to join ${board.name}`
          });

        if (requestError) throw requestError;

        toast({
          title: "Join request sent",
          description: "Your request to join this board has been sent to the moderators.",
        });
      } else {
        // Join directly
        const { error: joinError } = await supabase
          .from('board_members')
          .insert({
            board_id: board.id,
            user_id: user.id,
            role: 'member'
          });

        if (joinError) throw joinError;

        toast({
          title: "Joined board",
          description: `You have successfully joined ${board.name}!`,
        });
        
        onJoin?.();
      }
    } catch (error) {
      console.error('Error joining board:', error);
      toast({
        title: "Error",
        description: "Failed to join board. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const canJoin = board.user_role === null && (!board.member_limit || board.member_count < board.member_limit);

  return (
    <Card className="w-full mb-4 border-l-4 border-l-primary/20 bg-gradient-to-r from-muted/30 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {board.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{board.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getScopeBadgeVariant(board.location_scope)}>
                  {getScopeIcon(board.location_scope)}
                  <span className="ml-1">{getScopeLabel(board.location_scope)}</span>
                </Badge>
                {board.location && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {board.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          {canJoin && (
            <Button 
              onClick={handleJoinBoard}
              disabled={isJoining}
              variant="outline"
              size="sm"
            >
              {isJoining ? (
                <>
                  <Clock className="h-4 w-4 mr-1 animate-spin" />
                  {board.requires_approval ? 'Requesting...' : 'Joining...'}
                </>
              ) : (
                <>
                  {board.requires_approval && !board.auto_approve_members ? 'Request to Join' : 'Join Board'}
                </>
              )}
            </Button>
          )}
          {board.user_role && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {board.user_role === 'admin' ? 'Admin' : 'Member'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {board.description && (
          <p className="text-sm text-muted-foreground mb-3">{board.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {board.member_count} member{board.member_count !== 1 ? 's' : ''}
            </span>
            {board.member_limit && (
              <span>• Limit: {board.member_limit}</span>
            )}
            {board.requires_approval && (
              <span className="flex items-center gap-1">
                <Crown className="h-4 w-4" />
                Requires approval
              </span>
            )}
          </div>
          
          <Badge variant="outline" className="text-xs">
            Suggested for you
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default BoardSuggestionCard;