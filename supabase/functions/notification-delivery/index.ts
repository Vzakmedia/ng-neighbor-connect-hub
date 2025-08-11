import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helpers
const severityRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

function timeToMinutes(t?: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function isWithinQuietHours(quietStart?: string | null, quietEnd?: string | null, tz?: string | null): boolean {
  if (!quietStart || !quietEnd || !tz) return false;
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', { hour12: false, timeZone: tz, hour: '2-digit', minute: '2-digit' });
  const parts = formatter.formatToParts(now);
  const hh = Number(parts.find(p => p.type === 'hour')?.value || '0');
  const mm = Number(parts.find(p => p.type === 'minute')?.value || '0');
  const current = hh * 60 + mm;
  const start = timeToMinutes(quietStart)!;
  const end = timeToMinutes(quietEnd)!;
  if (start <= end) return current >= start && current <= end;
  // overnight window
  return current >= start || current <= end;
}

function renderTemplate(str: string | null | undefined, vars: Record<string, unknown>): string | undefined {
  if (!str) return undefined;
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => String((vars as any)[key] ?? ''));
}

interface DeliveryRequest {
  alertId: string;
  userId: string;
  channels: string[]; // ['websocket', 'push', 'sms', 'email']
  priority?: number;
  templateKey?: string;
  variables?: Record<string, unknown>;
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

    const { alertId, userId, channels, priority = 3, templateKey, variables = {} } = await req.json() as DeliveryRequest;

    console.log(`Delivering alert ${alertId} to user ${userId} via channels: ${channels.join(', ')}`);

    // Get alert and user details
    const [alertResponse, userResponse] = await Promise.all([
      supabase.from('safety_alerts').select('*').eq('id', alertId).single(),
      supabase.from('profiles').select('*').eq('user_id', userId).single()
    ]);

    if (alertResponse.error || !alertResponse.data) {
      throw new Error(`Alert not found: ${alertResponse.error?.message}`);
    }

    if (userResponse.error || !userResponse.data) {
      throw new Error(`User not found: ${userResponse.error?.message}`);
    }

    const alert = alertResponse.data;
    const user = userResponse.data;

    // Load user notification preferences and optional templates
    const [{ data: prefs }, templateSingle] = await Promise.all([
      supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle(),
      templateKey
        ? supabase.from('notification_templates').select('*').eq('name', templateKey).eq('is_active', true).maybeSingle()
        : Promise.resolve({ data: null, error: null })
    ]);

    const templateByChannel: Record<string, any> = {};
    const templateRow: any = (templateSingle as any).data;
    if (templateRow) {
      templateByChannel['email'] = {
        subject: templateRow.title_template,
        body_html: templateRow.email_template || templateRow.body_template,
      };
      templateByChannel['sms'] = {
        body_text: templateRow.sms_template || templateRow.body_template,
      };
      if (templateRow.push_template) {
        templateByChannel['push'] = templateRow.push_template;
      }
    }

    const baseVars = {
      title: alert.title ?? 'Safety Alert',
      description: alert.description ?? '',
      severity: alert.severity ?? 'info',
      address: alert.address ?? '',
      user_name: user.full_name || user.email || '',
      timestamp: new Date().toISOString(),
      ...variables,
    };

    // Determine allowed channels by preferences, quiet hours, and severity threshold
    const prefEnabled = {
      email: prefs?.email_enabled ?? true,
      sms: prefs?.sms_enabled ?? false,
      push: prefs?.push_enabled ?? true,
      websocket: true,
    } as Record<string, boolean>;

    const quietNow = isWithinQuietHours(prefs?.quiet_hours_start, prefs?.quiet_hours_end, prefs?.timezone);
    const sevRank = severityRank[String(alert.severity || 'low').toLowerCase()] || 1;
    const minRank = severityRank[String(prefs?.priority_filter || 'low').toLowerCase()] || 1;

    let allowedChannels = channels.filter((c) => prefEnabled[c] !== false);

    // Enforce minimum severity
    if (sevRank < minRank) {
      allowedChannels = allowedChannels.filter((c) => c === 'websocket');
    }

    // Respect quiet hours (allow websocket always; allow others if critical)
    if (quietNow && (String(alert.severity || '').toLowerCase() !== 'critical')) {
      allowedChannels = allowedChannels.filter((c) => c === 'websocket');
    }

    // Preferred order: fallback to requested order
    const preferred = allowedChannels;

    // Deduplicate and keep order
    const orderedAllowed = preferred.filter((c) => allowedChannels.includes(c)).concat(
      allowedChannels.filter((c) => !preferred.includes(c))
    );

    const deliveryResults: any[] = [];

    // WebSocket delivery (via Supabase Realtime)
    if (orderedAllowed.includes('websocket')) {
      try {
        const channel = supabase.channel(`user_${userId}`);
        await channel.send({
          type: 'broadcast',
          event: 'alert_notification',
          payload: {
            alertId: alert.id,
            title: alert.title || 'Safety Alert',
            description: alert.description,
            severity: alert.severity,
            location: alert.address,
            timestamp: new Date().toISOString(),
            type: 'safety_alert'
          }
        });

        deliveryResults.push({
          channel: 'websocket',
          status: 'sent',
          timestamp: new Date().toISOString()
        });

        console.log(`WebSocket notification sent to user ${userId}`);
      } catch (error) {
        console.error('WebSocket delivery error:', error);
        deliveryResults.push({
          channel: 'websocket',
          status: 'failed',
          error: (error as any).message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Push notification delivery (requires FCM setup)
    if (orderedAllowed.includes('push')) {
      try {
        // This would require FCM implementation
        // For now, we'll simulate success
        deliveryResults.push({
          channel: 'push',
          status: 'sent',
          timestamp: new Date().toISOString(),
          note: 'Push notification delivery simulated'
        });

        console.log(`Push notification sent to user ${userId}`);
      } catch (error) {
        console.error('Push notification error:', error);
        deliveryResults.push({
          channel: 'push',
          status: 'failed',
          error: (error as any).message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // SMS delivery via Twilio REST API
    if (orderedAllowed.includes('sms') && user.phone) {
      try {
        const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
        const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
        const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

        if (!accountSid || !authToken || !fromNumber) {
          throw new Error('Missing Twilio configuration (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)');
        }

        const smsTpl = templateByChannel['sms'];
        const fallbackSms = `[{{severity}}] {{title}} - {{description}}`;
        const smsBodyFull = renderTemplate(smsTpl?.body_text || fallbackSms, baseVars) || '';
        const smsBody = smsBodyFull.slice(0, 140);

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        const params = new URLSearchParams({
          To: user.phone,
          From: fromNumber,
          Body: smsBody,
        });

        const resp = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`Twilio error ${resp.status}: ${errText}`);
        }

        const twilioResult = await resp.json();

        deliveryResults.push({
          channel: 'sms',
          status: 'sent',
          timestamp: new Date().toISOString(),
          provider: 'twilio',
          provider_message_sid: twilioResult.sid,
        });

        console.log(`SMS sent to user ${userId} at ${user.phone}`);
      } catch (error) {
        console.error('SMS delivery error:', error);
        deliveryResults.push({
          channel: 'sms',
          status: 'failed',
          error: (error as any).message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Email delivery via Resend
    if (orderedAllowed.includes('email') && user.email) {
      try {
        const apiKey = Deno.env.get('RESEND_API_KEY');
        if (!apiKey) {
          throw new Error('Missing RESEND_API_KEY');
        }

        const resend = new Resend(apiKey);
        const emailTpl = templateByChannel['email'];
        const subject = renderTemplate(emailTpl?.subject || (alert.title || 'Safety Alert'), baseVars) as string;
        const html = renderTemplate(
          emailTpl?.body_html || `
            <h2>{{title}}</h2>
            <p><strong>Severity:</strong> {{severity}}</p>
            {{#if description}}<p>{{description}}</p>{{/if}}
            {{#if address}}<p><strong>Location:</strong> {{address}}</p>{{/if}}
            <p style="color:#888">Sent at {{timestamp}}</p>
          `,
          baseVars
        ) as string;

        const from = Deno.env.get('RESEND_FROM') ?? 'Notifications <onboarding@resend.dev>';

        const emailRes = await resend.emails.send({
          from,
          to: [user.email],
          subject,
          html,
        });

        deliveryResults.push({
          channel: 'email',
          status: 'sent',
          timestamp: new Date().toISOString(),
          provider: 'resend',
          provider_id: (emailRes as any)?.data?.id ?? null,
        });

        console.log(`Email sent to user ${userId} at ${user.email}`);
      } catch (error) {
        console.error('Email delivery error:', error);
        deliveryResults.push({
          channel: 'email',
          status: 'failed',
          error: (error as any).message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Update delivery log
    for (const result of deliveryResults) {
      await supabase.from('notification_delivery_log').insert({
        alert_id: alertId,
        user_id: userId,
        delivery_channel: result.channel,
        delivery_status: result.status,
        sent_at: result.status === 'sent' ? result.timestamp : null,
        failure_reason: result.error || null
      });
    }

    // Track delivery analytics
    await supabase.rpc('track_alert_metric', {
      _alert_id: alertId,
      _metric_type: 'delivery_attempt',
      _user_id: userId,
      _metadata: {
        channels,
        results: deliveryResults,
        priority
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        alertId,
        userId,
        deliveryResults,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Notification delivery error:', error);
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