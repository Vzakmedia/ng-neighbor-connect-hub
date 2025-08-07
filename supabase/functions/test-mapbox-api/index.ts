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
    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    
    if (!mapboxToken) {
      console.error('MAPBOX_PUBLIC_TOKEN not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Mapbox token not configured',
          status: 'error'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test Mapbox API by fetching a simple style
    const testUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${mapboxToken}`;
    
    console.log('Testing Mapbox API with token:', mapboxToken.substring(0, 8) + '...');
    
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      console.error('Mapbox API test failed:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: 'Mapbox API test failed',
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
    console.log('Mapbox API test successful');

    return new Response(
      JSON.stringify({ 
        success: true,
        status: 'active',
        message: 'Mapbox API is working correctly',
        token: mapboxToken,
        styleId: data.id || 'unknown'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error testing Mapbox API:', error);
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