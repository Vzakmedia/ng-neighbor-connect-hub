import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe secret key not configured',
          status: 'error'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test Stripe API by fetching account information
    const testUrl = 'https://api.stripe.com/v1/account';
    
    console.log('Testing Stripe API connection...');
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (!response.ok) {
      console.error('Stripe API test failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Stripe error details:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Stripe API test failed',
          status: 'error',
          details: `HTTP ${response.status}: ${response.statusText}`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Stripe API test successful for account:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        status: 'active',
        message: 'Stripe API is working correctly',
        accountId: data.id,
        country: data.country,
        currency: data.default_currency,
        businessProfile: data.business_profile?.name || 'Not set'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error testing Stripe API:', error);
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