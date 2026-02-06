// Deno native serve with manual JWT generation to avoid SDK polyfill issues
import { create, getNumericDate } from "https://deno.land/x/djwt@v4.0.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Health Check
    if (req.method === 'GET') {
        return new Response(JSON.stringify({ status: 'active', time: new Date().toISOString() }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }

    try {
        // 1. Get Authentication Header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            // Return 401 instead of throwing to avoid crash logs if possible, but throwing is caught below
            throw new Error('Missing Authorization header');
        }

        // 2. Validate User with Supabase Auth
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            console.error('Auth User Error:', userError);
            return new Response(
                JSON.stringify({ error: 'Unauthorized', details: userError }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Get Request Body
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return new Response(
                JSON.stringify({ error: 'Invalid JSON body' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
        const { roomName, participantName } = body;

        if (!roomName) {
            return new Response(
                JSON.stringify({ error: 'Missing roomName' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 4. Generate LiveKit Token (Manual JWT)
        const apiKey = Deno.env.get('LIVEKIT_API_KEY');
        const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

        if (!apiKey || !apiSecret) {
            console.error('Missing LiveKit Credentials');
            return new Response(
                JSON.stringify({ error: 'Server Configuration Error' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const participantIdentity = user.id;
        const pName = participantName || user.user_metadata?.full_name || user.email || user.id;

        // Construct LiveKit Claims
        const payload = {
            iss: apiKey,
            sub: participantIdentity,
            name: pName,
            video: {
                room: roomName,
                roomJoin: true,
                canPublish: true,
                canSubscribe: true,
            },
            // Valid for 1 hour
            exp: getNumericDate(60 * 60),
            nbf: getNumericDate(0),
        };

        // Sign JWT
        // LiveKit secrets are HS256
        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(apiSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

        return new Response(
            JSON.stringify({ token }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown error' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})
