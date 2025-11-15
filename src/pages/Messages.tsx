import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import OnlineUsersIndicator from '@/components/OnlineUsersIndicator';
import UnifiedMessaging from '@/components/messaging/UnifiedMessaging';
import MobileConversationList from '@/components/messaging/MobileConversationList';
import { useConversations } from '@/hooks/useConversations';

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { conversations, loading: conversationsLoading, fetchConversations } = useConversations(user?.id);

  useEffect(() => {
    if (user?.id) {
      fetchConversations();
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
      
      {/* Mobile & Tablet View - Simple Conversation List */}
      <main className="lg:hidden fixed inset-0 top-16 bottom-20 bg-background">
        {user && (
          <MobileConversationList 
            conversations={conversations}
            loading={conversationsLoading}
            userId={user.id}
          />
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