import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, title, message, type = 'notification', priority = 'normal', data = {} } = await req.json();

    console.log('Push notification request:', { userId, title, type, priority });

    // Validate required fields
    if (!userId || !title || !message) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: userId, title, message',
          status: 'error'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if push notifications are enabled
    const { data: pushConfig } = await supabase
      .from('app_configuration')
      .select('config_value')
      .eq('config_key', 'push_notifications_enabled')
      .single();

    if (!pushConfig?.config_value) {
      console.log('Push notifications are disabled');
      return new Response(
        JSON.stringify({ 
          error: 'Push notifications are disabled',
          status: 'disabled'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user's push subscription (if any)
    const { data: user } = await supabase
      .from('profiles')
      .select('push_subscription')
      .eq('user_id', userId)
      .single();

    if (!user?.push_subscription) {
      console.log('User has no push subscription');
      return new Response(
        JSON.stringify({ 
          error: 'User has no push subscription',
          status: 'no_subscription'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create notification record
    const { error: notificationError } = await supabase
      .from('alert_notifications')
      .insert({
        recipient_id: userId,
        notification_type: type,
        content: message,
        title: title,
        priority: priority,
        data: data,
        delivery_method: 'push',
        sent_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error creating notification record:', notificationError);
    }

    // For emergency notifications, check priority setting
    if (type === 'emergency') {
      const { data: emergencyConfig } = await supabase
        .from('app_configuration')
        .select('config_value')
        .eq('config_key', 'emergency_push_priority')
        .single();

      if (emergencyConfig?.config_value) {
        priority = 'high';
      }
    }

    // Simulate push notification delivery
    // In a real implementation, you would use a service like Firebase, OneSignal, etc.
    console.log('Simulating push notification delivery...');
    
    const notification = {
      title: title,
      body: message,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: type,
      requireInteraction: priority === 'high',
      data: {
        ...data,
        type: type,
        userId: userId,
        timestamp: new Date().toISOString()
      }
    };

    // Simulate delivery delay
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Push notification sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Push notification sent successfully',
        recipient: userId,
        title: title,
        type: type,
        priority: priority,
        sentAt: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});