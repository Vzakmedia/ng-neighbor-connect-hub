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
        
        // Comprehensive city/LGA lists for all states
        const stateCities: { [key: string]: string[] } = {
          'Lagos': [
            'Lagos Island', 'Lagos Mainland', 'Surulere', 'Ikeja', 'Oshodi-Isolo',
            'Mushin', 'Alimosho', 'Agege', 'Ifako-Ijaiye', 'Kosofe', 'Shomolu',
            'Ikorodu', 'Epe', 'Badagry', 'Ibeju-Lekki', 'Ojo', 'Amuwo-Odofin',
            'Apapa', 'Eti-Osa', 'Ajeromi-Ifelodun', 'Lekki', 'Victoria Island',
            'Yaba', 'Gbagada', 'Ojota', 'Magodo', 'Festac', 'Ajah', 'Ikoyi'
          ],
          'Federal Capital Territory': [
            'Abuja Municipal', 'Gwagwalada', 'Kuje', 'Abaji', 'Kwali', 'Bwari',
            'Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa', 'Nyanya',
            'Karu', 'Lugbe', 'Life Camp', 'Utako', 'Jabi', 'Katampe', 'Lokogoma'
          ],
          'Kano': [
            'Kano Municipal', 'Fagge', 'Dala', 'Gwale', 'Tarauni', 'Nassarawa',
            'Ungogo', 'Kumbotso', 'Warawa', 'Dawakin Kudu', 'Dawakin Tofa',
            'Doguwa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwarzo',
            'Kabo', 'Karaye', 'Kibiya', 'Kiru', 'Kura', 'Madobi', 'Makoda',
            'Minjibir', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila',
            'Takali', 'Tanbawal', 'Tsanyawa', 'Tudun Wada', 'Wudil'
          ],
          'Kaduna': [
            'Kaduna North', 'Kaduna South', 'Chikun', 'Igabi', 'Ikara', 'Jaba',
            'Jema\'a', 'Kachia', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru',
            'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga',
            'Soba', 'Zangon Kataf', 'Zaria', 'Birnin Gwari', 'Giwa'
          ],
          'Rivers': [
            'Port Harcourt', 'Obio-Akpor', 'Okrika', 'Ogu-Bolo', 'Eleme',
            'Tai', 'Gokana', 'Khana', 'Oyigbo', 'Opobo-Nkoro', 'Andoni',
            'Bonny', 'Degema', 'Asari-Toru', 'Akuku-Toru', 'Abua-Odual',
            'Ahoada East', 'Ahoada West', 'Ogba-Egbema-Ndoni', 'Emohua',
            'Ikwerre', 'Etche', 'Omuma'
          ],
          'Oyo': [
            'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East',
            'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North',
            'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola',
            'Lagelu', 'Ogbomoso North', 'Ogbomoso South', 'Ogo Oluwa', 'Olorunsogo',
            'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West',
            'Saki East', 'Saki West', 'Surulere', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda'
          ],
          'Katsina': [
            'Katsina', 'Daura', 'Funtua', 'Malumfashi', 'Kafur', 'Kaita',
            'Jibia', 'Mashi', 'Dutsi', 'Batsari', 'Rimi', 'Charanchi',
            'Dan Musa', 'Dandume', 'Danja', 'Faskari', 'Ingawa', 'Kankara',
            'Kankia', 'Kusada', 'Mai\'Adua', 'Matazu', 'Musawa', 'Safana',
            'Sabuwa', 'Sandamu', 'Zango', 'Baure', 'Bindawa', 'Dutsin Ma',
            'Kurfi', 'Mani'
          ],
          'Jigawa': [
            'Dutse', 'Hadejia', 'Kazaure', 'Gumel', 'Ringim', 'Birnin Kudu',
            'Garki', 'Babura', 'Birniwa', 'Buji', 'Gantsa', 'Gagarawa',
            'Guri', 'Gwaram', 'Jahun', 'Kafin Hausa', 'Kaugama', 'Kiri Kasama',
            'Kiyawa', 'Maigatari', 'Malam Madori', 'Miga', 'Roni', 'Sule Tankarkar',
            'Taura', 'Yankwashi', 'Auyo'
          ],
          'Borno': [
            'Maiduguri', 'Jere', 'Konduga', 'Bama', 'Gwoza', 'Dikwa',
            'Kala/Balge', 'Kukawa', 'Gubio', 'Guzamala', 'Magumeri', 'Ngala',
            'Kaga', 'Monguno', 'Nganzai', 'Chibok', 'Damboa', 'Biu',
            'Kwaya Kusar', 'Shani', 'Askira/Uba', 'Hawul', 'Bayo'
          ],
          'Yobe': [
            'Damaturu', 'Potiskum', 'Gashua', 'Nguru', 'Geidam', 'Bade',
            'Bursari', 'Fika', 'Fune', 'Gujba', 'Gulani', 'Jakusko',
            'Karasuwa', 'Machina', 'Nangere', 'Tarmuwa', 'Yunusari', 'Yusufari'
          ],
          'Bauchi': [
            'Bauchi', 'Azare', 'Misau', 'Jama\'are', 'Katagum', 'Zaki',
            'Gamawa', 'Dambam', 'Darazo', 'Ganjuwa', 'Kirfi', 'Alkaleri',
            'Bogoro', 'Dass', 'Tafawa Balewa', 'Warji', 'Ningi', 'Toro',
            'Giade', 'Shira'
          ],
          'Taraba': [
            'Jalingo', 'Wukari', 'Bali', 'Gassol', 'Ibi', 'Takum',
            'Donga', 'Ussa', 'Kurmi', 'Sardauna', 'Zing', 'Karim Lamido',
            'Lau', 'Yorro', 'Ardo Kola', 'Gashaka'
          ],
          'Adamawa': [
            'Yola North', 'Yola South', 'Fufore', 'Song', 'Girei', 'Gombi',
            'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo Belwa',
            'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng',
            'Toungo', 'Ganye', 'Demsa', 'Guyuk'
          ],
          'Gombe': [
            'Gombe', 'Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye',
            'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba'
          ],
          'Plateau': [
            'Jos North', 'Jos South', 'Jos East', 'Barikin Ladi', 'Riyom',
            'Bokkos', 'Mangu', 'Pankshin', 'Kanke', 'Kanam', 'Wase',
            'Langtang North', 'Langtang South', 'Mikang', 'Qua\'an Pan',
            'Shendam', 'Bassa'
          ],
          'Nasarawa': [
            'Lafia', 'Keffi', 'Akwanga', 'Nasarawa Egon', 'Nasarawa',
            'Wamba', 'Kokona', 'Awe', 'Doma', 'Keana', 'Karu', 'Obi', 'Toto'
          ],
          'Niger': [
            'Minna', 'Bida', 'Kontagora', 'Suleja', 'New Bussa', 'Agaie',
            'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati',
            'Gbako', 'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun',
            'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Muya', 'Paikoro',
            'Rafi', 'Rijau', 'Shiroro', 'Tafa', 'Wushishi'
          ],
          'Kwara': [
            'Ilorin East', 'Ilorin South', 'Ilorin West', 'Asa', 'Baruten',
            'Edu', 'Ekiti', 'Ifelodun', 'Irepodun', 'Isin', 'Kaiama',
            'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi'
          ],
          'Kogi': [
            'Lokoja', 'Ajaokuta', 'Okene', 'Olamaboro', 'Ogori/Magongo',
            'Adavi', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah',
            'Igalamela Odolu', 'Ijumu', 'Kabba/Bunu', 'Koton Karfe',
            'Mopa Muro', 'Ofu', 'Okene', 'Okehi', 'Okpo', 'Omala', 'Yagba East', 'Yagba West'
          ],
          'Benue': [
            'Makurdi', 'Gboko', 'Katsina-Ala', 'Vandikya', 'Guma', 'Tarka',
            'Buruku', 'Ukum', 'Logo', 'Oturkpo', 'Ohimini', 'Oju',
            'Okpokwu', 'Ogbadibo', 'Apa', 'Agatu', 'Ado', 'Obi',
            'Ushongo', 'Gwer East', 'Gwer West', 'Konshisha', 'Kwande'
          ],
          'Sokoto': [
            'Sokoto North', 'Sokoto South', 'Binji', 'Bodinga', 'Dange Shuni',
            'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela', 'Isa',
            'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame',
            'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo'
          ],
          'Kebbi': [
            'Birnin Kebbi', 'Aleiro', 'Arewa Dandi', 'Argungu', 'Augie',
            'Bagudo', 'Bunza', 'Dandi', 'Fakai', 'Gwandu', 'Jega',
            'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga',
            'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru'
          ],
          'Zamfara': [
            'Gusau', 'Tsafe', 'Bungudu', 'Maru', 'Bukkuyum', 'Anka',
            'Talata Mafara', 'Zurmi', 'Birnin Magaji/Kiyaw', 'Kaura Namoda',
            'Maradun', 'Bakura', 'Shinkafi', 'Gummi'
          ],
          'Cross River': [
            'Calabar Municipal', 'Calabar South', 'Akpabuyo', 'Bakassi', 'Bekwarra',
            'Biase', 'Boki', 'Etung', 'Ikom', 'Obanliku', 'Obubra',
            'Obudu', 'Odukpani', 'Ogoja', 'Yakurr', 'Yala', 'Akamkpa', 'Abi'
          ],
          'Akwa Ibom': [
            'Uyo', 'Ikot Ekpene', 'Eket', 'Oron', 'Abak', 'Eastern Obolo',
            'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan',
            'Ibeno', 'Ibesikpo Asutan', 'Ibiono-Ibom', 'Ika', 'Ikono',
            'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat-Enin',
            'Nsit-Atai', 'Nsit-Ibom', 'Nsit-Ubium', 'Obot Akara', 'Okobo',
            'Onna', 'Oron', 'Oruk Anam', 'Udung-Uko', 'Ukanafun', 'Uruan',
            'Urue-Offong/Oruko', 'Uyo'
          ],
          'Delta': [
            'Warri North', 'Warri South', 'Warri South West', 'Uvwie', 'Udu',
            'Okpe', 'Sapele', 'Ethiope East', 'Ethiope West', 'Ughelli North',
            'Ughelli South', 'Isoko North', 'Isoko South', 'Patani', 'Bomadi',
            'Burutu', 'Aniocha North', 'Aniocha South', 'Ika North East',
            'Ika South', 'Ndokwa East', 'Ndokwa West', 'Oshimili North',
            'Oshimili South', 'Ukwuani'
          ],
          'Edo': [
            'Benin City', 'Ikpoba Okha', 'Egor', 'Uhunmwonde', 'Ovia North-East',
            'Ovia South-West', 'Orhionmwon', 'Esan Central', 'Esan North-East',
            'Esan South-East', 'Esan West', 'Igueben', 'Ikpoba-Okha', 'Oredo',
            'Owan East', 'Owan West', 'Akoko-Edo', 'Etsako Central',
            'Etsako East', 'Etsako West'
          ],
          'Bayelsa': [
            'Yenagoa', 'Kolokuma/Opokuma', 'Southern Ijaw', 'Sagbama', 'Brass',
            'Nembe', 'Ogbia', 'Ekeremor'
          ],
          'Anambra': [
            'Awka North', 'Awka South', 'Anambra East', 'Anambra West', 'Anaocha',
            'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South',
            'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru',
            'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South',
            'Oyi', 'Aguata'
          ],
          'Imo': [
            'Owerri Municipal', 'Owerri North', 'Owerri West', 'Aboh Mbaise',
            'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North',
            'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano',
            'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba', 'Nkwerre',
            'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe',
            'Onuimo', 'Orlu', 'Orsu', 'Oru East', 'Oru West'
          ],
          'Abia': [
            'Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano',
            'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa',
            'Ohafia', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West',
            'Umuahia North', 'Umuahia South', 'Umu Nneochi'
          ],
          'Enugu': [
            'Enugu East', 'Enugu North', 'Enugu South', 'Aninri', 'Awgu',
            'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South',
            'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River',
            'Udenu', 'Udi', 'Uzo Uwani'
          ],
          'Ebonyi': [
            'Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North',
            'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara',
            'Ohaukwu', 'Onicha'
          ],
          'Ekiti': [
            'Ado Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West',
            'Emure', 'Gbonyin', 'Ido Osi', 'Ijero', 'Ikere', 'Ikole',
            'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye'
          ],
          'Ondo': [
            'Akoko North-East', 'Akoko North-West', 'Akoko South-West', 'Akoko South-East',
            'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore',
            'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa',
            'Ondo East', 'Ondo West', 'Ose', 'Owo'
          ],
          'Osun': [
            'Aiyedaade', 'Aiyedire', 'Atakumosa East', 'Atakumosa West', 'Boluwaduro',
            'Boripe', 'Ede North', 'Ede South', 'Egbedore', 'Ejigbo',
            'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Ifedayo',
            'Ifelodun', 'Ila', 'Ilesa East', 'Ilesa West', 'Irepodun',
            'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa',
            'Olorunda', 'Oriade', 'Orolu', 'Osogbo'
          ],
          'Ogun': [
            'Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North',
            'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North',
            'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko Afon',
            'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside',
            'Remo North', 'Shagamu'
          ]
        };
        
        if (stateCities[state]) {
          locations = stateCities[state].map(city => ({
            name: city,
            formatted_address: `${city}, ${state}, Nigeria`,
            place_id: `${state.toLowerCase().replace(/\s+/g, '_')}_${city.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_').replace(/'/g, '')}`,
            types: ['locality', 'political']
          }));
          break;
        }
        
        // Use multiple search strategies for better coverage
        const cityQueries = [
          `cities in ${state} state Nigeria`,
          `${state} state cities Nigeria`,
          `major towns ${state} Nigeria`,
          `local government areas ${state} Nigeria`,
          `LGA ${state} Nigeria`,
          `districts in ${state} Nigeria`
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
        // Comprehensive Nigerian neighborhoods database with detailed areas
        const nigerianNeighborhoods: { [key: string]: { [key: string]: string[] } } = {
          'Lagos': {
            'Lagos Island': ['Victoria Island', 'Ikoyi', 'Marina', 'Broad Street', 'Tafawa Balewa Square', 'CMS', 'Idumota', 'Balogun', 'Ereko', 'Epetedo'],
            'Victoria Island': ['Victoria Island Central', 'Bar Beach', 'Onikan', 'Tiamiyu Savage', 'Adeola Odeku', 'Ahmadu Bello Way', 'Akin Adesola', 'Ozumba Mbadiwe'],
            'Ikoyi': ['Ikoyi Phase 1', 'Ikoyi Phase 2', 'Banana Island', 'Old Ikoyi', 'Dolphin Estate', 'Parkview Estate', 'Osborne Foreshore'],
            'Eti-Osa': ['Lekki Phase 1', 'Lekki Phase 2', 'Lekki Peninsula', 'Ajah', 'VGC', 'Oniru', 'Jakande', 'Sangotedo', 'Bogije', 'Chevron Drive', 'Richmond Gate', 'Royal Garden Estate'],
            'Lekki': ['Lekki Phase 1', 'Lekki Phase 2', 'Lekki Peninsula Scheme', 'Abraham Adesanya', 'Admiralty Way', 'Chevron Drive', 'Osapa London', 'Agungi', 'Igbo Efon'],
            'Ajah': ['Ajah Central', 'Thomas Estate', 'Ado', 'Sangotedo', 'Lakowe', 'Awoyaya', 'Majek', 'Badore', 'Ilaje'],
            'Ikeja': ['Allen Avenue', 'Computer Village', 'Omole Phase 1', 'Omole Phase 2', 'Magodo GRA', 'Ogba', 'Oregun', 'Alausa', 'Adeniyi Jones', 'Ikeja GRA', 'Maryland'],
            'Surulere': ['Adeniran Ogunsanya', 'Bode Thomas', 'Iponri', 'Shitta', 'Aguda', 'Lawanson', 'Itire', 'Ojuelegba', 'Kilo', 'Enitan'],
            'Yaba': ['Sabo Yaba', 'Akoka', 'Somolu', 'Bariga', 'Jibowu', 'Oyingbo', 'Ebute Metta', 'Fadeyi'],
            'Gbagada': ['Gbagada Phase 1', 'Gbagada Phase 2', 'New Garage', 'Soluyi', 'Millenuim Estate', 'Pedro'],
            'Alimosho': ['Igando', 'Ikotun', 'Idimu', 'Egbe', 'Iyana Ipaja', 'Dopemu', 'Akowonjo', 'Shasha', 'Pipeline'],
            'Kosofe': ['Maryland', 'Anthony Village', 'Ojota', 'Ketu', 'Mile 12', 'Oworonshoki', 'Alapere'],
            'Ikorodu': ['Ikorodu Town', 'Sagamu Road', 'Igbogbo', 'Bayeku', 'Ijede', 'Agric', 'Ebute', 'Lasunwon'],
            'Agege': ['Agege Central', 'Pen Cinema', 'Mulero', 'Abule Egba', 'Oke Odo', 'Orile Agege'],
            'Ifako-Ijaiye': ['Ifako', 'Ijaiye', 'Fagba', 'Iju', 'Agbado', 'Alakuko'],
            'Shomolu': ['Shomolu Central', 'Palmgroove', 'Onipanu', 'Bajulaiye', 'Fadeyi'],
            'Mushin': ['Mushin Central', 'Papa Ajao', 'Odi Olowo', 'Isolo', 'Okota', 'Ajao Estate'],
            'Oshodi-Isolo': ['Oshodi', 'Isolo', 'Mafoluku', 'Airport Road', 'Ejigbo', 'Okota', 'Bucknor Estate'],
            'Badagry': ['Badagry Town', 'Seme Border', 'Ajara', 'Igbogbo', 'Topo', 'Gberefu'],
            'Epe': ['Epe Town', 'Noforija', 'Eredo', 'Ejinrin', 'Orimedu'],
            'Ibeju-Lekki': ['Awoyaya', 'Lakowe', 'Abijo', 'Bogije', 'Eleko', 'Igando Orudu', 'Elemoro'],
            'Ojo': ['Alaba', 'Okokomaiko', 'Agboju', 'LASU', 'Igbo Elerin', 'Ijanikin'],
            'Amuwo-Odofin': ['Mile 2', 'Festac Town', 'Satellite Town', 'Trade Fair', 'Kirikiri', 'Abule Ado'],
            'Apapa': ['Apapa Town', 'Liverpool', 'Marine Beach', 'Kirikiri', 'Tin Can Island', 'Warehouse'],
            'Ajeromi-Ifelodun': ['Ajegunle', 'Layeni', 'Tolu', 'Boundary', 'Orile'],
            'Magodo': ['Magodo Phase 1', 'Magodo Phase 2', 'CMD Road', 'Shangisha']
          },
          'Federal Capital Territory': {
            'Abuja Municipal': ['Maitama', 'Asokoro', 'Wuse Zone 1', 'Wuse Zone 2', 'Garki Area 1', 'Garki Area 2', 'Central Business District', 'Three Arms Zone', 'Guzape', 'Cadastral Zone'],
            'Maitama': ['Maitama District', 'Maitama Extension', 'Diplomatic Quarters'],
            'Asokoro': ['Asokoro District', 'Asokoro Extension'],
            'Wuse': ['Wuse Zone 1', 'Wuse Zone 2', 'Wuse Market'],
            'Garki': ['Garki Area 1', 'Garki Area 2', 'Garki Area 3', 'Garki Village'],
            'Gwarinpa': ['Gwarinpa Estate', 'Gwarinpa 1st Avenue', 'Gwarinpa 2nd Avenue'],
            'Kubwa': ['Kubwa FHA Estate', 'Kubwa Extension', 'Phase 1', 'Phase 2', 'Phase 3'],
            'Karu': ['New Karu', 'Old Karu', 'Masaka', 'One Man Village'],
            'Nyanya': ['Nyanya Town', 'Mararaba', 'New Nyanya'],
            'Lugbe': ['Lugbe District', 'Lugbe FHA', 'Trademore Estate'],
            'Life Camp': ['Life Camp Estate', 'Dape', 'Jikwoyi'],
            'Utako': ['Utako District', 'Jabi'],
            'Jabi': ['Jabi District', 'Utako'],
            'Katampe': ['Katampe Main', 'Katampe Extension'],
            'Lokogoma': ['Lokogoma District', 'Apo Legislative Quarters']
          },
          'Kano': {
            'Kano Municipal': ['Sabon Gari', 'Fagge', 'Kofar Mata', 'Kurmi Market', 'Emir\'s Palace', 'Railway Quarters', 'Race Course', 'Kantin Kwari'],
            'Fagge': ['Fagge Town', 'Yan Awaki', 'Gobirawa', 'Sharada', 'Kofar Mazugal'],
            'Dala': ['Dala Town', 'Kofar Mazugal', 'Kofar Na\'isa', 'Jakara', 'Rijiyar Lemo'],
            'Gwale': ['Gwale Town', 'Dorayi', 'Gwammaja', 'Hotoro', 'Yan Lemo'],
            'Nassarawa': ['Nassarawa Town', 'Bompai', 'Zoo Road', 'Hotoro', 'Naibawa'],
            'Ungogo': ['Ungogo Town', 'Bachirawa', 'Panshekara', 'Rijiyar Zaki', 'Karkasara'],
            'Tarauni': ['Tarauni Town', 'Yankaba', 'Unguwa Uku'],
            'Sabon Gari': ['Sabon Gari Central', 'Railway Quarters', 'Race Course']
          },
          'Rivers': {
            'Port Harcourt': ['GRA Phase 1', 'GRA Phase 2', 'Old GRA', 'New GRA', 'Mile 1', 'Mile 2', 'Mile 3', 'Mile 4', 'Trans Amadi', 'Diobu', 'D-Line', 'Rumuola'],
            'Obio-Akpor': ['Rumuola', 'Rumuogba', 'Choba', 'Aluu', 'Mgbuoba', 'Woji', 'Shell Location', 'Rumukrushi', 'Ada George'],
            'Okrika': ['Okrika Town', 'Bolo', 'George', 'Ogoloma', 'Oko'],
            'Eleme': ['Alesa', 'Agbonchia', 'Ebubu', 'Ogale', 'Eteo'],
            'Oyigbo': ['Oyigbo Town', 'Afam', 'Kom-Kom'],
            'Ikwerre': ['Isiokpo', 'Omagwa', 'Ipo', 'Aluu']
          },
          'Oyo': {
            'Ibadan North': ['Bodija', 'Agodi', 'Mokola', 'Sango', 'UI', 'Polytechnic'],
            'Ibadan South-West': ['Ring Road', 'Dugbe', 'Oke Ado', 'Challenge', 'Felele'],
            'Ibadan North-East': ['Iwo Road', 'New Garage', 'Beere', 'Oja\'ba'],
            'Ibadan South-East': ['Mapo', 'Oritamerin', 'Oke Offa', 'Isale Osun'],
            'Ibadan North-West': ['Onireke', 'Jericho', 'Iyaganku', 'Agbowo'],
            'Oluyole': ['Oluyole Estate', 'Kosobo', 'Idi Ishin', 'Jericho GRA']
          },
          'Kaduna': {
            'Kaduna North': ['Sabon Tasha', 'Malali', 'Tudun Wada', 'Unguwan Dosa', 'Television', 'Kakuri'],
            'Kaduna South': ['Barnawa', 'Narayi', 'Kawo', 'Ungwan Rimi', 'Junction Road'],
            'Chikun': ['Gonin Gora', 'Kujama', 'Nasarawa', 'Chikun'],
            'Igabi': ['Rigachikun', 'Turunku', 'Zangon Aya']
          },
          'Abuja': {
            'Gwagwalada': ['Gwagwalada Town', 'Dobi', 'Ibwa', 'Paiko', 'Phase 1', 'Phase 2', 'SCC'],
            'Kuje': ['Kuje Town', 'Rubochi', 'Yaba', 'Gudun Karya', 'Kuje Phase 1'],
            'Abaji': ['Abaji Town', 'Pandogari', 'Rimini', 'Yaba'],
            'Kwali': ['Kwali Town', 'Kilankwa', 'Yangoji', 'Dobi'],
            'Bwari': ['Kubwa', 'Dutse', 'Bwari Town', 'Zuba', 'Sabon Wuse', 'Byazhin', 'Ushafa']
          }
        };

        // First try to find neighborhoods in our Nigerian database
        if (nigerianNeighborhoods[state] && nigerianNeighborhoods[state][city]) {
          const cityNeighborhoods = nigerianNeighborhoods[state][city];
          locations = cityNeighborhoods
            .filter(neighborhood => 
              !query || neighborhood.toLowerCase().includes(query.toLowerCase())
            )
            .map(neighborhood => ({
              name: neighborhood,
              formatted_address: `${neighborhood}, ${city}, ${state}, Nigeria`,
              place_id: `ng_${state.toLowerCase().replace(/\s+/g, '_')}_${city.toLowerCase().replace(/\s+/g, '_')}_${neighborhood.toLowerCase().replace(/\s+/g, '_').replace(/'/g, '')}`,
              types: ['sublocality', 'political']
            }));
          
          // If we found matches in our database, return them
          if (locations.length > 0) {
            break;
          }
        }

        // Fallback to Google Places API with improved Nigerian search terms
        searchQuery = query ? 
          `${query} ${city} ${state} Nigeria` : 
          `neighborhoods ${city} ${state} Nigeria`;
          
        // Enhanced search strategies for Nigerian locations
        const neighborhoodQueries = [
          query ? `${query} ${city} ${state} Nigeria` : `areas in ${city} ${state} Nigeria`,
          query ? `${query} estate ${city} Nigeria` : `estates in ${city} ${state} Nigeria`,
          query ? `${query} district ${city} Nigeria` : `districts in ${city} ${state} Nigeria`,
          query ? `${query} GRA ${city} Nigeria` : `GRA ${city} ${state} Nigeria`,
          query ? `${query} phase ${city} Nigeria` : `phases in ${city} ${state} Nigeria`,
          query ? `${query} layout ${city} Nigeria` : `layouts in ${city} ${state} Nigeria`
        ];
        
        const allNeighborhoodResults = await Promise.all(
          neighborhoodQueries.slice(0, 4).map(async (searchQuery) => {
            try {
              const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
              placesUrl.searchParams.set('query', searchQuery);
              placesUrl.searchParams.set('key', apiKey);
              placesUrl.searchParams.set('region', 'ng');
              placesUrl.searchParams.set('type', 'sublocality');
              
              const response = await fetch(placesUrl.toString());
              const data = await response.json();
              
              if (data.status === 'OK') {
                // Filter results to ensure they're actually in Nigeria and the specified state/city
                return data.results.filter(result => {
                  const address = result.formatted_address?.toLowerCase() || '';
                  return address.includes('nigeria') && 
                         address.includes(state.toLowerCase()) &&
                         address.includes(city.toLowerCase());
                }) || [];
              }
              
              if (data.status === 'OVER_QUERY_LIMIT') {
                console.warn('Google Places API quota exceeded');
                return [];
              }
              
              return [];
            } catch (error) {
              console.error(`Error with neighborhood query "${searchQuery}":`, error);
              return [];
            }
          })
        );
        
        // Flatten and deduplicate results
        const allNeighborhoods = allNeighborhoodResults.flat();
        const uniqueNeighborhoods = allNeighborhoods.filter((area, index, self) => 
          index === self.findIndex(a => a.name?.toLowerCase() === area.name?.toLowerCase())
        );
        
        locations = uniqueNeighborhoods.slice(0, 25);
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