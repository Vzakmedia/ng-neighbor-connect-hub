import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🗺️ [MAPS-TOKEN] Request received:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ [MAPS-TOKEN] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [MAPS-TOKEN] Starting API key retrieval...');
    
    // Get all environment variables to debug
    const allEnvKeys = Object.keys(Deno.env.toObject());
    console.log('📋 [MAPS-TOKEN] Available env vars:', allEnvKeys.length, 'keys');
    console.log('📋 [MAPS-TOKEN] Env var names:', allEnvKeys.join(', '));
    
    const token = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    console.log('🔑 [MAPS-TOKEN] API key check:', {
      found: !!token,
      length: token ? token.length : 0,
      firstChars: token ? token.substring(0, 8) + '...' : 'N/A'
    });
    
    if (!token) {
      const errorMsg = 'GOOGLE_MAPS_API_KEY not found in edge function secrets. Please configure it in Supabase.';
      console.error('❌ [MAPS-TOKEN]', errorMsg);
      console.error('💡 [MAPS-TOKEN] Add the secret at: https://supabase.com/dashboard/project/cowiviqhrnmhttugozbz/settings/functions');
      
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          hint: 'Configure GOOGLE_MAPS_API_KEY in Supabase edge function secrets'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    console.log('✅ [MAPS-TOKEN] Successfully returning Google Maps API key');
    return new Response(
      JSON.stringify({ 
        token,
        success: true,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [MAPS-TOKEN] Error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Failed to retrieve Google Maps API key'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});