import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
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
      log_id,
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

    let data, error;

    // Check if this is an update or insert
    if (log_id) {
      // UPDATE existing call log
      const updateResult = await supabase.from('call_logs').update({
        call_status: status,
        connected_at: connected_at || undefined,
        ended_at: ended_at || undefined,
        duration_seconds,
      }).eq('id', log_id).select().single();

      data = updateResult.data;
      error = updateResult.error;
      
      console.log('Call log updated:', log_id);
    } else {
      // INSERT new call log
      const insertResult = await supabase.from('call_logs').insert({
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

      data = insertResult.data;
      error = insertResult.error;
      
      console.log('Call log created:', data?.id);
    }

    if (error) {
      console.error('Error with call log:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
