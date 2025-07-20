import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { type, state, city, query }: LocationRequest = await req.json();
    console.log(`Fetching ${type} for`, { state, city, query });

    let searchQuery = '';
    let componentRestrictions = 'country:ng'; // Restrict to Nigeria

    switch (type) {
      case 'states':
        searchQuery = 'state in Nigeria';
        break;
      case 'cities':
        searchQuery = `city in ${state}, Nigeria`;
        componentRestrictions += `|administrative_area:${state}`;
        break;
      case 'neighborhoods':
        searchQuery = query ? 
          `${query} neighborhood in ${city}, ${state}, Nigeria` : 
          `neighborhood in ${city}, ${state}, Nigeria`;
        componentRestrictions += `|administrative_area:${state}|locality:${city}`;
        break;
      default:
        throw new Error('Invalid location type');
    }

    // Use Google Places API Text Search
    const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    placesUrl.searchParams.set('query', searchQuery);
    placesUrl.searchParams.set('key', apiKey);
    placesUrl.searchParams.set('region', 'ng');
    
    if (type === 'neighborhoods') {
      placesUrl.searchParams.set('type', 'neighborhood');
    } else if (type === 'cities') {
      placesUrl.searchParams.set('type', 'locality');
    } else {
      placesUrl.searchParams.set('type', 'administrative_area_level_1');
    }

    console.log('Calling Google Places API:', placesUrl.toString());
    
    const response = await fetch(placesUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data);
      return new Response(
        JSON.stringify({ error: `Google Places API error: ${data.status}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process and clean the results
    const locations = data.results
      .map((place: any) => {
        const addressComponents = place.formatted_address.split(', ');
        let name = place.name;
        
        // Clean up the name based on type
        if (type === 'states') {
          // For states, get the state name from address components
          const stateComponent = addressComponents.find((comp: string) => 
            comp.includes('State') || comp === place.name
          );
          name = stateComponent || place.name;
          if (name.includes('State')) {
            name = name.replace(' State', '');
          }
        } else if (type === 'cities') {
          // For cities, clean up the name
          name = place.name;
        } else if (type === 'neighborhoods') {
          // For neighborhoods, use the most specific name
          name = place.name;
        }

        return {
          name: name.trim(),
          formatted_address: place.formatted_address,
          place_id: place.place_id,
          types: place.types
        };
      })
      .filter((location: any, index: number, self: any[]) => 
        // Remove duplicates by name
        index === self.findIndex((l: any) => l.name.toLowerCase() === location.name.toLowerCase())
      )
      .slice(0, 20); // Limit results

    console.log(`Found ${locations.length} ${type}:`, locations.map(l => l.name));

    return new Response(
      JSON.stringify({ locations, status: 'success' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in nigeria-locations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});