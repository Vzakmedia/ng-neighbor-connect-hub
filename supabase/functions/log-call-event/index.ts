import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const {
      caller_id,
      receiver_id,
      conversation_id,
      call_type,
      status,
      started_at,
      connected_at,
      ended_at
    } = body;

    console.log('Logging call event:', {
      caller_id,
      receiver_id,
      conversation_id,
      call_type,
      status
    });

    // Calculate duration from connected_at to ended_at
    let duration_seconds = 0;
    if (connected_at && ended_at) {
      const connectedTime = new Date(connected_at).getTime();
      const endedTime = new Date(ended_at).getTime();
      duration_seconds = Math.max(0, Math.floor((endedTime - connectedTime) / 1000));
    }

    // Insert call log
    const { data, error } = await supabase.from('call_logs').insert({
      caller_id,
      receiver_id,
      conversation_id,
      call_type,
      call_status: status,
      started_at: started_at || new Date().toISOString(),
      connected_at: connected_at || null,
      ended_at: ended_at || null,
      duration_seconds,
    }).select().single();

    if (error) {
      console.error('Error inserting call log:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Call log created successfully:', data.id);

    return new Response(JSON.stringify({ success: true, log_id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
