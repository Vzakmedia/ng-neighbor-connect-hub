import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('[get-turn-credentials] Request from user:', user.id);

    // Read TURN credentials from environment variables
    const turnServer = Deno.env.get('TURN_SERVER') || 'turn:turn.neighborlink.ng:3478';
    const turnUsername = Deno.env.get('TURN_USERNAME');
    const turnPassword = Deno.env.get('TURN_PASSWORD');

    const iceServers: any[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    // Add TURN servers if credentials are configured
    if (turnUsername && turnPassword) {
      iceServers.push({
        urls: [
          `${turnServer}?transport=udp`,
          `${turnServer}?transport=tcp`
        ],
        username: turnUsername,
        credential: turnPassword
      });
      console.log('[get-turn-credentials] Returning custom TURN credentials');
    } else {
      // Fallback to free open relay
      iceServers.push({
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turns:openrelay.metered.ca:443',
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject',
      });
      console.log('[get-turn-credentials] Returning fallback TURN credentials');
    }

    const credentials = { iceServers };

    return new Response(JSON.stringify(credentials), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[get-turn-credentials] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
