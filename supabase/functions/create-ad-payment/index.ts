import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('Create ad payment function called');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client using the anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    console.log('User authenticated:', user.email);

    // Parse request body
    const { campaign_id, amount, currency, description } = await req.json();
    
    if (!campaign_id || !amount) {
      throw new Error("Missing required parameters: campaign_id and amount");
    }

    console.log('Payment request:', { campaign_id, amount, currency, description });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Existing customer found:', customerId);
    } else {
      console.log('No existing customer found, will create new one');
    }

    // Create a one-time payment session for Nigerian Naira
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: currency || "ngn",
            product_data: { 
              name: "Community Advertisement",
              description: description || "Advertisement placement in community feed"
            },
            unit_amount: Math.round(amount * 100), // Convert to kobo (NGN smallest unit)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/community?payment=success&campaign_id=${campaign_id}`,
      cancel_url: `${req.headers.get("origin")}/community?payment=cancelled&campaign_id=${campaign_id}`,
      metadata: {
        campaign_id: campaign_id,
        user_id: user.id,
        type: "advertisement"
      }
    });

    console.log('Stripe session created:', session.id);

    // Update campaign with payment session information
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { error: updateError } = await supabaseService
      .from("promotion_campaigns")
      .update({
        payment_session_id: session.id,
        payment_amount: amount,
        updated_at: new Date().toISOString()
      })
      .eq("id", campaign_id);

    if (updateError) {
      console.error('Error updating campaign:', updateError);
      throw updateError;
    }

    console.log('Campaign updated with payment session');

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to create payment session" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});