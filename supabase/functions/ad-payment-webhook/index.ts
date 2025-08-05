import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('Ad payment webhook called');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body, 
      signature, 
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );

    console.log('Stripe event:', event.type);

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      console.log('Payment successful for session:', session.id);

      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Find the campaign by payment session ID
      const { data: campaign, error: campaignError } = await supabaseService
        .from("advertisement_campaigns")
        .select("*")
        .eq("stripe_session_id", session.id)
        .single();

      if (campaignError) {
        console.error('Campaign not found:', campaignError);
        throw campaignError;
      }

      console.log('Found campaign:', campaign.id);

      // Update campaign status to pending approval
      const { error: updateError } = await supabaseService
        .from("advertisement_campaigns")
        .update({
          payment_status: 'paid',
          payment_completed_at: new Date().toISOString(),
          status: 'pending_approval',
          updated_at: new Date().toISOString()
        })
        .eq("id", campaign.id);

      if (updateError) {
        console.error('Error updating campaign:', updateError);
        throw updateError;
      }

      // Create notification for admins about new ad awaiting approval
      const { error: notificationError } = await supabaseService
        .from("alert_notifications")
        .insert({
          notification_type: 'ad_approval_needed',
          content: `New advertisement campaign "${campaign.campaign_name}" is awaiting approval`,
          sender_name: 'System',
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      console.log('Campaign updated successfully');
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || "Webhook processing failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});