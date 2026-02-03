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
    let { userId, title, message, type = 'notification', priority = 'normal', data = {} } = await req.json();

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

    // Prepare FCM v1 Payload
    const fcmPayload = {
      message: {
        token: user.push_subscription, // Assuming this is the FCM token
        notification: {
          title: title,
          body: message,
        },
        data: {
          ...data,
          notification_type: type,
          type: type,
        },
        android: {
          priority: priority === 'high' ? 'high' : 'normal',
          notification: {
            priority: priority === 'high' ? 'high' : 'default',
            sound: 'default',
            channel_id: type === 'emergency' ? 'emergency' : 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: title,
                body: message,
              },
              'content-available': 1,
              sound: 'default',
              category: type === 'emergency' ? 'EMERGENCY' : 'NOTIFICATION',
            },
          },
        },
      },
    };

    // Get FCM Access Token
    const serviceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT');
    let fcmResponse: any;

    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      const accessToken = await getFcmAccessToken(serviceAccount);
      const projectId = serviceAccount.project_id;

      fcmResponse = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(fcmPayload),
        }
      );

      const fcmResult = await fcmResponse.json();
      console.log('FCM v1 Response:', fcmResult);

      if (!fcmResponse.ok) {
        console.error('FCM Error details:', fcmResult);
      }
    } else {
      console.warn('FCM_SERVICE_ACCOUNT secret not set. Skipping actual push.');
    }

    return new Response(
      JSON.stringify({
        success: !!(fcmResponse && fcmResponse.ok),
        message: fcmResponse?.ok ? 'Push notification sent successfully' : 'FCM delivery failed or skipped',
        recipient: userId,
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

// Helper to get FCM Access Token using Service Account
async function getFcmAccessToken(serviceAccount: any) {
  // Use a shorter scope/audience for standard FCM v1
  const HEADER = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(HEADER));
  const encodedClaim = btoa(JSON.stringify(claim));
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const privateKey = serviceAccount.private_key
    .replace(/\\n/g, "\n")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .trim();

  // We need to import the decode function or use a built-in one if available in Deno
  // Based on send-call-notification, we assume 'decode' is imported from std/encoding/base64.ts
  const binaryKey = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const jwt = `${signatureInput}.${encodedSignature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await response.json();
  return data.access_token;
}