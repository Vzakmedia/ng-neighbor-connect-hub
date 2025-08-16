import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Google Calendar config function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Google Calendar configuration from environment variables
    const googleApiKey = Deno.env.get('GOOGLE_CALENDAR_API_KEY');
    const googleClientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');
    
    console.log('Environment check:', {
      hasApiKey: !!googleApiKey,
      hasClientId: !!googleClientId,
      apiKeyLength: googleApiKey?.length || 0,
      clientIdLength: googleClientId?.length || 0
    });

    if (!googleApiKey || !googleClientId) {
      console.error('Missing Google Calendar configuration');
      return new Response(
        JSON.stringify({ 
          error: 'Google Calendar API configuration not found. Please configure GOOGLE_CALENDAR_API_KEY and GOOGLE_CALENDAR_CLIENT_ID in Supabase Edge Functions secrets.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check authentication
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Returning Google Calendar configuration successfully');
    return new Response(
      JSON.stringify({
        apiKey: googleApiKey,
        clientId: googleClientId,
        discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
        scopes: 'https://www.googleapis.com/auth/calendar.events'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in get-google-calendar-config:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});