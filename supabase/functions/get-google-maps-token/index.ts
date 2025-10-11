import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Google Maps API token request received');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    console.log('API key check:', token ? 'Key found' : 'Key NOT found');
    
    if (!token) {
      console.error('GOOGLE_MAPS_API_KEY not configured in edge function secrets');
      throw new Error('GOOGLE_MAPS_API_KEY not configured in edge function secrets');
    }

    console.log('Successfully returning Google Maps API key');
    return new Response(
      JSON.stringify({ token }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error getting Google Maps API key:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});