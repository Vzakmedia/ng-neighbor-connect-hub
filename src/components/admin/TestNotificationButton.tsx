import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const TestNotificationButton: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const onTest = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch user's profile for email/phone
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('email, phone, full_name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const email = profile?.email || user.email;
      const phone = profile?.phone as string | null;
      const name = profile?.full_name || 'there';

      const subject = 'Test Notification ✔';
      const html = `
        <h2>Hello ${name},</h2>
        <p>This is a test email from the notification system. If you received this, email delivery via Resend works.</p>
        <p style="color:#6b7280">Time: ${new Date().toLocaleString()}</p>
      `;
      const smsBody = `Test notification: Email+SMS verification at ${new Date().toLocaleTimeString()}`;

      const tasks: Promise<any>[] = [];

      if (email) {
        tasks.push(
          supabase.functions.invoke('send-email-notification', {
            body: {
              to: email,
              subject,
              body: html,
              type: 'test',
              userId: user.id,
            },
          })
        );
      }

      if (phone) {
        tasks.push(
          supabase.functions.invoke('send-sms-notification', {
            body: {
              to: phone,
              body: smsBody,
              userId: user.id,
            },
          })
        );
      }

      if (tasks.length === 0) {
        toast({ title: 'No contact info', description: 'Add an email or phone to your profile to test notifications.' });
        return;
      }

      const results = await Promise.allSettled(tasks);

      const emailOk = results.find(r => r.status === 'fulfilled' && (r as any).value?.data && (r as any).value.data?.provider !== 'twilio');
      const smsOk = results.find(r => r.status === 'fulfilled' && (r as any).value?.data?.provider === 'twilio');

      toast({
        title: 'Test triggered',
        description: `${email ? (emailOk ? 'Email sent' : 'Email failed') : 'Email skipped'} • ${phone ? (smsOk ? 'SMS sent' : 'SMS failed') : 'SMS skipped'}`,
      });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Test failed', description: e.message });
    } finally {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="mt-6">
      <Button onClick={onTest} disabled={!user || loading} variant="default">
        {loading ? 'Sending…' : 'Send Test Notification'}
      </Button>
    </div>
  );
};

export default TestNotificationButton;
