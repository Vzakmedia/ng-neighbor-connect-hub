import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { NIGERIAN_STATES, STATE_CITIES, CITY_NEIGHBORHOODS } from './nigeria-data.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LocationRequest {
  type: 'states' | 'cities' | 'neighborhoods';
  state?: string;
  city?: string;
  query?: string;
}

serve(async (req) => {
  console.log(`📍 Nigeria Locations API - ${req.method} ${req.url}`);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, state, city }: LocationRequest = await req.json();
    console.log(`Request type: ${type}, state: ${state}, city: ${city}`);

    let locations: any[] = [];

    if (type === 'states') {
      locations = NIGERIAN_STATES.map((stateName) => ({
        name: stateName,
        formatted_address: `${stateName}, Nigeria`,
        place_id: `state_${stateName.toLowerCase().replace(/\s+/g, '_')}`,
        types: ['administrative_area_level_1']
      }));
      console.log(`✅ Returning ${locations.length} states`);
    } else if (type === 'cities' && state) {
      const cities = STATE_CITIES[state] || [];
      locations = cities.map((cityName) => ({
        name: cityName,
        formatted_address: `${cityName}, ${state}, Nigeria`,
        place_id: `city_${cityName.toLowerCase().replace(/\s+/g, '_')}`,
        types: ['locality']
      }));
      console.log(`✅ Returning ${locations.length} cities for ${state}`);
  } else if (type === 'neighborhoods' && state && city) {
      // Get comprehensive ward data for the selected LGA
      const neighborhoods = CITY_NEIGHBORHOODS[city] || [];
      
      locations = neighborhoods.map((hood) => ({
        name: hood,
        formatted_address: `${hood}, ${city}, ${state}, Nigeria`,
        place_id: `neighborhood_${city.toLowerCase()}_${hood.toLowerCase().replace(/\s+/g, '_')}`,
        types: ['neighborhood', 'ward']
      }));
      console.log(`✅ Returning ${locations.length} wards for ${city} LGA, ${state}`);
    }

    return new Response(
      JSON.stringify({ locations, status: 'success' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        locations: [],
        status: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
