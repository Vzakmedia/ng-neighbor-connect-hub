import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import MarketplaceMessageThread from './MarketplaceMessageThread';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarketplaceConversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_city: string | null;
  other_user_state: string | null;
  last_message_at: string;
  has_unread: boolean;
  marketplace_item_id?: string;
  marketplace_service_id?: string;
  item_title?: string;
  service_title?: string;
  conversation_type: string;
}

export const MarketplaceMessaging: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<MarketplaceConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMessageThread, setShowMessageThread] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchMarketplaceConversations();

    // Set up real-time subscription for marketplace conversations
    const channel = supabase
      .channel('marketplace-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_conversations',
          filter: `conversation_type=eq.marketplace`
        },
        () => {
          fetchMarketplaceConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchMarketplaceConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('direct_conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          last_message_at,
          user1_has_unread,
          user2_has_unread,
          conversation_type,
          marketplace_item_id,
          marketplace_service_id
        `)
        .eq('conversation_type', 'marketplace')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get detailed info for each conversation
      const conversationsWithDetails = await Promise.all(
        data.map(async (conv) => {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
          const hasUnread = conv.user1_id === user.id ? conv.user1_has_unread : conv.user2_has_unread;

          // Get other user's profile
          const { data: profileData } = await supabase
            .rpc('get_public_profile_info', { target_user_id: otherUserId });

          const otherUserProfile = profileData?.[0];

          // Get marketplace item/service details if applicable
          let itemTitle, serviceTitle;
          
          if (conv.marketplace_item_id) {
            const { data: itemData } = await supabase
              .from('marketplace_items')
              .select('title')
              .eq('id', conv.marketplace_item_id)
              .single();
            itemTitle = itemData?.title;
          }

          if (conv.marketplace_service_id) {
            const { data: serviceData } = await supabase
              .from('services')
              .select('title')
              .eq('id', conv.marketplace_service_id)
              .single();
            serviceTitle = serviceData?.title;
          }

          return {
            id: conv.id,
            other_user_id: otherUserId,
            other_user_name: otherUserProfile?.full_name || 'Unknown User',
            other_user_avatar: otherUserProfile?.avatar_url || null,
            other_user_city: otherUserProfile?.city || null,
            other_user_state: otherUserProfile?.state || null,
            last_message_at: conv.last_message_at,
            has_unread: hasUnread,
            marketplace_item_id: conv.marketplace_item_id,
            marketplace_service_id: conv.marketplace_service_id,
            item_title: itemTitle,
            service_title: serviceTitle,
            conversation_type: conv.conversation_type
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching marketplace conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load marketplace conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setShowMessageThread(true); // Show message thread on mobile
    
    // Mark conversation as read
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation?.has_unread) {
      markConversationAsRead(conversationId);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .rpc('mark_direct_messages_as_read', {
          conversation_id: conversationId,
          current_user_id: user.id
        });

      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, has_unread: false }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const handleBackToConversations = () => {
    setShowMessageThread(false);
    setSelectedConversation(null);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r">
          <div className="p-4 animate-pulse">
            <div className="h-6 bg-muted rounded mb-4"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 border-b">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-48 mx-auto mb-2"></div>
            <div className="h-3 bg-muted rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Conversations List - Hidden on mobile when thread is open */}
      <div className={`w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r bg-background ${
        showMessageThread ? 'hidden lg:block' : 'block'
      }`}>
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2 mb-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Marketplace</h2>
            {conversations.filter(c => c.has_unread).length > 0 && (
              <Badge variant="secondary">
                {conversations.filter(c => c.has_unread).length}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Messages about marketplace items and services
          </p>
        </div>

        <div className="overflow-y-auto h-[calc(100%-120px)]">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No marketplace conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedConversation === conversation.id ? 'bg-muted' : ''
                }`}
                onClick={() => handleConversationSelect(conversation.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {conversation.other_user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {conversation.has_unread && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium text-sm truncate ${
                        conversation.has_unread ? 'font-semibold' : ''
                      }`}>
                        {conversation.other_user_name}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </span>
                    </div>

                    {(conversation.item_title || conversation.service_title) && (
                      <div className="flex items-center space-x-1 mt-1">
                        {conversation.marketplace_item_id && <Package className="w-3 h-3 text-muted-foreground" />}
                        {conversation.marketplace_service_id && <ShoppingBag className="w-3 h-3 text-muted-foreground" />}
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.item_title || conversation.service_title}
                        </p>
                      </div>
                    )}

                    {conversation.other_user_city && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversation.other_user_city}
                        {conversation.other_user_state && `, ${conversation.other_user_state}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Thread - Full width on mobile when open */}
      <div className={`flex-1 ${
        !showMessageThread ? 'hidden lg:flex' : 'flex'
      }`}>
        {selectedConversation && selectedConv ? (
          <MarketplaceMessageThread
            conversationId={selectedConversation}
            otherUserName={selectedConv.other_user_name}
            otherUserAvatar={selectedConv.other_user_avatar}
            otherUserId={selectedConv.other_user_id}
            conversationType="marketplace"
            onBack={handleBackToConversations}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">Select a conversation</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Choose a marketplace conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};