import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface EmailPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  safety_alerts: boolean;
  emergency_alerts: boolean;
  panic_alerts: boolean;
  community_posts: boolean;
  marketplace_updates: boolean;
  service_bookings: boolean;
  messages: boolean;
  contact_requests: boolean;
  event_reminders: boolean;
  post_comments: boolean;
  comment_replies: boolean;
  post_likes: boolean;
  frequency: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export const useEmailNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user email preferences
  const { data: preferences, isLoading } = useQuery<EmailPreferences | null>({
    queryKey: ['email-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No preferences yet, create default
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_email_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newPrefs;
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<EmailPreferences>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_email_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-preferences'] });
      toast.success('Email preferences updated');
    },
    onError: (error) => {
      console.error('Error updating email preferences:', error);
      toast.error('Failed to update email preferences');
    }
  });

  // Send test email
  const sendTestEmail = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error('No email address');
      
      const emailBody = {
        to: user.email,
        subject: 'Test Email Notification',
        body: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Test Successful!</h1>
            <p style="color: #666; line-height: 1.6;">Your email notifications are working correctly.</p>
            <p style="color: #666; line-height: 1.6;">You will receive email notifications based on your preferences.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;"/>
            <p style="color: #999; font-size: 12px;">This is a test email from your application.</p>
          </div>
        `,
        type: 'system',
        userId: user.id
      };

      console.log('Attempting to send test email via supabase.functions.invoke...');
      
      try {
        const { data, error } = await supabase.functions.invoke('send-email-notification', {
          body: emailBody
        });
        
        if (error) {
          console.error('supabase.functions.invoke error:', error);
          throw error;
        }
        
        console.log('Test email sent successfully via invoke:', data);
        return data;
      } catch (invokeError: any) {
        console.error('Invoke failed, trying direct fetch fallback:', invokeError);
        
        // Fallback to direct fetch
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cowiviqhrnmhttugozbz.supabase.co';
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvd2l2aXFocm5taHR0dWdvemJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTQ0NDQsImV4cCI6MjA2ODYzMDQ0NH0.BJ6OstIOar6CqEv__WzF9qZYaW12uQ-FfXYaVdxgJM4';
        
        const response = await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey
          },
          body: JSON.stringify(emailBody)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Direct fetch failed:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Test email sent successfully via direct fetch:', data);
        return data;
      }
    },
    onSuccess: () => {
      toast.success('Test email sent! Check your inbox.');
    },
    onError: (error: any) => {
      console.error('Error sending test email:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Failed to send test email: ${errorMessage}`);
    }
  });

  return {
    preferences,
    isLoading,
    updatePreferences,
    sendTestEmail
  };
};
