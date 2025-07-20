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

// Comprehensive list of all Nigerian states and FCT
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

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
    let locations: any[] = [];

    switch (type) {
      case 'states':
        // Return the predefined list of Nigerian states with enhanced data from Google Places
        console.log('Returning all Nigerian states');
        locations = await Promise.all(
          NIGERIAN_STATES.map(async (stateName) => {
            try {
              // Try to get additional info from Google Places for each state
              const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
              placesUrl.searchParams.set('query', `${stateName} state Nigeria`);
              placesUrl.searchParams.set('key', apiKey);
              placesUrl.searchParams.set('region', 'ng');
              placesUrl.searchParams.set('type', 'administrative_area_level_1');
              
              const response = await fetch(placesUrl.toString());
              const data = await response.json();
              
              if (data.status === 'OK' && data.results.length > 0) {
                const place = data.results[0];
                return {
                  name: stateName,
                  formatted_address: place.formatted_address || `${stateName}, Nigeria`,
                  place_id: place.place_id || `state_${stateName.toLowerCase().replace(/\s+/g, '_')}`,
                  types: place.types || ['administrative_area_level_1']
                };
              }
            } catch (error) {
              console.error(`Error fetching data for ${stateName}:`, error);
            }
            
            // Fallback to basic state info
            return {
              name: stateName,
              formatted_address: `${stateName}, Nigeria`,
              place_id: `state_${stateName.toLowerCase().replace(/\s+/g, '_')}`,
              types: ['administrative_area_level_1']
            };
          })
        );
        break;
        
      case 'cities':
        searchQuery = `major cities in ${state} state Nigeria`;
        
        // Use multiple search strategies for better coverage
        const cityQueries = [
          `cities in ${state} state Nigeria`,
          `${state} state cities Nigeria`,
          `major towns ${state} Nigeria`,
          `local government areas ${state} Nigeria`
        ];
        
        const allCityResults = await Promise.all(
          cityQueries.map(async (query) => {
            try {
              const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
              placesUrl.searchParams.set('query', query);
              placesUrl.searchParams.set('key', apiKey);
              placesUrl.searchParams.set('region', 'ng');
              placesUrl.searchParams.set('type', 'locality');
              
              const response = await fetch(placesUrl.toString());
              const data = await response.json();
              
              if (data.status === 'OK') {
                return data.results || [];
              }
              return [];
            } catch (error) {
              console.error(`Error with city query "${query}":`, error);
              return [];
            }
          })
        );
        
        // Flatten and deduplicate results
        const allCities = allCityResults.flat();
        const uniqueCities = allCities.filter((city, index, self) => 
          index === self.findIndex(c => c.name.toLowerCase() === city.name.toLowerCase())
        );
        
        locations = uniqueCities.slice(0, 50); // Increase limit for cities
        break;
        
      case 'neighborhoods':
        searchQuery = query ? 
          `${query} area ${city} ${state} Nigeria` : 
          `neighborhoods areas ${city} ${state} Nigeria`;
          
        // Use multiple search strategies for neighborhoods
        const neighborhoodQueries = [
          searchQuery,
          `${query || ''} estate ${city} ${state} Nigeria`,
          `${query || ''} district ${city} ${state} Nigeria`,
          `${query || ''} GRA ${city} ${state} Nigeria`
        ].filter(q => q.trim());
        
        const allNeighborhoodResults = await Promise.all(
          neighborhoodQueries.map(async (query) => {
            try {
              const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
              placesUrl.searchParams.set('query', query);
              placesUrl.searchParams.set('key', apiKey);
              placesUrl.searchParams.set('region', 'ng');
              
              const response = await fetch(placesUrl.toString());
              const data = await response.json();
              
              if (data.status === 'OK') {
                return data.results || [];
              }
              return [];
            } catch (error) {
              console.error(`Error with neighborhood query "${query}":`, error);
              return [];
            }
          })
        );
        
        // Flatten and deduplicate results
        const allNeighborhoods = allNeighborhoodResults.flat();
        const uniqueNeighborhoods = allNeighborhoods.filter((area, index, self) => 
          index === self.findIndex(a => a.name.toLowerCase() === area.name.toLowerCase())
        );
        
        locations = uniqueNeighborhoods.slice(0, 30);
        break;
        
      default:
        throw new Error('Invalid location type');
    }

    // For non-state queries, use the Google Places API
    if (type !== 'states' && locations.length === 0) {
      const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
      placesUrl.searchParams.set('query', searchQuery);
      placesUrl.searchParams.set('key', apiKey);
      placesUrl.searchParams.set('region', 'ng');
      
      if (type === 'neighborhoods') {
        placesUrl.searchParams.set('type', 'neighborhood');
      } else if (type === 'cities') {
        placesUrl.searchParams.set('type', 'locality');
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

      locations = data.results || [];
    }

    // Process and clean the results (skip for states as they're already processed)
    if (type !== 'states') {
      locations = locations
        .map((place: any) => {
          const addressComponents = place.formatted_address?.split(', ') || [];
          let name = place.name;
          
          // Clean up the name based on type
          if (type === 'cities') {
            // For cities, clean up the name
            name = place.name;
          } else if (type === 'neighborhoods') {
            // For neighborhoods, use the most specific name
            name = place.name;
          }

          return {
            name: name.trim(),
            formatted_address: place.formatted_address || `${name}, Nigeria`,
            place_id: place.place_id || `${type}_${name.toLowerCase().replace(/\s+/g, '_')}`,
            types: place.types || []
          };
        })
        .filter((location: any, index: number, self: any[]) => 
          // Remove duplicates by name
          index === self.findIndex((l: any) => l.name.toLowerCase() === location.name.toLowerCase())
        )
        .slice(0, type === 'cities' ? 50 : 30); // Different limits for different types
    }

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