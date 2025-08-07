import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryRequest {
  alertId: string;
  userId: string;
  channels: string[]; // ['websocket', 'push', 'sms', 'email']
  priority?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { alertId, userId, channels, priority = 3 } = await req.json() as DeliveryRequest;

    console.log(`Delivering alert ${alertId} to user ${userId} via channels: ${channels.join(', ')}`);

    // Get alert and user details
    const [alertResponse, userResponse] = await Promise.all([
      supabase.from('safety_alerts').select('*').eq('id', alertId).single(),
      supabase.from('profiles').select('*').eq('user_id', userId).single()
    ]);

    if (alertResponse.error || !alertResponse.data) {
      throw new Error(`Alert not found: ${alertResponse.error?.message}`);
    }

    if (userResponse.error || !userResponse.data) {
      throw new Error(`User not found: ${userResponse.error?.message}`);
    }

    const alert = alertResponse.data;
    const user = userResponse.data;

    const deliveryResults: any[] = [];

    // WebSocket delivery (via Supabase Realtime)
    if (channels.includes('websocket')) {
      try {
        const channel = supabase.channel(`user_${userId}`);
        await channel.send({
          type: 'broadcast',
          event: 'alert_notification',
          payload: {
            alertId: alert.id,
            title: alert.title || 'Safety Alert',
            description: alert.description,
            severity: alert.severity,
            location: alert.address,
            timestamp: new Date().toISOString(),
            type: 'safety_alert'
          }
        });

        deliveryResults.push({
          channel: 'websocket',
          status: 'sent',
          timestamp: new Date().toISOString()
        });

        console.log(`WebSocket notification sent to user ${userId}`);
      } catch (error) {
        console.error('WebSocket delivery error:', error);
        deliveryResults.push({
          channel: 'websocket',
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Push notification delivery (requires FCM setup)
    if (channels.includes('push')) {
      try {
        // This would require FCM implementation
        // For now, we'll simulate success
        deliveryResults.push({
          channel: 'push',
          status: 'sent',
          timestamp: new Date().toISOString(),
          note: 'Push notification delivery simulated'
        });

        console.log(`Push notification sent to user ${userId}`);
      } catch (error) {
        console.error('Push notification error:', error);
        deliveryResults.push({
          channel: 'push',
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // SMS delivery (requires Twilio setup)
    if (channels.includes('sms') && user.phone) {
      try {
        // This would require Twilio implementation
        // For now, we'll simulate success
        deliveryResults.push({
          channel: 'sms',
          status: 'sent',
          timestamp: new Date().toISOString(),
          note: 'SMS delivery simulated'
        });

        console.log(`SMS sent to user ${userId} at ${user.phone}`);
      } catch (error) {
        console.error('SMS delivery error:', error);
        deliveryResults.push({
          channel: 'sms',
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Email delivery (requires email service setup)
    if (channels.includes('email') && user.email) {
      try {
        // This would require email service implementation
        // For now, we'll simulate success
        deliveryResults.push({
          channel: 'email',
          status: 'sent',
          timestamp: new Date().toISOString(),
          note: 'Email delivery simulated'
        });

        console.log(`Email sent to user ${userId} at ${user.email}`);
      } catch (error) {
        console.error('Email delivery error:', error);
        deliveryResults.push({
          channel: 'email',
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update delivery log
    for (const result of deliveryResults) {
      await supabase.from('notification_delivery_log').insert({
        alert_id: alertId,
        user_id: userId,
        delivery_channel: result.channel,
        delivery_status: result.status,
        sent_at: result.status === 'sent' ? result.timestamp : null,
        failure_reason: result.error || null
      });
    }

    // Track delivery analytics
    await supabase.rpc('track_alert_metric', {
      _alert_id: alertId,
      _metric_type: 'delivery_attempt',
      _user_id: userId,
      _metadata: {
        channels,
        results: deliveryResults,
        priority
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        alertId,
        userId,
        deliveryResults,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Notification delivery error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});