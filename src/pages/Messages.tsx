import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import OnlineUsersIndicator from '@/components/OnlineUsersIndicator';
import UnifiedMessaging from '@/components/messaging/UnifiedMessaging';
import MobileConversationList from '@/components/messaging/MobileConversationList';
import { MessageRequestsList } from '@/components/messaging/MessageRequestsList';
import { MarketplaceMessaging } from '@/components/messaging/MarketplaceMessaging';
import { useConversations } from '@/hooks/useConversations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChatBubbleLeftRightIcon as MessageCircle,
  UserPlusIcon as UserPlus,
  ShoppingBagIcon as ShoppingBag
} from '@heroicons/react/24/outline';
import {
  ChatBubbleLeftRightIcon as MessageCircleSolid,
  UserPlusIcon as UserPlusSolid,
  ShoppingBagIcon as ShoppingBagSolid
} from '@heroicons/react/24/solid';

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { conversations, loading: conversationsLoading, fetchConversations } = useConversations(user?.id);
  const [requestCount, setRequestCount] = useState(0);

  const fetchRequestCount = async () => {
    if (!user?.id) return;
    
    try {
      const { count } = await supabase
        .from('direct_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user2_id', user.id)
        .eq('request_status', 'pending')
        .eq('conversation_type', 'direct_message');
      
      setRequestCount(count || 0);
    } catch (error) {
      console.error('Error fetching request count:', error);
    }
  };

  const handleRequestAccepted = () => {
    fetchConversations();
    fetchRequestCount();
  };

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
      fetchRequestCount();
    }
  }, [user?.id, fetchConversations]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(162,85%,30%)]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      {/* Mobile & Tablet View - Tabbed Messaging */}
      <main className="lg:hidden fixed inset-0 top-16 bottom-20 bg-background pt-3">
        {user && (
          <Tabs defaultValue="direct" className="h-full flex flex-col">
            <TabsList className="w-full rounded-none">
              <TabsTrigger 
                value="direct" 
                icon={MessageCircle} 
                iconSolid={MessageCircleSolid}
                className="flex-1"
              >
                Messages
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                icon={UserPlus} 
                iconSolid={UserPlusSolid}
                className="flex-1"
              >
                Requests
                {requestCount > 0 && (
                  <Badge variant="default" className="ml-1.5 h-5 min-w-5 px-1.5">
                    {requestCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="marketplace" 
                icon={ShoppingBag} 
                iconSolid={ShoppingBagSolid}
                className="flex-1"
              >
                Marketplace
              </TabsTrigger>
            </TabsList>

            <TabsContent value="direct" className="flex-1 m-0 overflow-hidden">
              <MobileConversationList 
                conversations={conversations}
                loading={conversationsLoading}
                userId={user.id}
              />
            </TabsContent>

            <TabsContent value="requests" className="flex-1 m-0 overflow-hidden">
              <MessageRequestsList onRequestAccepted={handleRequestAccepted} />
            </TabsContent>

            <TabsContent value="marketplace" className="flex-1 m-0 overflow-hidden">
              <MarketplaceMessaging />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Desktop View - Keep existing UnifiedMessaging */}
      <main className="hidden lg:block md:ml-16 lg:ml-64 pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <UnifiedMessaging />
            </div>
            <div className="hidden xl:block">
              <div className="sticky top-6">
                <OnlineUsersIndicator />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;