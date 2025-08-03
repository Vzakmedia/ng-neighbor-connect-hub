import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessId, promotionType, duration, targetLocation, images = [] } = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Get business details
    const { data: business, error: businessError } = await supabaseClient
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single();

    if (businessError || !business) {
      throw new Error("Business not found or access denied");
    }

    // Calculate pricing in Naira (converted to kobo for Stripe)
    const pricingMap = {
      'basic': { 7: 500000, 14: 800000, 30: 1400000 }, // ₦5,000, ₦8,000, ₦14,000
      'premium': { 7: 1000000, 14: 1800000, 30: 3200000 }, // ₦10,000, ₦18,000, ₦32,000
      'featured': { 7: 2000000, 14: 3500000, 30: 6000000 } // ₦20,000, ₦35,000, ₦60,000
    };

    const amount = pricingMap[promotionType]?.[duration];
    if (!amount) {
      throw new Error("Invalid promotion type or duration");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "ngn",
            product_data: { 
              name: `Business Promotion - ${promotionType.charAt(0).toUpperCase() + promotionType.slice(1)}`,
              description: `${duration} days promotion for ${business.business_name}`,
              metadata: {
                business_id: businessId,
                promotion_type: promotionType,
                duration: duration.toString(),
                target_location: targetLocation || "all"
              }
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        business_id: businessId,
        promotion_type: promotionType,
        duration: duration.toString(),
        target_location: targetLocation || "all",
        user_id: user.id
      },
      success_url: `${req.headers.get("origin")}/business?payment=success`,
      cancel_url: `${req.headers.get("origin")}/business?payment=cancelled`,
    });

    // Create promotion record with pending status
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    await supabaseService.from("promotion_campaigns").insert({
      business_id: businessId,
      title: `${business.business_name} - ${promotionType.charAt(0).toUpperCase() + promotionType.slice(1)} Promotion`,
      description: `${duration} days promotion campaign for ${business.business_name}`,
      budget: amount / 100, // Convert back to Naira
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
      status: 'pending_payment',
      target_locations: targetLocation ? [targetLocation] : [],
      images: images,
      stripe_session_id: session.id,
      created_by: user.id
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating business promotion payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});