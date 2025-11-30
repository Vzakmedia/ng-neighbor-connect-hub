import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
};

interface SignalingMessage {
  id: string;
  type: 'offer' | 'answer' | 'ice' | 'end' | 'restart' | 'busy' | 'renegotiate' | 'renegotiate-answer' | 'timeout';
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  session_id?: string;
  sdp?: any;
  candidate?: any;
  timestamp?: string;
  metadata?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();
    const { message, conversation_id, receiver_id, session_id } = body;

    if (!message || !conversation_id || !receiver_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: message, conversation_id, receiver_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const signalingMessage = message as SignalingMessage;

    // Verify sender_id matches authenticated user
    if (signalingMessage.sender_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'sender_id must match authenticated user' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[insert-call-signal] Processing message ${signalingMessage.id} type=${signalingMessage.type}`);

    // Check if message already exists (idempotent insert)
    const { data: existing, error: checkError } = await supabaseClient
      .from('call_signaling')
      .select('id')
      .eq('message->>id', signalingMessage.id)
      .maybeSingle();

    if (checkError) {
      console.error('[insert-call-signal] Error checking existing message:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database query failed', details: checkError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (existing) {
      console.log(`[insert-call-signal] Message ${signalingMessage.id} already exists (duplicate), returning success`);
      return new Response(
        JSON.stringify({
          status: 'duplicate',
          message: 'Message already exists',
          id: existing.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract signal type from message
    const signalType = signalingMessage.type as string;
    
    // Validate signal type
    const validTypes = ['offer', 'answer', 'ice', 'ice-candidate', 'reject', 'decline', 'end', 'restart', 'busy', 'renegotiate', 'renegotiate-answer', 'timeout'];
    if (!validTypes.includes(signalType)) {
      return new Response(
        JSON.stringify({ error: `Invalid signal type: ${signalType}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate expires_at (2 minutes from now)
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    // Insert new signaling message with type, expires_at, and session_id
    const { data, error: insertError } = await supabaseClient
      .from('call_signaling')
      .insert({
        conversation_id,
        sender_id: signalingMessage.sender_id,
        receiver_id,
        type: signalType,
        message: signalingMessage,
        expires_at: expiresAt,
        session_id: session_id || signalingMessage.session_id || null,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[insert-call-signal] Error inserting message:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert message', details: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[insert-call-signal] Successfully inserted message ${signalingMessage.id} with id=${data.id}`);

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Signaling message inserted',
        id: data.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[insert-call-signal] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
