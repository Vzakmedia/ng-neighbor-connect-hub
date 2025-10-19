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
    console.log(`Reverse geocoding: ${latitude}, ${longitude}`);

    // Validate coordinates are in Nigeria
    if (
      latitude < NIGERIA_BOUNDS.south || 
      latitude > NIGERIA_BOUNDS.north ||
      longitude < NIGERIA_BOUNDS.west || 
      longitude > NIGERIA_BOUNDS.east
    ) {
      console.warn('⚠️ Coordinates outside Nigeria bounds');
      return new Response(
        JSON.stringify({ 
          address: 'Location outside Nigeria',
          status: 'out_of_bounds'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ Google Maps API key not configured');
      throw new Error('Google Maps API key not configured');
    }

    // Use Google Maps Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&region=ng&language=en`;
    
    console.log('📍 Calling Google Maps Geocoding API...');
    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Google Maps response status:', data.status);

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Get the most specific address
      const result = data.results[0];
      let address = result.formatted_address;

      // Format Nigerian address style: "Neighborhood, City, State, Nigeria"
      const addressComponents = result.address_components;
      const neighborhood = addressComponents.find((c: any) => 
        c.types.includes('neighborhood') || c.types.includes('sublocality')
      )?.long_name;
      
      const city = addressComponents.find((c: any) => 
        c.types.includes('locality') || c.types.includes('administrative_area_level_2')
      )?.long_name;
      
      const state = addressComponents.find((c: any) => 
        c.types.includes('administrative_area_level_1')
      )?.long_name;

      // Construct Nigerian-style address
      if (state) {
        const parts: string[] = [];
        if (neighborhood) parts.push(neighborhood);
        if (city && city !== neighborhood) parts.push(city);
        if (state) parts.push(state);
        parts.push('Nigeria');
        
        address = parts.join(', ');
      }

      console.log('✅ Address found:', address);
      
      return new Response(
        JSON.stringify({ 
          address,
          formatted_address: result.formatted_address,
          neighborhood,
          city,
          state,
          status: 'success'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fallback: Try alternative geocoding service
    console.log('⚠️ Google Maps failed, trying fallback...');
    const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    
    const fallbackResponse = await fetch(fallbackUrl);
    
    if (!fallbackResponse.ok) {
      throw new Error('Fallback geocoding also failed');
    }

    const fallbackData = await fallbackResponse.json();
    const fallbackAddress = fallbackData.locality || 
                           fallbackData.city || 
                           fallbackData.principalSubdivision || 
                           `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    console.log('✅ Fallback address:', fallbackAddress);

    return new Response(
      JSON.stringify({ 
        address: fallbackAddress + ', Nigeria',
        status: 'fallback'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        address: 'Unable to determine address',
        status: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
