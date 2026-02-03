import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
};

// Helper to get FCM Access Token using Service Account
async function getFcmAccessToken(serviceAccount: any) {
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

  const binaryKey = decode(privateKey);
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

Deno.serve(async (req) => {
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

    const fcmToken = profile.fcm_token;
    if (!fcmToken) {
      console.log('No FCM token available for recipient:', recipientId);
      return new Response(
        JSON.stringify({ error: 'No FCM token available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare FCM Payload
    const fcmPayload = {
      message: {
        token: fcmToken,
        // For Android, we omit the top-level 'notification' to make it a data-only message
        // which allows the app to handle it in the background and show our own UI.
        // For iOS, we still include standard notification for APNs compatibility.
        data: {
          notification_type: 'call_incoming',
          conversation_id: conversationId,
          caller_id: callerId,
          caller_name: callerName,
          call_type: callType,
          is_background_call: 'true',
        },
        android: {
          priority: 'high',
          // Note: No notification block here for Android to ensure it's handled as a data message
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: `Incoming ${callType} call`,
                body: `${callerName} is calling you`,
              },
              'content-available': 1,
              category: 'INCOMING_CALL',
              priority: 10,
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
    } else {
      console.warn('FCM_SERVICE_ACCOUNT secret not set. Skipping actual push.');
    }

    // Log to alert_notifications for history/tracking
    await supabase.from('alert_notifications').insert({
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Call notification processed',
        fcmSent: !!(fcmResponse && fcmResponse.ok)
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
