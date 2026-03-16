import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getCorsHeaders, handleCors } from "../_shared/http.ts";

const toHex = (buffer: ArrayBuffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const constantTimeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
};

const signPayload = async (payload: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toHex(signature);
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const rawBody = await req.text();
    let payload: Record<string, unknown>;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid payload', status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const source = String(payload.source || '');
    const event = String(payload.event || '');
    const data = payload.data;

    if (!source || !event) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook metadata', status: 'error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: webhookConfig } = await supabase
      .from('app_configuration')
      .select('config_value')
      .eq('config_key', 'webhooks_enabled')
      .single();

    if (!webhookConfig?.config_value) {
      return new Response(
        JSON.stringify({ error: 'Webhooks are disabled', status: 'disabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: secretConfig } = await supabase
      .from('app_configuration')
      .select('config_value')
      .eq('config_key', 'webhook_secret')
      .single();

    const secret = Deno.env.get('WEBHOOK_SECRET') || String(secretConfig?.config_value || '');
    if (!secret) {
      return new Response(
        JSON.stringify({ error: 'Webhook is not configured', status: 'error' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const providedSignature = String(req.headers.get('x-webhook-signature') || payload.signature || '');
    const verificationPayload = payload.signature
      ? JSON.stringify({ source, event, data })
      : rawBody;
    const expectedSignature = await signPayload(verificationPayload, secret);

    if (!providedSignature || !constantTimeEqual(providedSignature, expectedSignature)) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature', status: 'error' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processedAt = new Date().toISOString();
    const { data: webhookLog, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        source,
        event_type: event,
        payload: data,
        signature: providedSignature,
        processed_at: processedAt,
        status: 'received'
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    let processResult = null;

    switch (source) {
      case 'stripe':
        processResult = await processStripeWebhook(event, data, supabase);
        break;
      case 'payment':
        processResult = await processPaymentWebhook(event, data, supabase);
        break;
      case 'external_api':
        processResult = await processExternalApiWebhook(event, data, supabase);
        break;
      default:
        processResult = { success: true, message: 'Webhook received but not processed' };
    }

    if (webhookLog?.id) {
      await supabase
        .from('webhook_logs')
        .update({
          status: processResult?.success ? 'processed' : 'failed',
          processing_result: processResult,
          updated_at: new Date().toISOString()
        })
        .eq('id', webhookLog.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        source,
        event,
        processedAt,
        result: processResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process webhook',
        status: 'error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processStripeWebhook(event: string, data: any, supabase: any) {
  console.log('Processing Stripe webhook:', event);
  
  switch (event) {
    case 'payment_intent.succeeded':
      // Handle successful payment
      console.log('Payment succeeded:', data.id);
      return { success: true, message: 'Payment processed successfully' };
    
    case 'payment_intent.payment_failed':
      // Handle failed payment
      console.log('Payment failed:', data.id);
      return { success: true, message: 'Payment failure handled' };
    
    default:
      console.log('Unhandled Stripe event:', event);
      return { success: true, message: 'Event acknowledged but not processed' };
  }
}

async function processPaymentWebhook(event: string, data: any, supabase: any) {
  console.log('Processing payment webhook:', event);
  
  // Handle general payment events
  return { success: true, message: 'Payment webhook processed' };
}

async function processExternalApiWebhook(event: string, data: any, supabase: any) {
  console.log('Processing external API webhook:', event);
  
  // Handle external API notifications
  return { success: true, message: 'External API webhook processed' };
}
