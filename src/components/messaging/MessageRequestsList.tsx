import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, MessageCircle } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';

interface MessageRequest {
  id: string;
  user1_id: string;
  user2_id: string;
  requested_at: string;
  sender_name: string;
  sender_avatar: string | null;
  latest_message: string | null;
  message_count: number;
}

interface MessageRequestsListProps {
  onRequestAccepted: (conversationId: string) => void;
}

export const MessageRequestsList: React.FC<MessageRequestsListProps> = ({
  onRequestAccepted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [handlingRequest, setHandlingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMessageRequests();
  }, [user]);

  const fetchMessageRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('direct_conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          requested_at,
          request_status,
          conversation_type
        `)
        .eq('user2_id', user.id)
        .eq('request_status', 'pending')
        .eq('conversation_type', 'direct_message')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Get sender profile info and latest message for each request
      const requestsWithDetails = await Promise.all(
        data.map(async (conv) => {
          // Get sender profile
          const { data: profileData } = await supabase
            .rpc('get_public_profile_info', { target_user_id: conv.user1_id });

          // Get latest message
          const { data: messageData } = await supabase
            .from('direct_messages')
            .select('content')
            .or(`and(sender_id.eq.${conv.user1_id},recipient_id.eq.${user.id}),and(sender_id.eq.${user.id},recipient_id.eq.${conv.user1_id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count messages in this conversation
          const { count } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .or(`and(sender_id.eq.${conv.user1_id},recipient_id.eq.${user.id}),and(sender_id.eq.${user.id},recipient_id.eq.${conv.user1_id})`);

          const senderProfile = profileData?.[0];

          return {
            id: conv.id,
            user1_id: conv.user1_id,
            user2_id: conv.user2_id,
            requested_at: conv.requested_at,
            sender_name: senderProfile?.full_name || 'Unknown User',
            sender_avatar: senderProfile?.avatar_url || null,
            latest_message: messageData?.content || null,
            message_count: count || 0
          };
        })
      );

      setRequests(requestsWithDetails);
    } catch (error) {
      console.error('Error fetching message requests:', error);
      toast({
        title: "Error",
        description: "Failed to load message requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (conversationId: string, action: 'accept' | 'decline') => {
    setHandlingRequest(conversationId);

    try {
      const { data, error } = await supabase
        .rpc('handle_message_request', {
          conversation_id: conversationId,
          action: action
        });

      if (error) throw error;

      if (data) {
        toast({
          title: action === 'accept' ? "Request Accepted" : "Request Declined",
          description: action === 'accept' 
            ? "You can now chat with this user" 
            : "The message request has been declined"
        });

        // Remove request from list
        setRequests(prev => prev.filter(req => req.id !== conversationId));

        // If accepted, notify parent to refresh conversations
        if (action === 'accept') {
          onRequestAccepted(conversationId);
        }
      }
    } catch (error) {
      console.error('Error handling request:', error);
      toast({
        title: "Error",
        description: "Failed to handle message request",
        variant: "destructive"
      });
    } finally {
      setHandlingRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center">
        <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground">No Message Requests</h3>
        <p className="text-sm text-muted-foreground mt-2">
          When someone you haven't chatted with before sends you a message, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Message Requests</h2>
        <Badge variant="secondary">{requests.length}</Badge>
      </div>

      {requests.map((request) => (
        <Card key={request.id} className="transition-colors hover:bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={request.sender_avatar || undefined} />
                <AvatarFallback>
                  {request.sender_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-sm truncate">
                    {request.sender_name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                  </span>
                </div>

                {request.latest_message && (
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {request.latest_message}
                  </p>
                )}

                {request.message_count > 1 && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {request.message_count} messages
                  </p>
                )}

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleRequest(request.id, 'accept')}
                    disabled={handlingRequest === request.id}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequest(request.id, 'decline')}
                    disabled={handlingRequest === request.id}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};