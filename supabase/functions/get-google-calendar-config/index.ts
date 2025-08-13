import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Google Calendar configuration from environment variables
    const googleApiKey = Deno.env.get('GOOGLE_CALENDAR_API_KEY');
    const googleClientId = Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID');

    if (!googleApiKey || !googleClientId) {
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

    // Only return the configuration to authenticated users
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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