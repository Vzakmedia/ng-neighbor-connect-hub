import { supabase } from '@/integrations/supabase/client';
import { playNotification } from '@/utils/audioUtils';

// Immediate notification system for real-time message alerts
class MessageNotifier {
  private static instance: MessageNotifier;
  private isListening = false;
  private subscription: any = null;

  static getInstance() {
    if (!MessageNotifier.instance) {
      MessageNotifier.instance = new MessageNotifier();
    }
    return MessageNotifier.instance;
  }

  startListening(userId: string, currentConversationId?: string) {
    if (this.isListening) {
      console.log('MessageNotifier: Already listening, skipping setup');
      return;
    }

    console.log('MessageNotifier: Starting immediate notification listener for user:', userId);
    
    // Create a unique channel for instant notifications
    const channel = supabase.channel(`instant_notifications_${userId}_${Date.now()}`);
    
    this.subscription = channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `recipient_id=eq.${userId}`
      }, async (payload) => {
        console.log('MessageNotifier: Instant message received:', payload);
        const message = payload.new as any;
        
        // Skip notification if from current conversation
        if (currentConversationId) {
          try {
            const { data: conversation } = await supabase
              .from('direct_conversations')
              .select('user1_id, user2_id')
              .eq('id', currentConversationId)
              .single();
            
            if (conversation && 
                (conversation.user1_id === message.sender_id || conversation.user2_id === message.sender_id)) {
              console.log('MessageNotifier: Skipping - message from current conversation');
              return;
            }
          } catch (error) {
            console.error('MessageNotifier: Error checking conversation:', error);
          }
        }
        
        // Play notification immediately
        try {
          console.log('MessageNotifier: Playing instant notification...');
          await playNotification('notification', 0.9);
          console.log('MessageNotifier: Instant notification played successfully');
        } catch (error) {
          console.error('MessageNotifier: Error playing instant notification:', error);
        }
      })
      .subscribe((status) => {
        console.log('MessageNotifier: Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          this.isListening = true;
          console.log('MessageNotifier: Successfully subscribed to instant notifications');
        }
      });
  }

  stopListening() {
    if (this.subscription) {
      console.log('MessageNotifier: Stopping instant notification listener');
      supabase.removeChannel(this.subscription);
      this.subscription = null;
      this.isListening = false;
    }
  }

  updateConversationId(userId: string, newConversationId?: string) {
    console.log('MessageNotifier: Updating conversation ID to:', newConversationId);
    this.stopListening();
    this.startListening(userId, newConversationId);
  }
}

export const messageNotifier = MessageNotifier.getInstance();