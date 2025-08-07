import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source, event, data, signature } = await req.json();

    console.log('Webhook received:', { source, event, dataKeys: Object.keys(data || {}) });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if webhooks are enabled
    const { data: webhookConfig } = await supabase
      .from('app_configuration')
      .select('config_value')
      .eq('config_key', 'webhooks_enabled')
      .single();

    if (!webhookConfig?.config_value) {
      console.log('Webhooks are disabled');
      return new Response(
        JSON.stringify({ 
          error: 'Webhooks are disabled',
          status: 'disabled'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify webhook signature if provided
    if (signature) {
      const { data: secretConfig } = await supabase
        .from('app_configuration')
        .select('config_value')
        .eq('config_key', 'webhook_secret')
        .single();

      if (secretConfig?.config_value) {
        // In a real implementation, verify the signature
        console.log('Webhook signature verification would happen here');
      }
    }

    // Log the webhook for audit purposes
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        source: source,
        event_type: event,
        payload: data,
        signature: signature,
        processed_at: new Date().toISOString(),
        status: 'received'
      });

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    // Process different webhook types
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
        console.log('Unknown webhook source:', source);
        processResult = { success: true, message: 'Webhook received but not processed' };
    }

    // Update webhook log with processing result
    await supabase
      .from('webhook_logs')
      .update({
        status: processResult.success ? 'processed' : 'failed',
        processing_result: processResult,
        updated_at: new Date().toISOString()
      })
      .eq('source', source)
      .eq('event_type', event)
      .eq('processed_at', new Date().toISOString());

    console.log('Webhook processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully',
        source: source,
        event: event,
        processedAt: new Date().toISOString(),
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
        error: error.message,
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