import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMessageActions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const deleteMessages = useCallback(async (messageIds: string[]) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('delete_messages', {
        message_ids: messageIds
      });

      if (error) throw error;

      toast({
        title: "Messages deleted",
        description: `${messageIds.length} message(s) deleted successfully.`,
      });

      return true;
    } catch (error) {
      console.error('Error deleting messages:', error);
      toast({
        title: "Error",
        description: "Could not delete messages.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const softDeleteMessages = useCallback(async (messageIds: string[]) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('soft_delete_messages', {
        message_ids: messageIds
      });

      if (error) throw error;

      toast({
        title: "Messages deleted",
        description: `${messageIds.length} message(s) deleted successfully.`,
      });

      return true;
    } catch (error) {
      console.error('Error soft deleting messages:', error);
      toast({
        title: "Error",
        description: "Could not delete messages.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('delete_conversation', {
        conversation_id: conversationId
      });

      if (error) throw error;

      toast({
        title: "Conversation deleted",
        description: "The conversation and all its messages have been deleted.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Could not delete conversation.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteSingleMessage = useCallback(async (messageId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Message deleted",
        description: "Message deleted successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Could not delete message.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    deleteMessages,
    softDeleteMessages,
    deleteConversation,
    deleteSingleMessage,
    loading
  };
};