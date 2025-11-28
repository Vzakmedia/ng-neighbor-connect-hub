import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientId, callerId, callerName, callType, conversationId } = await req.json();

    if (!recipientId || !callerId || !callerName || !callType || !conversationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recipient's push tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('fcm_token, apns_token')
      .eq('user_id', recipientId)
      .single();

    if (profileError || !profile) {
      console.log('No profile found for recipient:', recipientId);
      return new Response(
        JSON.stringify({ error: 'Recipient not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.fcm_token && !profile.apns_token) {
      console.log('No push tokens available for recipient:', recipientId);
      return new Response(
        JSON.stringify({ error: 'No push tokens available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the notification attempt
    const { error: notifError } = await supabase
      .from('alert_notifications')
      .insert({
        recipient_id: recipientId,
        notification_type: 'call_incoming',
        content: `${callerName} is calling you`,
        notification_metadata: {
          caller_id: callerId,
          caller_name: callerName,
          call_type: callType,
          conversation_id: conversationId,
        },
      });

    if (notifError) {
      console.error('Failed to log notification:', notifError);
    }

    // In a production environment, you would send the actual push notification here
    // using FCM for Android (profile.fcm_token) or APNs for iOS (profile.apns_token)
    console.log('Call notification sent:', {
      recipientId,
      callerId,
      callerName,
      callType,
      hasFcmToken: !!profile.fcm_token,
      hasApnsToken: !!profile.apns_token,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Call notification sent',
        hasPushTokens: !!(profile.fcm_token || profile.apns_token)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending call notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
