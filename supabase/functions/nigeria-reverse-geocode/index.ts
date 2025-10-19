import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Nigeria geographic boundaries
const NIGERIA_BOUNDS = {
  north: 13.9,
  south: 4.3,
  east: 14.7,
  west: 2.7
};

interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

serve(async (req) => {
  console.log(`🗺️ Nigeria Reverse Geocode - ${req.method} ${req.url}`);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude }: ReverseGeocodeRequest = await req.json();
    console.log(`🗺️ [NIGERIA-GEOCODE] Request: ${JSON.stringify({ latitude, longitude })}`);

    // Validate coordinates are in Nigeria
    if (
      latitude < NIGERIA_BOUNDS.south || 
      latitude > NIGERIA_BOUNDS.north ||
      longitude < NIGERIA_BOUNDS.west || 
      longitude > NIGERIA_BOUNDS.east
    ) {
      console.log(`⚠️ [NIGERIA-GEOCODE] Coordinates outside Nigeria bounds`);
      return new Response(
        JSON.stringify({
          address: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Outside Nigeria)`,
          warning: 'Coordinates are outside Nigerian territory',
          status: 'out_of_bounds'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ [NIGERIA-GEOCODE] Google Maps API key not configured');
      throw new Error('Google Maps API key not configured');
    }

    console.log(`🔑 [NIGERIA-GEOCODE] Using Google Maps API`);
    
    // Use Google Maps Geocoding API with Nigerian preferences
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&region=ng&language=en&result_type=neighborhood|sublocality|locality|administrative_area_level_2`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    
    console.log(`✅ [NIGERIA-GEOCODE] Google Maps response:`, JSON.stringify(data));

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      
      // Extract Nigerian-style address components
      const components = result.address_components;
      let neighborhood = '';
      let city = '';
      let state = '';
      
      for (const component of components) {
        if (component.types.includes('neighborhood') || component.types.includes('sublocality')) {
          neighborhood = component.long_name;
        }
        if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
      }
      
      // Format Nigerian-style address: "Neighborhood, City, State, Nigeria"
      const addressParts = [neighborhood, city, state].filter(Boolean);
      const formattedAddress = addressParts.length > 0 
        ? `${addressParts.join(', ')}, Nigeria`
        : result.formatted_address;
      
      console.log(`📍 [NIGERIA-GEOCODE] Formatted address: ${formattedAddress}`);
      
      return new Response(
        JSON.stringify({ 
          address: formattedAddress,
          raw: result.formatted_address,
          components: { neighborhood, city, state },
          status: 'success'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else {
      console.log(`❌ [NIGERIA-GEOCODE] Google Maps returned: ${data.status}`);
      throw new Error(`Geocoding failed: ${data.status}`);
    }

  } catch (error) {
    console.error(`❌ [NIGERIA-GEOCODE] Error:`, error);
    
    // Fallback: Return coordinates with Nigeria label
    return new Response(
      JSON.stringify({
        address: `Location in Nigeria (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        error: 'Geocoding service temporarily unavailable',
        status: 'error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
