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
            // Major Local Government Areas (LGAs)
            'Lagos Island', 'Lagos Mainland', 'Surulere', 'Ikeja', 'Oshodi-Isolo',
            'Mushin', 'Alimosho', 'Agege', 'Ifako-Ijaiye', 'Kosofe', 'Shomolu',
            'Ikorodu', 'Epe', 'Badagry', 'Ibeju-Lekki', 'Ojo', 'Amuwo-Odofin',
            'Apapa', 'Eti-Osa', 'Ajeromi-Ifelodun',
            // Major Districts and Areas
            'Lekki', 'Victoria Island', 'Ikoyi', 'Yaba', 'Gbagada', 'Ojota', 'Magodo',
            'Festac Town', 'Ajah', 'Maryland', 'Ikeja GRA', 'Anthony Village',
            'Mile 12', 'Ketu', 'Oworonshoki', 'Alapere', 'Berger', 'Ogba',
            'Isolo', 'Ejigbo', 'Idimu', 'Igando', 'Abule Egba', 'Oko-Oba',
            'Agbado', 'Iyana Ipaja', 'Egbeda', 'Akowonjo', 'Dopemu', 'Orile',
            'Mushin', 'Papa Ajao', 'Oshodi', 'Mafoluku', 'Airport Road',
            'Ikotun', 'Igbogbo', 'Ikorodu Town', 'Sagamu Road', 'Majek',
            'Sangotedo', 'Bogije', 'Awoyaya', 'Lakowe', 'Chevron Drive',
            'Alpha Beach', 'Igbo Efon', 'Abraham Adesanya', 'Thomas Estate',
            'Adeniyi Jones', 'Allen Avenue', 'Oregun', 'Opebi', 'Toyin Street',
            'Computer Village', 'Alausa', 'Secretariat', 'Omole Phase 1',
            'Omole Phase 2', 'Ogba Phase 1', 'Ogba Phase 2', 'Ifako-Gbagada',
            'New Garage', 'Jibowu', 'Fadeyi', 'Palmgrove', 'Onipanu',
            'Bariga', 'Somolu', 'Gbagada Phase 1', 'Gbagada Phase 2',
            'New Garage Gbagada', 'Pedro', 'Shomolu', 'Akoka', 'Abule Ijesha',
            'Ketu Mile 12', 'Owode', 'Lamgbasa', 'Agric', 'Kosofe',
            'Mile 2', 'Orile Iganmu', 'Alaba Market', 'Trade Fair',
            'Satellite Town', 'Festac Phase 1', 'Festac Phase 2', 'Festac Phase 3',
            'Amuwo Odofin', 'Kirikiri', 'Marine Beach', 'Apapa Road',
            'Tincan Island', 'Wharf', 'Liverpool', 'Creek Road', 'Broad Street',
            'Marina', 'Iddo', 'Ebute Metta', 'Yaba College', 'Akoka Yaba',
            'Sabo Yaba', 'Makoko', 'Otto', 'Iwaya', 'Dolphin Estate',
            'Ilupeju', 'Mushin Market', 'Ladipo Market', 'Oke Arin'
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
            'Kosofe': ['Maryland', 'Anthony Village', 'Ojota', 'Ketu', 'Mile 12', 'Oworonshoki', 'Alapere', 'Ogudu', 'Ogudu GRA', 'Ogudu Orioke', 'Lamgbasa'],
            'Ikorodu': ['Ikorodu Town', 'Sagamu Road', 'Igbogbo', 'Bayeku', 'Ijede', 'Agric', 'Ebute', 'Lasunwon', 'Ikorodu Garage', 'Erikorodo', 'Ewu Elepe'],
            'Agege': ['Agege Central', 'Pen Cinema', 'Mulero', 'Abule Egba', 'Oke Odo', 'Orile Agege', 'Agege Motor Road', 'Tabon Tabon'],
            'Ifako-Ijaiye': ['Ifako', 'Ijaiye', 'Fagba', 'Iju', 'Agbado', 'Alakuko', 'Meiran', 'Alagbado'],
            'Shomolu': ['Shomolu Central', 'Palmgroove', 'Onipanu', 'Bajulaiye', 'Fadeyi', 'Ilupeju', 'Pedro', 'Akoka Somolu'],
            'Mushin': ['Mushin Central', 'Papa Ajao', 'Odi Olowo', 'Isolo', 'Okota', 'Ajao Estate', 'Mushin Market', 'Ladipo Market'],
            'Oshodi-Isolo': ['Oshodi', 'Isolo', 'Mafoluku', 'Airport Road', 'Ejigbo', 'Okota', 'Bucknor Estate', 'Jakande Estate', 'Amuwo Oshodi'],
            'Badagry': ['Badagry Town', 'Seme Border', 'Ajara', 'Igbogbo', 'Topo', 'Gberefu', 'Akarakumo', 'Posukoh'],
            'Epe': ['Epe Town', 'Noforija', 'Eredo', 'Ejinrin', 'Orimedu', 'Poka', 'Odo Noforija'],
            'Ibeju-Lekki': ['Awoyaya', 'Lakowe', 'Abijo', 'Bogije', 'Eleko', 'Igando Orudu', 'Elemoro', 'Siriwon', 'Akodo'],
            'Ojo': ['Alaba', 'Okokomaiko', 'Agboju', 'LASU', 'Igbo Elerin', 'Ijanikin', 'Shibiri', 'Iba', 'Oto Awori'],
            'Amuwo-Odofin': ['Mile 2', 'Festac Town', 'Satellite Town', 'Trade Fair', 'Kirikiri', 'Abule Ado', 'Amuwo Estate', '23 Road'],
            'Apapa': ['Apapa Town', 'Liverpool', 'Marine Beach', 'Kirikiri', 'Tin Can Island', 'Warehouse', 'Creek Road', 'Wharf'],
            'Ajeromi-Ifelodun': ['Ajegunle', 'Layeni', 'Tolu', 'Boundary', 'Orile', 'Alakija', 'Olodi'],
            'Magodo': ['Magodo Phase 1', 'Magodo Phase 2', 'CMD Road', 'Shangisha', 'Magodo Brooks Estate'],
            'Ojota': ['Ojota Central', 'Ogudu', 'Ogudu GRA', 'Ogudu Orioke', 'Ketu', 'Mile 12', 'Lamgbasa']
          },
          'Federal Capital Territory': {
            'Abuja Municipal': ['Maitama', 'Asokoro', 'Wuse Zone 1', 'Wuse Zone 2', 'Garki Area 1', 'Garki Area 2', 'Garki Area 3', 'Central Business District', 'Three Arms Zone', 'Guzape', 'Cadastral Zone', 'City Gate', 'Jahi', 'Katampe'],
            'Maitama': ['Maitama District', 'Maitama Extension', 'Diplomatic Quarters', 'Shehu Yar\'Adua Way', 'Aguiyi Ironsi Way'],
            'Asokoro': ['Asokoro District', 'Asokoro Extension', 'Villa Nova Estate', 'Agura Hotel Area'],
            'Wuse': ['Wuse Zone 1', 'Wuse Zone 2', 'Wuse Market', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6', 'Zone 7'],
            'Garki': ['Garki Area 1', 'Garki Area 2', 'Garki Area 3', 'Garki Village', 'Area 7', 'Area 8', 'Area 10', 'Area 11'],
            'Gwarinpa': ['Gwarinpa Estate', 'Gwarinpa 1st Avenue', 'Gwarinpa 2nd Avenue', '3rd Avenue', '4th Avenue', '5th Avenue', '6th Avenue'],
            'Kubwa': ['Kubwa FHA Estate', 'Kubwa Extension', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Arab Road', 'Byazhin', 'Dawaki'],
            'Karu': ['New Karu', 'Old Karu', 'Masaka', 'One Man Village', 'Ado', 'Karshi', 'Gurku'],
            'Nyanya': ['Nyanya Town', 'Mararaba', 'New Nyanya', 'Karu Site', 'Aso Pada'],
            'Lugbe': ['Lugbe District', 'Lugbe FHA', 'Trademore Estate', 'Airport Road', 'Lugbe Main'],
            'Life Camp': ['Life Camp Estate', 'Dape', 'Jikwoyi', 'Kado Estate', 'Gishiri'],
            'Utako': ['Utako District', 'Jabi Lake', 'Jabi Motor Park'],
            'Jabi': ['Jabi District', 'Utako', 'Jabi Lake Mall Area', 'Gilmore'],
            'Katampe': ['Katampe Main', 'Katampe Extension', 'Hillcrest', 'Diplomatic Zone'],
            'Lokogoma': ['Lokogoma District', 'Apo Legislative Quarters', 'Apo Resettlement', 'Gaduwa'],
            'Gwagwalada': ['Gwagwalada Town', 'Dobi', 'Ibwa', 'Paiko', 'Phase 1', 'Phase 2', 'SCC', 'Staff Quarters', 'Zuba Road'],
            'Kuje': ['Kuje Town', 'Rubochi', 'Yaba', 'Gudun Karya', 'Kuje Phase 1', 'Chibiri', 'Kwaku'],
            'Abaji': ['Abaji Town', 'Pandogari', 'Rimini', 'Yaba', 'Agyana', 'Naharati'],
            'Kwali': ['Kwali Town', 'Kilankwa', 'Yangoji', 'Dobi', 'Sheda', 'Pai'],
            'Bwari': ['Kubwa', 'Dutse', 'Bwari Town', 'Zuba', 'Sabon Wuse', 'Byazhin', 'Ushafa', 'Mpape', 'Usuma']
          },
          'Kano': {
            'Kano Municipal': ['Sabon Gari', 'Fagge', 'Kofar Mata', 'Kurmi Market', 'Emir\'s Palace', 'Railway Quarters', 'Race Course', 'Kantin Kwari', 'Gyadi-Gyadi', 'Koki', 'Tudun Murtala'],
            'Fagge': ['Fagge Town', 'Yan Awaki', 'Gobirawa', 'Sharada', 'Kofar Mazugal', 'Rijiyar Lemo', 'Kwana Hudu'],
            'Dala': ['Dala Town', 'Kofar Mazugal', 'Kofar Na\'isa', 'Jakara', 'Rijiyar Lemo', 'Yammama', 'Goron Dutse'],
            'Gwale': ['Gwale Town', 'Dorayi', 'Gwammaja', 'Hotoro', 'Yan Lemo', 'Kofar Wambai', 'Tudun Fulani'],
            'Nassarawa': ['Nassarawa Town', 'Bompai', 'Zoo Road', 'Hotoro', 'Naibawa', 'Kano Club', 'Government House Area'],
            'Ungogo': ['Ungogo Town', 'Bachirawa', 'Panshekara', 'Rijiyar Zaki', 'Karkasara', 'Gayawa', 'Rijiya'],
            'Tarauni': ['Tarauni Town', 'Yankaba', 'Unguwa Uku', 'Kofar Ruwa', 'Kofar Kwaru'],
            'Sabon Gari': ['Sabon Gari Central', 'Railway Quarters', 'Race Course', 'Sauna', 'Agege'],
            'Dawakin Kudu': ['Dawakin Kudu Town', 'Tudun Waziri', 'Dawaki'],
            'Kumbotso': ['Kumbotso Town', 'Challawa', 'Panshekara Extension'],
            'Warawa': ['Warawa Town', 'Kofar Guga'],
            'Gwarzo': ['Gwarzo Town', 'Getso'],
            'Kiru': ['Kiru Town', 'Beli', 'Dabi']
          },
          'Rivers': {
            'Port Harcourt': ['GRA Phase 1', 'GRA Phase 2', 'Old GRA', 'New GRA', 'Mile 1', 'Mile 2', 'Mile 3', 'Mile 4', 'Trans Amadi', 'Diobu', 'D-Line', 'Rumuola', 'Artillery', 'Borikiri', 'Creek Road', 'Forces Avenue', 'Stadium Road', 'Aba Road'],
            'Obio-Akpor': ['Rumuola', 'Rumuogba', 'Choba', 'Aluu', 'Mgbuoba', 'Woji', 'Shell Location', 'Rumukrushi', 'Ada George', 'Rumuokwuta', 'Rumueme', 'Elimgbu', 'Ozuoba', 'Eagle Island'],
            'Okrika': ['Okrika Town', 'Bolo', 'George', 'Ogoloma', 'Oko', 'Bat Island', 'Krotown'],
            'Eleme': ['Alesa', 'Agbonchia', 'Ebubu', 'Ogale', 'Eteo', 'Alode', 'Akpajo'],
            'Oyigbo': ['Oyigbo Town', 'Afam', 'Kom-Kom', 'Ndele', 'Okoloma'],
            'Ikwerre': ['Isiokpo', 'Omagwa', 'Ipo', 'Aluu', 'Ubima', 'Apani'],
            'Bonny': ['Bonny Town', 'Finima', 'Hart Island'],
            'Degema': ['Degema Town', 'Bukuma', 'Ke'],
            'Ahoada East': ['Ahoada East Town', 'Edoha', 'Ihugbogo'],
            'Ahoada West': ['Ahoada West Town', 'Mbiama', 'Joinkrama']
          },
          'Oyo': {
            'Ibadan North': ['Bodija', 'Agodi', 'Mokola', 'Sango', 'UI', 'Polytechnic', 'Ojoo', 'Secretariat', 'Parliament Road', 'Yemetu'],
            'Ibadan South-West': ['Ring Road', 'Dugbe', 'Oke Ado', 'Challenge', 'Felele', 'Molete', 'Oritamerin', 'Oke Bola', 'Odo-ona', 'Akinyemi', 'Apata', 'Gate', 'Liberty Road', 'Oke Bola Estate', 'Total Garden', 'Gbaremu', 'Odo-ona Kekere', 'Odo-ona Elewe'],
            'Ibadan North-East': ['Iwo Road', 'New Garage', 'Beere', 'Oja\'ba', 'Sabo', 'Oyedepo', 'Agbeni'],
            'Ibadan South-East': ['Mapo', 'Oritamerin', 'Oke Offa', 'Isale Osun', 'Orita Challenge', 'Oke Ado'],
            'Ibadan North-West': ['Onireke', 'Jericho', 'Iyaganku', 'Agbowo', 'Bodija Market', 'Sango UI'],
            'Oluyole': ['Oluyole Estate', 'Kosobo', 'Idi Ishin', 'Jericho GRA', 'Ring Road Estate', 'Apete'],
            'Lagelu': ['Lalupon', 'Oyedeji', 'Sagbe'],
            'Akinyele': ['Moniya', 'Akinyele', 'Ojoo'],
            'Egbeda': ['Egbeda Town', 'Alakia', 'Olodo'],
            'Ona Ara': ['Akanran', 'Ona Ara', 'Olunloye'],
            'Ibadan Central': ['Mapo', 'Beere', 'Oja Oba', 'Isale Osun']
          },
          'Kaduna': {
            'Kaduna North': ['Sabon Tasha', 'Malali', 'Tudun Wada', 'Unguwan Dosa', 'Television', 'Kakuri', 'Hayin Banki', 'Rigasa', 'Doka', 'Barnawa', 'Romi', 'Narayi High Cost'],
            'Kaduna South': ['Barnawa', 'Narayi', 'Kawo', 'Ungwan Rimi', 'Junction Road', 'Panteka', 'Nasarawa', 'Angwan Maigero'],
            'Chikun': ['Gonin Gora', 'Kujama', 'Nasarawa', 'Chikun', 'Millennium City', 'Kurmin Mashi'],
            'Igabi': ['Rigachikun', 'Turunku', 'Zangon Aya', 'Rigasa', 'Ahmadu Bello Way'],
            'Zaria': ['Zaria City', 'Sabon Gari Zaria', 'Samaru', 'ABU Campus', 'Tudun Wada Zaria', 'Gyallesu'],
            'Soba': ['Soba Town', 'Rahama', 'Gimba'],
            'Makarfi': ['Makarfi Town', 'Gwarzo Road'],
            'Sabon Gari': ['Sabon Gari Zaria', 'Tudun Jukun', 'Unguwan Fatika']
          },
          'Katsina': {
            'Katsina': ['Katsina Central', 'GRA', 'Kwado Quarters', 'Kofar Guga', 'Kofar Kaura', 'Filin Hockey', 'Low Cost', 'Federal Secretariat', 'Central Market'],
            'Daura': ['Daura Town', 'Zango', 'Gidan Ango'],
            'Funtua': ['Funtua Town', 'Industrial Area', 'Mallam Yaro'],
            'Malumfashi': ['Malumfashi Town', 'Kafur Road'],
            'Kafur': ['Kafur Town', 'Dankama'],
            'Kaita': ['Kaita Town', 'Yandoma'],
            'Jibia': ['Jibia Town', 'Magama'],
            'Mashi': ['Mashi Town', 'Duma'],
            'Dutsi': ['Dutsi Town', 'Kyawa'],
            'Batsari': ['Batsari Town', 'Ruma']
          },
          'Jigawa': {
            'Dutse': ['Dutse Town', 'GRA', 'Central Market', 'Yalleman', 'Limawa', 'Takur'],
            'Hadejia': ['Hadejia Town', 'Central Market', 'Yalleman Hadejia'],
            'Kazaure': ['Kazaure Town', 'Roni Road'],
            'Gumel': ['Gumel Town', 'Maigatari Road'],
            'Ringim': ['Ringim Town', 'Sankara'],
            'Birnin Kudu': ['Birnin Kudu Town', 'Unguwar Gini'],
            'Garki': ['Garki Town', 'Miga Road'],
            'Babura': ['Babura Town', 'Kyambo']
          },
          'Borno': {
            'Maiduguri': ['Maiduguri Central', 'GRA', 'Monday Market', 'Pompomari', 'Bulumkutu', 'Gwange', 'Lamisula', 'Jiddari Polo', 'Post Office Area', 'Custom Area', 'Railway Quarters'],
            'Jere': ['Jere Town', 'Addamari', 'Dalori'],
            'Konduga': ['Konduga Town', 'Kawuri'],
            'Bama': ['Bama Town', 'Goniri'],
            'Gwoza': ['Gwoza Town', 'Pulka'],
            'Dikwa': ['Dikwa Town', 'Marte Road'],
            'Kukawa': ['Kukawa Town', 'Doro Gowon'],
            'Gubio': ['Gubio Town', 'Wagir'],
            'Monguno': ['Monguno Town', 'Geidam Road']
          },
          'Yobe': {
            'Damaturu': ['Damaturu Central', 'GRA', 'Central Market', 'Sabon Fegi', 'Nayinawa', 'Bindigari', 'Damboa Road'],
            'Potiskum': ['Potiskum Central', 'Central Market', 'Fika Road', 'Kano Road'],
            'Gashua': ['Gashua Town', 'Central Market'],
            'Nguru': ['Nguru Town', 'Hadejia Road'],
            'Geidam': ['Geidam Town', 'Central Market'],
            'Bade': ['Gashua', 'Bade LGA'],
            'Fika': ['Fika Town', 'Potiskum Road'],
            'Gujba': ['Gujba Town', 'Buni Yadi']
          },
          'Bauchi': {
            'Bauchi': ['Bauchi Central', 'GRA', 'Central Market', 'Yelwa', 'Muda Lawal', 'Fadaman Mada', 'Railway Quarters', 'Low Cost', 'Nasarawa Bauchi'],
            'Azare': ['Azare Town', 'Central Market', 'Katagum Road'],
            'Misau': ['Misau Town', 'Central Market'],
            'Jama\'are': ['Jama\'are Town', 'Azare Road'],
            'Katagum': ['Azare', 'Katagum LGA'],
            'Zaki': ['Katagum Area'],
            'Dass': ['Dass Town', 'Bogoro Road'],
            'Tafawa Balewa': ['Tafawa Balewa Town', 'Bununu'],
            'Alkaleri': ['Alkaleri Town', 'Futuk']
          },
          'Taraba': {
            'Jalingo': ['Jalingo Central', 'GRA', 'Central Market', 'Hammaruwa', 'Kona', 'Mayo Gwoi', 'Nukkai'],
            'Wukari': ['Wukari Town', 'Central Market', 'Hospital Road'],
            'Bali': ['Bali Town', 'Serti'],
            'Gassol': ['Mutum Biyu', 'Gassol LGA'],
            'Ibi': ['Ibi Town', 'Wukari Road'],
            'Takum': ['Takum Town', 'Chanchanji'],
            'Donga': ['Donga Town', 'Suntai'],
            'Ussa': ['Lissam', 'Ussa LGA']
          },
          'Adamawa': {
            'Yola North': ['Yola Town', 'GRA', 'Central Market', 'Jimeta', 'Karewa', 'Doubeli', 'Rumde'],
            'Yola South': ['Yola South LGA', 'Namtari'],
            'Fufore': ['Gurin', 'Fufore LGA'],
            'Song': ['Song Town', 'Zumo'],
            'Girei': ['Girei Town', 'Damare'],
            'Gombi': ['Gombi Town', 'Garkida'],
            'Hong': ['Hong Town', 'Hildi'],
            'Jada': ['Jada Town', 'Mayo Belwa Road'],
            'Mubi North': ['Mubi Town', 'Central Market', 'Vimtim'],
            'Mubi South': ['Mubi South LGA', 'Gella']
          },
          'Gombe': {
            'Gombe': ['Gombe Central', 'GRA', 'Central Market', 'Pantami', 'Jekadafari', 'Bolari', 'Tudun Hatsi'],
            'Akko': ['Kumo', 'Akko LGA'],
            'Balanga': ['Balanga Town', 'Kindiyo'],
            'Billiri': ['Billiri Town', 'Bare'],
            'Dukku': ['Dukku Town', 'Hashidu'],
            'Funakaye': ['Nafada Road'],
            'Kaltungo': ['Kaltungo Town', 'Shongom Road'],
            'Kwami': ['Kwami Town', 'Mallam Sidi']
          },
          'Plateau': {
            'Jos North': ['Jos Central', 'GRA', 'Central Market', 'Gangare', 'Tudun Wada Jos', 'Nassarawa Gwom', 'Jenta', 'Katako'],
            'Jos South': ['Bukuru', 'Gyel', 'Kugba', 'Vom', 'Zarazong'],
            'Jos East': ['Angware', 'Jos East LGA'],
            'Barikin Ladi': ['Gwol', 'Barikin Ladi LGA'],
            'Riyom': ['Riyom Town', 'Tahoss'],
            'Bokkos': ['Bokkos Town', 'Daffo'],
            'Mangu': ['Mangu Town', 'Kerang'],
            'Pankshin': ['Pankshin Town', 'Chip'],
            'Kanke': ['Kanke Town', 'Kwolla'],
            'Kanam': ['Kanam Town', 'Dengi']
          },
          'Nasarawa': {
            'Lafia': ['Lafia Central', 'GRA', 'Central Market', 'Tudun Gwandara', 'Shabu', 'Makama'],
            'Keffi': ['Keffi Town', 'Central Market', 'Angwan Kwandare'],
            'Akwanga': ['Akwanga Town', 'Central Market'],
            'Nasarawa Egon': ['Nasarawa Egon Town', 'Loko'],
            'Nasarawa': ['Nasarawa Town', 'Central Market'],
            'Wamba': ['Wamba Town', 'Arikya'],
            'Kokona': ['Garaku', 'Kokona LGA'],
            'Awe': ['Awe Town', 'Keana Road'],
            'Doma': ['Doma Town', 'Awe Road']
          },
          'Niger': {
            'Minna': ['Minna Central', 'GRA', 'Central Market', 'Tunga', 'Sauka Kahuta', 'Limawa', 'Kpakungu', 'Chanchaga', 'Bosso Estate'],
            'Bida': ['Bida Town', 'Central Market', 'Emirs Palace Area', 'Railway Station'],
            'Kontagora': ['Kontagora Town', 'Central Market', 'Emir\'s Palace'],
            'Suleja': ['Suleja Town', 'Madalla', 'Kagini', 'Gwagwa', 'Hassan Dalhat Road'],
            'New Bussa': ['New Bussa Town', 'Wawa'],
            'Agaie': ['Agaie Town', 'Lapai Road'],
            'Bosso': ['Maikunkele', 'Bosso LGA'],
            'Chanchaga': ['Tunga', 'Chanchaga LGA'],
            'Mokwa': ['Mokwa Town', 'Central Market'],
            'Lapai': ['Lapai Town', 'Agaie Road']
          }
        };

        // Add more states with neighborhoods
        const additionalStates = {
          'Kwara': {
            'Ilorin East': ['Ilorin Central', 'GRA', 'Central Market', 'Amilegbe', 'Tanke', 'Fate Road', 'Unity Road'],
            'Ilorin South': ['Ilorin South LGA', 'Adewole Estate', 'Challenge'],
            'Ilorin West': ['Ilorin West LGA', 'Oja Oba Market', 'Post Office Area'],
            'Asa': ['Afon', 'Asa LGA'],
            'Offa': ['Offa Town', 'Central Market', 'Irra Road'],
            'Edu': ['Lafiagi', 'Edu LGA'],
            'Baruten': ['Okuta', 'Baruten LGA'],
            'Ekiti': ['Araromi', 'Ekiti LGA Kwara'],
            'Ifelodun': ['Share', 'Ifelodun LGA'],
            'Irepodun': ['Omu-Aran', 'Ajasse']
          },
          'Kogi': {
            'Lokoja': ['Lokoja Central', 'GRA', 'Felele', 'Phase 1', 'Phase 2', 'Ganaja', 'Adankolo', 'Crusher'],
            'Ajaokuta': ['Ajaokuta Town', 'Steel Town'],
            'Okene': ['Okene Town', 'Central Market', 'Obehira'],
            'Ankpa': ['Ankpa Town', 'Central Market'],
            'Dekina': ['Dekina Town', 'Anyigba'],
            'Idah': ['Idah Town', 'Ugwolawo'],
            'Kabba/Bunu': ['Kabba Town', 'Bunu'],
            'Koton Karfe': ['Koton Karfe Town'],
            'Ofu': ['Ugwolawo', 'Ofu LGA'],
            'Yagba East': ['Isanlu', 'Egbe'],
            'Yagba West': ['Odo Ere', 'Yagba West LGA']
          },
          'Cross River': {
            'Calabar Municipal': ['Calabar Central', 'GRA', 'Watt Market', 'Mary Slessor Avenue', 'Murtala Mohammed Highway', 'IBB Way'],
            'Calabar South': ['Calabar South LGA', 'Ikot Ansa'],
            'Akpabuyo': ['Ikang', 'Akpabuyo LGA'],
            'Bakassi': ['Bakassi Peninsula'],
            'Ikom': ['Ikom Town', 'Central Market'],
            'Ogoja': ['Ogoja Town', 'Central Market'],
            'Obudu': ['Obudu Town', 'Obudu Ranch'],
            'Odukpani': ['Odukpani Town', 'Creek Town'],
            'Yakurr': ['Ugep', 'Yakurr LGA'],
            'Yala': ['Yala Town', 'Okpoma']
          }
        };

        // Merge additional states
        Object.assign(nigerianNeighborhoods, additionalStates);

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