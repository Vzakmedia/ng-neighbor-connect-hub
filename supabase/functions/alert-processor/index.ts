import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertProcessingRequest {
  alertId: string;
  priority?: number;
  targetingRules?: {
    type: string;
    criteria: any;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { alertId, priority = 3, targetingRules = [] } = await req.json() as AlertProcessingRequest;

    console.log(`Processing alert ${alertId} with priority ${priority}`);

    // Get alert details
    const { data: alert, error: alertError } = await supabase
      .from('safety_alerts')
      .select('*')
      .eq('id', alertId)
      .single();

    if (alertError || !alert) {
      throw new Error(`Alert not found: ${alertError?.message}`);
    }

    // Get user profile who created the alert
    const { data: alertCreatorProfile } = await supabase
      .from('profiles')
      .select('neighborhood, full_name')
      .eq('user_id', alert.user_id)
      .single();

    // Determine target users based on location and severity
    let targetUsers: any[] = [];

    if (alert.severity === 'critical') {
      // Critical alerts go to all users in the neighborhood
      if (alertCreatorProfile?.neighborhood) {
        const { data: neighborhoodUsers } = await supabase
          .from('profiles')
          .select('user_id, full_name, neighborhood')
          .eq('neighborhood', alertCreatorProfile.neighborhood)
          .neq('user_id', alert.user_id); // Don't send to creator

        targetUsers = neighborhoodUsers || [];
      }
    } else {
      // Other alerts based on targeting rules or proximity
      const { data: nearbyUsers } = await supabase
        .from('profiles')
        .select('user_id, full_name, neighborhood')
        .eq('neighborhood', alertCreatorProfile?.neighborhood || '')
        .neq('user_id', alert.user_id)
        .limit(50);

      targetUsers = nearbyUsers || [];
    }

    console.log(`Found ${targetUsers.length} target users for alert ${alertId}`);

    // Create notification delivery entries
    const deliveryEntries = targetUsers.map(user => ({
      alert_id: alertId,
      user_id: user.user_id,
      delivery_channel: 'websocket',
      delivery_status: 'pending'
    }));

    if (deliveryEntries.length > 0) {
      const { error: deliveryError } = await supabase
        .from('notification_delivery_log')
        .insert(deliveryEntries);

      if (deliveryError) {
        console.error('Error creating delivery entries:', deliveryError);
      }
    }

    // Update alert queue status
    const { error: queueError } = await supabase
      .from('alert_queue')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('alert_id', alertId);

    if (queueError) {
      console.error('Error updating queue status:', queueError);
    }

    // Trigger real-time notifications via Supabase channels
    for (const user of targetUsers) {
      // Send real-time update to user's channel
      const channel = supabase.channel(`user_${user.user_id}`);
      await channel.send({
        type: 'broadcast',
        event: 'new_alert',
        payload: {
          alert,
          severity: alert.severity,
          creator: alertCreatorProfile?.full_name || 'Unknown',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Cache alert data for performance
    const cacheKey = `alert_${alertId}`;
    const cacheData = {
      alert,
      targetUsers: targetUsers.length,
      processedAt: new Date().toISOString()
    };

    await supabase.rpc('set_alert_cache', {
      _cache_key: cacheKey,
      _cache_data: cacheData,
      _ttl_seconds: 300
    });

    // Track analytics
    await supabase.rpc('track_alert_metric', {
      _alert_id: alertId,
      _metric_type: 'processed',
      _metadata: {
        targetUsers: targetUsers.length,
        priority,
        processingTime: Date.now()
      }
    });

    console.log(`Successfully processed alert ${alertId} for ${targetUsers.length} users`);

    return new Response(
      JSON.stringify({
        success: true,
        alertId,
        targetUsers: targetUsers.length,
        processedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Alert processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
