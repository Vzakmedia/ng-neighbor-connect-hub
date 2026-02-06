
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { AccessToken } from 'https://esm.sh/livekit-server-sdk@1.2.7'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Get Authentication Header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        // 2. Validate User with Supabase Auth
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        // Get the user from the JWT
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            console.error('Auth User Error:', userError);
            throw new Error('Unauthorized: Invalid user token. ' + (userError?.message || ''));
        }

        // 3. Get Request Body (Room Name & Participant Name)
        let body;
        try {
            body = await req.json();
        } catch (e) {
            throw new Error('Invalid JSON body');
        }
        const { roomName, participantName } = body;

        if (!roomName) {
            throw new Error('Missing roomName in request body');
        }

        // 4. Generate LiveKit Token
        const apiKey = Deno.env.get('LIVEKIT_API_KEY');
        const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

        if (!apiKey || !apiSecret) {
            console.error('Missing LiveKit Credentials in Env');
            throw new Error('Server misconfiguration: Missing LiveKit credentials');
        }

        // We use the User ID as identity for consistency
        const participantIdentity = user.id;
        // Use provided name or metadata name, fallback to email/id
        const pName = participantName || user.user_metadata?.full_name || user.email || user.id;

        const at = new AccessToken(
            apiKey,
            apiSecret,
            {
                identity: participantIdentity,
                name: pName,
            }
        );

        // Grant permissions
        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
        });

        // 5. Create Token string
        const token = await at.toJwt();

        // 6. Return Token
        return new Response(
            JSON.stringify({ token }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Error generating LiveKit token:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown error' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            } // Return 400 so client knows it failed, but with CORS headers
        )
    }
})
