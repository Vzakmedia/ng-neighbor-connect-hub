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

// Major cities by state
const STATE_CITIES: { [key: string]: string[] } = {
  'Lagos': [
    'Lagos Island', 'Lagos Mainland', 'Surulere', 'Ikeja', 'Oshodi-Isolo',
    'Mushin', 'Alimosho', 'Agege', 'Ifako-Ijaiye', 'Kosofe', 'Shomolu',
    'Ikorodu', 'Epe', 'Badagry', 'Ibeju-Lekki', 'Ojo', 'Amuwo-Odofin',
    'Apapa', 'Eti-Osa', 'Ajeromi-Ifelodun', 'Lekki', 'Victoria Island',
    'Ikoyi', 'Yaba', 'Gbagada', 'Ajah', 'Maryland'
  ],
  'Federal Capital Territory': [
    'Abuja Municipal', 'Gwagwalada', 'Kuje', 'Abaji', 'Kwali', 'Bwari',
    'Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa', 'Nyanya',
    'Karu', 'Lugbe', 'Life Camp', 'Utako', 'Jabi'
  ],
  'Kano': [
    'Kano Municipal', 'Fagge', 'Dala', 'Gwale', 'Tarauni', 'Nassarawa',
    'Ungogo', 'Kumbotso', 'Warawa'
  ],
  'Rivers': [
    'Port Harcourt', 'Obio-Akpor', 'Okrika', 'Ogu-Bolo', 'Eleme',
    'Bonny', 'Degema'
  ],
  'Kaduna': [
    'Kaduna North', 'Kaduna South', 'Chikun', 'Igabi', 'Zaria', 'Sabon Gari'
  ],
  'Oyo': [
    'Ibadan North', 'Ibadan South', 'Ogbomoso', 'Oyo', 'Iseyin'
  ],
  'Abia': [
    'Aba North', 'Aba South', 'Umuahia North', 'Umuahia South'
  ],
  'Adamawa': [
    'Yola North', 'Yola South', 'Mubi North', 'Mubi South'
  ],
  'Akwa Ibom': [
    'Uyo', 'Ikot Ekpene', 'Eket', 'Oron'
  ],
  'Anambra': [
    'Awka', 'Onitsha', 'Nnewi', 'Ekwulobia'
  ],
  'Bauchi': [
    'Bauchi', 'Azare', 'Misau', 'Katagum'
  ],
  'Bayelsa': [
    'Yenagoa', 'Brass', 'Sagbama'
  ],
  'Benue': [
    'Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala'
  ],
  'Borno': [
    'Maiduguri', 'Bama', 'Biu'
  ],
  'Cross River': [
    'Calabar', 'Ikom', 'Ugep'
  ],
  'Delta': [
    'Asaba', 'Warri', 'Sapele', 'Ughelli'
  ],
  'Ebonyi': [
    'Abakaliki', 'Afikpo', 'Onueke'
  ],
  'Edo': [
    'Benin City', 'Auchi', 'Ekpoma', 'Uromi'
  ],
  'Ekiti': [
    'Ado-Ekiti', 'Ikere', 'Ijero', 'Ikole'
  ],
  'Enugu': [
    'Enugu', 'Nsukka', 'Oji River', 'Agbani'
  ],
  'Gombe': [
    'Gombe', 'Kumo', 'Deba', 'Bajoga'
  ],
  'Imo': [
    'Owerri', 'Orlu', 'Okigwe', 'Mbaise'
  ],
  'Jigawa': [
    'Dutse', 'Hadejia', 'Kazaure', 'Gumel'
  ],
  'Katsina': [
    'Katsina', 'Daura', 'Funtua', 'Malumfashi'
  ],
  'Kebbi': [
    'Birnin Kebbi', 'Argungu', 'Zuru', 'Yauri'
  ],
  'Kogi': [
    'Lokoja', 'Okene', 'Kabba', 'Idah'
  ],
  'Kwara': [
    'Ilorin', 'Offa', 'Omu-Aran', 'Jebba'
  ],
  'Nasarawa': [
    'Lafia', 'Keffi', 'Akwanga', 'Nasarawa'
  ],
  'Niger': [
    'Minna', 'Bida', 'Kontagora', 'Suleja'
  ],
  'Ogun': [
    'Abeokuta', 'Ijebu-Ode', 'Sagamu', 'Ota'
  ],
  'Ondo': [
    'Akure', 'Ondo', 'Owo', 'Okitipupa'
  ],
  'Osun': [
    'Osogbo', 'Ile-Ife', 'Ilesa', 'Ede'
  ],
  'Plateau': [
    'Jos', 'Bukuru', 'Pankshin', 'Shendam'
  ],
  'Sokoto': [
    'Sokoto', 'Gwadabawa', 'Tambuwal', 'Wurno'
  ],
  'Taraba': [
    'Jalingo', 'Wukari', 'Bali', 'Gembu'
  ],
  'Yobe': [
    'Damaturu', 'Potiskum', 'Gashua', 'Nguru'
  ],
  'Zamfara': [
    'Gusau', 'Kaura Namoda', 'Talata Mafara', 'Zurmi'
  ]
};

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
      // Comprehensive neighborhood data for major Nigerian cities
      const CITY_NEIGHBORHOODS: { [key: string]: string[] } = {
        'Lagos Island': ['Marina', 'Ikoyi', 'Victoria Island', 'Lekki Phase 1', 'Onikan', 'Falomo', 'Banana Island'],
        'Ikeja': ['GRA Ikeja', 'Allen Avenue', 'Opebi', 'Oregun', 'Alausa', 'Computer Village'],
        'Lekki': ['Lekki Phase 1', 'Lekki Phase 2', 'Ajah', 'Abraham Adesanya', 'Chevron', 'VGC'],
        'Garki': ['Garki 1', 'Garki 2', 'Area 1', 'Area 2', 'Area 3', 'Area 7', 'Area 8'],
        'Wuse': ['Wuse 1', 'Wuse 2', 'Wuse Zone 1', 'Wuse Zone 2', 'Wuse Zone 3'],
        'Gwarinpa': ['Gwarinpa 1st Avenue', 'Gwarinpa Estate', '3rd Avenue', '4th Avenue'],
        'Kubwa': ['Kubwa Phase 1', 'Kubwa Phase 2', 'Kubwa Phase 3', 'Byazhin'],
        'Port Harcourt': ['Old GRA', 'New GRA', 'Diobu', 'Trans Amadi', 'Rumuola'],
        'Kano Municipal': ['Kofar Mata', 'Kofar Nasarawa', 'Sabon Gari', 'Fagge'],
        'Ibadan North': ['Bodija', 'Sango', 'UI', 'Agbowo', 'Ajibode']
      };

      const neighborhoods = CITY_NEIGHBORHOODS[city] || 
        ['Central', 'North', 'South', 'East', 'West', 'GRA'];
      
      locations = neighborhoods.map((hood) => ({
        name: hood,
        formatted_address: `${hood}, ${city}, ${state}, Nigeria`,
        place_id: `neighborhood_${city.toLowerCase()}_${hood.toLowerCase().replace(/\s+/g, '_')}`,
        types: ['neighborhood']
      }));
      console.log(`✅ Returning ${locations.length} neighborhoods for ${city}, ${state}`);
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
