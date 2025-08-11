import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function retry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 800): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const delay = baseDelayMs * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limit = 50 } = (await req.json().catch(() => ({}))) as { limit?: number };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch due escalations
    const { data: escalations, error: escErr } = await supabase
      .from('notification_escalations')
      .select('*')
      .lte('due_at', new Date().toISOString())
      .eq('status', 'pending')
      .order('due_at', { ascending: true })
      .limit(limit);

    if (escErr) throw escErr;

    const results: any[] = [];

    for (const esc of escalations || []) {
      try {
        // Check if already read
        const [{ data: notif }, { data: user }, { data: alert }] = await Promise.all([
          supabase.from('alert_notifications').select('is_read').eq('alert_id', esc.alert_id).eq('recipient_id', esc.user_id).maybeSingle(),
          supabase.from('profiles').select('*').eq('user_id', esc.user_id).single(),
          supabase.from('safety_alerts').select('*').eq('id', esc.alert_id).single(),
        ]);

        if (notif?.is_read) {
          await supabase.from('notification_escalations').update({ status: 'skipped', processed_at: new Date().toISOString() }).eq('id', esc.id);
          results.push({ id: esc.id, status: 'skipped' });
          continue;
        }

        if (!user?.phone) {
          await supabase.from('notification_escalations').update({ status: 'failed', processed_at: new Date().toISOString(), last_error: 'No phone on profile' }).eq('id', esc.id);
          results.push({ id: esc.id, status: 'failed', reason: 'no_phone' });
          continue;
        }

        const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER');
        if (!accountSid || !authToken || !fromNumber) {
          throw new Error('Missing Twilio configuration');
        }

        const smsBody = `[${String(alert?.severity || 'info').toUpperCase()}] ${alert?.title || 'Safety Alert'} - ${alert?.description || ''}`.slice(0, 140);
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const params = new URLSearchParams({ To: user.phone, From: fromNumber, Body: smsBody });
        const resp = await retry(async () => await fetch(twilioUrl, {
          method: 'POST',
          headers: { 'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`), 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        }));
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`Twilio error ${resp.status}: ${errText}`);
        }
        const resJson = await resp.json();

        // Update escalation
        await supabase.from('notification_escalations').update({ status: 'sent', processed_at: new Date().toISOString(), attempts: esc.attempts + 1 }).eq('id', esc.id);

        // Log delivery
        await supabase.from('notification_delivery_log').insert({
          alert_id: esc.alert_id,
          user_id: esc.user_id,
          delivery_channel: 'sms',
          delivery_status: 'sent',
          sent_at: new Date().toISOString(),
          failure_reason: null,
        });

        await supabase.rpc('track_alert_metric', { _alert_id: esc.alert_id, _metric_type: 'escalation_delivered', _user_id: esc.user_id, _metadata: { provider: 'twilio', sid: resJson.sid } });

        results.push({ id: esc.id, status: 'sent' });
      } catch (e: any) {
        console.error('Escalation processing error:', e);
        await supabase.from('notification_escalations').update({ attempts: (esc.attempts || 0) + 1, last_error: e.message }).eq('id', esc.id);
        results.push({ id: esc.id, status: 'error', error: e.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('process-escalations error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
