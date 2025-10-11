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
  console.log(`📍 [LOCATIONS] Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ [LOCATIONS] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📝 [LOCATIONS] Processing request...');
    const { type, state, city, query }: LocationRequest = await req.json();
    console.log(`🔍 [LOCATIONS] Fetching ${type} for:`, { state, city, query });

    let locations: any[] = [];

    switch (type) {
      case 'states':
        // Return the predefined list of Nigerian states immediately (no API calls needed)
        console.log('📋 [LOCATIONS] Returning Nigerian states list');
        locations = NIGERIAN_STATES.map((stateName) => ({
          name: stateName,
          formatted_address: `${stateName}, Nigeria`,
          place_id: `state_${stateName.toLowerCase().replace(/\s+/g, '_')}`,
          types: ['administrative_area_level_1']
        }));
        console.log(`✅ [LOCATIONS] Returned ${locations.length} states`);
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
            'Lagos Island': ['Victoria Island', 'Ikoyi', 'Marina', 'Broad Street', 'Tafawa Balewa Square', 'CMS', 'Idumota', 'Balogun', 'Ereko', 'Epetedo', 'Adeniji Adele', 'Olowogbowo', 'Obalende', 'Tafawa Balewa Square', 'Catholic Mission Street', 'Commercial Avenue', 'Creek Road', 'Docemo Street', 'Elephant House', 'Isale Eko', 'King George V Road', 'Lagos Island Central Mosque', 'Marina Lagos', 'National Theatre Road', 'Nnamdi Azikiwe Street', 'Okokomaiko Street', 'Tinubu Square'],
            'Victoria Island': ['Victoria Island Central', 'Bar Beach', 'Onikan', 'Tiamiyu Savage', 'Adeola Odeku', 'Ahmadu Bello Way', 'Akin Adesola', 'Ozumba Mbadiwe', 'Kofo Abayomi', 'Sanusi Fafunwa', 'Adetokunbo Ademola', 'Gerrard Road', 'Idejo Street', 'Karimu Kotun', 'Kingsway Road', 'Ligali Ayorinde', 'Maroko Road', 'Saka Tinubu', 'Sinari Daranijo', 'Adeola Hopewell', 'Alfred Rewane Road', 'Danube Street', 'Elsie Femi-Pearse', 'Globacom Towers', 'Heritage Place', 'Water Corporation Drive', 'Churchgate Towers', 'Eko Atlantic', 'Festival Road', 'Lekki-Ikoyi Link Bridge'],
            'Ikoyi': ['Ikoyi Phase 1', 'Ikoyi Phase 2', 'Banana Island', 'Old Ikoyi', 'Dolphin Estate', 'Parkview Estate', 'Osborne Foreshore', 'Bourdillon Road', 'Cameron Road', 'Cooper Road', 'Falomo', 'Foreshore Estate', 'Gerard Road', 'Kingsway Road', 'Milverton Road', 'Raymond Njoku', 'Ribadu Road', 'Turnbull Road', 'Walter Carrington Crescent', 'Awolowo Road', 'Queens Drive', 'Alexander Avenue', 'Banana Island Foreshore', 'Ocean Parade Towers', 'Parkview Ikoyi', 'Temple Road', 'Glover Road', 'MacPherson Avenue', 'Norman Williams Street', 'Oyinkan Abayomi Drive'],
            'Eti-Osa': ['Lekki Phase 1', 'Lekki Phase 2', 'Lekki Peninsula', 'Ajah', 'VGC', 'Oniru', 'Jakande', 'Sangotedo', 'Bogije', 'Chevron Drive', 'Richmond Gate', 'Royal Garden Estate', 'Amen Estate', 'Pinnock Beach Estate', 'Chevron Alternative Route', 'Orchid Hotel Road', 'Victoria Garden City', 'New Road', 'Circle Mall Area', 'Igbo Efon', 'Lekki-Epe Expressway', 'Conservation Centre', 'Atlantic View Estate', 'Oko Ado', 'Shoprite Road', 'Eleganza', 'Ilasan', 'Igbo Efon Lekki', 'Oniru Estate', 'Oniru Private Beach', 'Kuramo Beach', 'La Campagne Tropicana', 'Lakowe Lakes Golf Course', 'Pan Ocean Estate', 'Residential Zone 1', 'Residential Zone 2'],
            'Lekki': ['Lekki Phase 1', 'Lekki Phase 2', 'Lekki Peninsula Scheme', 'Abraham Adesanya', 'Admiralty Way', 'Chevron Drive', 'Osapa London', 'Agungi', 'Igbo Efon', 'Lekki Gardens Estate', 'Pearl Gardens', 'Crown Estate', 'Meadow Hall', 'Pinnock Beach Estate', 'Lekki County Homes', 'Victoria Crest Estate', 'Ocean Bay Estate', 'Lekki Royal Garden', 'Greenland Estate', 'Fara Park Estate', 'Lekki Scheme 2', 'Lekki Gardens Phase 1', 'Lekki Gardens Phase 2', 'Lekki Gardens Phase 3', 'Bluewater Scheme', 'Lekki Toll Gate', 'Alpha Beach Road', 'Chevron Alternative Route', 'Monastery Road', 'Admiralty Way Extension', 'Lekki-Epe Expressway', 'Orchid Hotel Road', 'Freedom Way', 'Kusenla Road', 'Kayode Otitoju Street', 'Hakeem Dickson Link Road', 'Lekki Peninsula Resort', 'Lekki Conservation Centre'],
            'Ajah': ['Ajah Central', 'Thomas Estate', 'Ado', 'Sangotedo', 'Lakowe', 'Awoyaya', 'Majek', 'Badore', 'Ilaje', 'Graceland Estate', 'Coscharis', 'Ajah Market', 'Ajah Roundabout', 'Lekki Gardens Phase 4', 'Ogombo', 'Ogombo Road', 'Ajah Bus Stop', 'Spar Road Ajah', 'Ajah Link Bridge', 'Abraham Adesanya Roundabout', 'Lekki Conservation Centre', 'Eleko Beach', 'Ajah under Bridge', 'New Road Ajah', 'Ajah Modern Market', 'Eko Akete', 'Southpointe Estate', 'Meridian Park Estate', 'Okun Ajah', 'Ajah Beach', 'Beachland Estate', 'Lekki Scheme 1'],
            'Ikeja': ['Allen Avenue', 'Computer Village', 'Omole Phase 1', 'Omole Phase 2', 'Magodo GRA', 'Ogba', 'Oregun', 'Alausa', 'Adeniyi Jones', 'Ikeja GRA', 'Maryland', 'Opebi', 'Toyin Street', 'Isaac John Street', 'Mobolaji Bank Anthony Way', 'Obafemi Awolowo Way', 'Lagos State Secretariat', 'Murtala Muhammed Airport', 'Ikeja Shopping Mall', 'City Mall', 'Palms Shopping Mall', 'Sheraton Hotel Area', 'Central Business District', 'Medical Road', 'Aromire Avenue', 'Bank PHB Crescent', 'Billings Way', 'CMD Road', 'Kodesoh Street', 'Oba Akran Avenue', 'WEMPCO Road', 'VI Extension', 'Acme Road', 'Awolowo Road Extension', 'Cement Bus Stop'],
            'Surulere': ['Adeniran Ogunsanya', 'Bode Thomas', 'Iponri', 'Shitta', 'Aguda', 'Lawanson', 'Itire', 'Ojuelegba', 'Kilo', 'Enitan', 'Alaka', 'Alaka Estate', 'Barracks', 'Coker', 'Eric Moore', 'Ijesha', 'Ijeshatedo', 'Kilo-Marsha', 'Ogunlana Drive', 'Randle Avenue', 'Stadium', 'Surulere Industrial Estate', 'Tapa', 'Willoughby', 'Adelabu', 'Akerele', 'Baale', 'Bankole', 'Bode Thomas Estate', 'Funsho Williams Avenue', 'Gbaja', 'Idi Araba', 'Masha', 'National Theatre', 'Ojuelegba Under Bridge', 'Shitta Market', 'Mushin Link Bridge', 'Iponri Estate', 'Surulere Market'],
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

        // Add comprehensive neighborhoods for all remaining states
        const additionalStates = {
          'Benue': {
            'Makurdi': ['Makurdi Central', 'GRA', 'North Bank', 'Wadata', 'Kanshio', 'Ankpa Quarters', 'Modern Market', 'Federal Low Cost', 'High Level', 'New GRA', 'University of Agriculture', 'NKST Hospital Area', 'Mobile Barracks', 'Railway Quarters', 'Judges Quarters', 'Prison Area', 'Wurukum', 'Old GRA', 'Harmony Estate'],
            'Gboko': ['Gboko Central', 'Central Market', 'NKST Hospital', 'Yandev', 'Tongov', 'Ukum Road', 'Katsina-Ala Road'],
            'Katsina-Ala': ['Katsina-Ala Town', 'Central Market', 'Takad', 'Zaki-Biam'],
            'Vandikya': ['Vandikya Town', 'Tse-Agberagba', 'Mbayongo'],
            'Guma': ['Guma Town', 'Daudu', 'Abinsi'],
            'Tarka': ['Tarka Town', 'Wannune', 'Gyado'],
            'Ukum': ['Zaki-Biam', 'Ukum LGA'],
            'Logo': ['Logo Town', 'Ugba', 'Tombo'],
            'Oturkpo': ['Oturkpo Town', 'Central Market', 'Oju Road'],
            'Oju': ['Oju Town', 'Obi', 'Ito'],
            'Okpokwu': ['Okpokwu Town', 'Ichama']
          },
          'Sokoto': {
            'Sokoto North': ['Sokoto Central', 'Central Market', 'Emir\'s Palace', 'GRA', 'Arkilla', 'Runjin Sambo', 'Magajin Gari', 'Sultan Bello Road', 'Mabera', 'Sama Road', 'Tudun Wada Sokoto'],
            'Sokoto South': ['Sokoto South LGA', 'Gagi', 'Kalambaina'],
            'Bodinga': ['Bodinga Town', 'Central Market'],
            'Dange Shuni': ['Dange', 'Shuni'],
            'Gada': ['Gada Town', 'Gigane'],
            'Goronyo': ['Goronyo Town', 'Shinaka'],
            'Gudu': ['Gudu Town', 'Balle'],
            'Gwadabawa': ['Gwadabawa Town', 'Mammande'],
            'Illela': ['Illela Town', 'Giere'],
            'Isa': ['Isa Town', 'Dogon Bauchi'],
            'Kebbe': ['Kebbe Town', 'Dandi'],
            'Kware': ['Kware Town', 'Hubbare'],
            'Rabah': ['Rabah Town', 'Yabo Road'],
            'Sabon Birni': ['Sabon Birni Town', 'Gandi'],
            'Silame': ['Silame Town', 'Torankawa'],
            'Tambuwal': ['Tambuwal Town', 'Central Market'],
            'Tureta': ['Tureta Town', 'Gummi Road'],
            'Wamako': ['Wamako Town', 'Dundaye'],
            'Wurno': ['Wurno Town', 'Achida'],
            'Yabo': ['Yabo Town', 'Dinawa']
          },
          'Kebbi': {
            'Birnin Kebbi': ['Birnin Kebbi Central', 'GRA', 'Central Market', 'Emir\'s Palace', 'Federal Secretariat', 'Gwadangaji', 'Nassarawa', 'Tudun Wada Kebbi', 'Police Barracks', 'Prison Road'],
            'Aleiro': ['Aleiro Town', 'Central Market'],
            'Argungu': ['Argungu Town', 'Central Market', 'Fishing Festival Ground'],
            'Augie': ['Augie Town', 'Tuga'],
            'Bagudo': ['Bagudo Town', 'Suru'],
            'Bunza': ['Bunza Town', 'Kyanga'],
            'Dandi': ['Dandi Town', 'Makera'],
            'Fakai': ['Fakai Town', 'Mahuta'],
            'Gwandu': ['Gwandu Town', 'Birnin Kebbi Road'],
            'Jega': ['Jega Town', 'Central Market'],
            'Kalgo': ['Kalgo Town', 'Dankaba'],
            'Maiyama': ['Maiyama Town', 'Koko'],
            'Sakaba': ['Sakaba Town', 'Wasagu'],
            'Shanga': ['Shanga Town', 'Rini'],
            'Yauri': ['Yauri Town', 'Central Market'],
            'Zuru': ['Zuru Town', 'Central Market', 'Senchi']
          },
          'Zamfara': {
            'Gusau': ['Gusau Central', 'GRA', 'Central Market', 'Emir\'s Palace', 'Samaru', 'Damba', 'Tudun Wada Gusau', 'Sabon Gida', 'Low Cost', 'Federal Secretariat', 'Prison Road', 'Police Area Command'],
            'Tsafe': ['Tsafe Town', 'Faru'],
            'Bungudu': ['Bungudu Town', 'Kwali'],
            'Maru': ['Maru Town', 'Dansadau'],
            'Bukkuyum': ['Bukkuyum Town', 'Gummi'],
            'Anka': ['Anka Town', 'Gayari'],
            'Talata Mafara': ['Talata Mafara Town', 'Moriki'],
            'Zurmi': ['Zurmi Town', 'Rawayya'],
            'Birnin Magaji/Kiyaw': ['Birnin Magaji', 'Kiyaw'],
            'Kaura Namoda': ['Kaura Namoda Town', 'Central Market'],
            'Maradun': ['Maradun Town', 'Dankurmi'],
            'Bakura': ['Bakura Town', 'Jangebe'],
            'Shinkafi': ['Shinkafi Town', 'Kurya'],
            'Gummi': ['Gummi Town', 'Bukkuyum Road']
          },
          'Akwa Ibom': {
            'Uyo': ['Uyo Central', 'GRA', 'Central Market', 'Ibom Plaza', 'Nwaniba Road', 'Abak Road', 'Wellington Bassey Way', 'Udo Udoma Avenue', 'Aka Road', 'Use Offot', 'Four Lane', 'Aka Offot', 'Shelter Afrique', 'Osongama Estate', 'AKSU Campus'],
            'Ikot Ekpene': ['Ikot Ekpene Central', 'Central Market', 'Obot Akara Road'],
            'Eket': ['Eket Central', 'Central Market', 'Mobil Road', 'QIT area'],
            'Oron': ['Oron Town', 'Central Market', 'Maritime Academy'],
            'Abak': ['Abak Town', 'Central Market', 'Ikot Ekpene Road'],
            'Etinan': ['Etinan Town', 'Uyo Road'],
            'Ibeno': ['Ibeno Town', 'ExxonMobil Area'],
            'Ikot Abasi': ['Ikot Abasi Town', 'Aluminum Smelter Area'],
            'Ini': ['Ini Town', 'Odoro Ikpe'],
            'Itu': ['Itu Town', 'Central Market'],
            'Mbo': ['Mbo Town', 'Ewang'],
            'Mkpat-Enin': ['Mkpat-Enin Town', 'Ikot Ekpene Road'],
            'Nsit-Atai': ['Odot', 'Nsit-Atai LGA'],
            'Nsit-Ibom': ['Afaha Offiong', 'Nsit-Ibom LGA'],
            'Nsit-Ubium': ['Ikot Ekpene Road', 'Nsit-Ubium LGA'],
            'Obot Akara': ['Nto Edino', 'Obot Akara LGA'],
            'Okobo': ['Okobo Town', 'Mkpanak'],
            'Onna': ['Onna Town', 'Eket Road'],
            'Oruk Anam': ['Ikot Ibritam', 'Oruk Anam LGA'],
            'Udung-Uko': ['Udung-Uko Town', 'Eket Road'],
            'Ukanafun': ['Ukanafun Town', 'Ikot Ekpene Road'],
            'Uruan': ['Uruan Town', 'Nnung Udoe']
          },
          'Delta': {
            'Warri North': ['Koko', 'Warri North LGA'],
            'Warri South': ['Warri Central', 'GRA', 'Central Market', 'NPA Expressway', 'Hausa Quarters', 'Igbudu Market', 'Airport Road Warri', 'Effurun Roundabout'],
            'Warri South West': ['Ogbe-Ijoh', 'Ogidigben'],
            'Uvwie': ['Effurun', 'Ekpan', 'PTI Road', 'DSC Roundabout', 'Airport Road'],
            'Udu': ['Udu Town', 'Otor-Udu'],
            'Okpe': ['Orerokpe', 'Okpe LGA'],
            'Sapele': ['Sapele Central', 'Central Market', 'Amukpe', 'Ugbeyiyi'],
            'Ethiope East': ['Abraka', 'Agbon'],
            'Ethiope West': ['Oghara', 'Mosogar'],
            'Ughelli North': ['Ughelli Central', 'Central Market', 'Otovwodo'],
            'Ughelli South': ['Ughelli South LGA', 'Ekiugbo'],
            'Isoko North': ['Ozoro', 'Isoko North LGA'],
            'Isoko South': ['Oleh', 'Isoko South LGA'],
            'Patani': ['Patani Town', 'Uduophori'],
            'Bomadi': ['Bomadi Town', 'Tuomo'],
            'Burutu': ['Burutu Town', 'Forcados'],
            'Aniocha North': ['Issele-Uku', 'Aniocha North LGA'],
            'Aniocha South': ['Ogwashi-Uku', 'Aniocha South LGA'],
            'Ika North East': ['Owa-Oyibu', 'Ika North East LGA'],
            'Ika South': ['Agbor', 'Central Market Agbor'],
            'Ndokwa East': ['Aboh', 'Ndokwa East LGA'],
            'Ndokwa West': ['Kwale', 'Ashaka'],
            'Oshimili North': ['Akwukwu-Igbo', 'Oshimili North LGA'],
            'Oshimili South': ['Asaba', 'GRA Asaba', 'Central Market Asaba', 'Summit Road', 'Nnebisi Road', 'Cable Point'],
            'Ukwuani': ['Obiaruku', 'Ukwuani LGA']
          },
          'Edo': {
            'Benin City': ['Benin City Central', 'GRA', 'Central Market', 'Ring Road', 'New Benin Market', 'Oba Market', 'Airport Road Benin', 'Uwelu', 'Ugbor', 'Ekosodin', 'UNIBEN', 'Ikpoba Hill', 'Wire Road', 'New Lagos Road', 'Sapele Road'],
            'Egor': ['Uselu', 'Egor LGA'],
            'Ikpoba Okha': ['Idogbo', 'Ikpoba Okha LGA'],
            'Uhunmwonde': ['Ehor', 'Uhunmwonde LGA'],
            'Ovia North-East': ['Okada', 'Ovia North-East LGA'],
            'Ovia South-West': ['Iguobazuwa', 'Ovia South-West LGA'],
            'Orhionmwon': ['Abudu', 'Orhionmwon LGA'],
            'Esan Central': ['Irrua', 'Central Market Irrua'],
            'Esan North-East': ['Uromi', 'Esan North-East LGA'],
            'Esan South-East': ['Ubiaja', 'Esan South-East LGA'],
            'Esan West': ['Ekpoma', 'AAU Campus', 'Central Market Ekpoma'],
            'Igueben': ['Igueben Town', 'Ewu'],
            'Oredo': ['Benin City Centre', 'Kings Square'],
            'Owan East': ['Afuze', 'Owan East LGA'],
            'Owan West': ['Sabongida-Ora', 'Owan West LGA'],
            'Akoko-Edo': ['Igarra', 'Akoko-Edo LGA'],
            'Etsako Central': ['Fugar', 'Etsako Central LGA'],
            'Etsako East': ['Agenebode', 'Etsako East LGA'],
            'Etsako West': ['Auchi', 'Polytechnic Auchi', 'Central Market Auchi']
          },
          'Bayelsa': {
            'Yenagoa': ['Yenagoa Central', 'GRA', 'Central Market', 'Tombia', 'Amarata', 'Azikoro', 'Biogbolo', 'Kpansia', 'Imgbi Road', 'Police Barracks'],
            'Kolokuma/Opokuma': ['Kaiama', 'Kolokuma/Opokuma LGA'],
            'Southern Ijaw': ['Oporoma', 'Amassoma'],
            'Sagbama': ['Sagbama Town', 'Adagbabiri'],
            'Brass': ['Brass Town', 'Twon Brass'],
            'Nembe': ['Nembe Town', 'Bassambiri'],
            'Ogbia': ['Ogbia Town', 'Kolo'],
            'Ekeremor': ['Ekeremor Town', 'Aleibiri']
          },
          'Anambra': {
            'Awka North': ['Achalla', 'Awka North LGA'],
            'Awka South': ['Awka Central', 'GRA', 'Central Market', 'UNIZIK', 'Ifite', 'Okpuno', 'Government House', 'Aroma Junction'],
            'Anambra East': ['Otuocha', 'Anambra East LGA'],
            'Anambra West': ['Nzam', 'Anambra West LGA'],
            'Anaocha': ['Neni', 'Anaocha LGA'],
            'Ayamelum': ['Anaku', 'Ayamelum LGA'],
            'Dunukofia': ['Ukpo', 'Dunukofia LGA'],
            'Ekwusigo': ['Ozubulu', 'Ekwusigo LGA'],
            'Idemili North': ['Ogidi', 'Abatete'],
            'Idemili South': ['Ojoto', 'Idemili South LGA'],
            'Ihiala': ['Ihiala Town', 'Central Market Ihiala'],
            'Njikoka': ['Abagana', 'Njikoka LGA'],
            'Nnewi North': ['Nnewi Central', 'Central Market Nnewi', 'Nkwo Nnewi', 'Onitsha Road'],
            'Nnewi South': ['Ukpor', 'Nnewi South LGA'],
            'Ogbaru': ['Atani', 'Ogbaru LGA'],
            'Onitsha North': ['Onitsha Central', 'Main Market', 'Bridge Head Market', 'Woliwo', 'Fegge'],
            'Onitsha South': ['Onitsha South LGA', 'Ogbende'],
            'Orumba North': ['Ajalli', 'Orumba North LGA'],
            'Orumba South': ['Umunze', 'Orumba South LGA'],
            'Oyi': ['Nteje', 'Oyi LGA'],
            'Aguata': ['Ekwulobia', 'Central Market Ekwulobia']
          },
          'Imo': {
            'Owerri Municipal': ['Owerri Central', 'GRA', 'Central Market', 'World Bank', 'New Owerri', 'Ikenegbu', 'Orji', 'IMSU Campus', 'Government House'],
            'Owerri North': ['Owerri North LGA', 'Obinze'],
            'Owerri West': ['Umuguma', 'Owerri West LGA'],
            'Aboh Mbaise': ['Aboh', 'Aboh Mbaise LGA'],
            'Ahiazu Mbaise': ['Ahiazu', 'Ahiazu Mbaise LGA'],
            'Ehime Mbano': ['Ehime', 'Ehime Mbano LGA'],
            'Ezinihitte': ['Onicha', 'Ezinihitte LGA'],
            'Ideato North': ['Arondizuogu', 'Ideato North LGA'],
            'Ideato South': ['Dikenafai', 'Ideato South LGA'],
            'Ihitte/Uboma': ['Isinweke', 'Ihitte/Uboma LGA'],
            'Ikeduru': ['Iho', 'Ikeduru LGA'],
            'Isiala Mbano': ['Umuelemai', 'Isiala Mbano LGA'],
            'Isu': ['Umundugba', 'Isu LGA'],
            'Mbaitoli': ['Nwaorieubi', 'Mbaitoli LGA'],
            'Ngor Okpala': ['Umuneke', 'Ngor Okpala LGA'],
            'Njaba': ['Nnenasa', 'Njaba LGA'],
            'Nkwerre': ['Nkwerre Town', 'Central Market'],
            'Nwangele': ['Amaigbo', 'Nwangele LGA'],
            'Obowo': ['Otoko', 'Obowo LGA'],
            'Oguta': ['Oguta Town', 'Central Market Oguta'],
            'Ohaji/Egbema': ['Mmahu', 'Ohaji/Egbema LGA'],
            'Okigwe': ['Okigwe Central', 'Central Market Okigwe'],
            'Onuimo': ['Okwe', 'Onuimo LGA'],
            'Orlu': ['Orlu Central', 'Central Market Orlu'],
            'Orsu': ['Orsu Town', 'Central Market'],
            'Oru East': ['Awo-Omamma', 'Oru East LGA'],
            'Oru West': ['Mgbidi', 'Oru West LGA']
          },
          'Abia': {
            'Aba North': ['Aba Central', 'Ariaria Market', 'Ogbor Hill', 'School Road', 'Mosque Street'],
            'Aba South': ['Aba South LGA', 'Cemetery Market', 'Ekeoha'],
            'Arochukwu': ['Arochukwu Town', 'Central Market'],
            'Bende': ['Bende Town', 'Item'],
            'Ikwuano': ['Isiala Oboro', 'Ikwuano LGA'],
            'Isiala Ngwa North': ['Isiala Ngwa North LGA', 'Nsulu'],
            'Isiala Ngwa South': ['Isiala Ngwa South LGA', 'Omoba'],
            'Isuikwuato': ['Isuikwuato Town', 'Uturu'],
            'Obi Ngwa': ['Mgboko', 'Obi Ngwa LGA'],
            'Ohafia': ['Ohafia Town', 'Ebem'],
            'Osisioma': ['Osisioma Town', 'Aba Express Road'],
            'Ugwunagbo': ['Ugwunagbo Town', 'Ahaba'],
            'Ukwa East': ['Akwete', 'Ukwa East LGA'],
            'Ukwa West': ['Abia-Ukwa', 'Ukwa West LGA'],
            'Umuahia North': ['Umuahia Central', 'GRA', 'Central Market', 'Government House', 'Michael Okpara University'],
            'Umuahia South': ['Umuahia South LGA', 'Olokoro'],
            'Umu Nneochi': ['Lomara', 'Umu Nneochi LGA']
          },
          'Enugu': {
            'Enugu East': ['Enugu East LGA', 'Emene'],
            'Enugu North': ['Enugu North LGA', 'Ogbete'],
            'Enugu South': ['Enugu Central', 'GRA', 'Central Market', 'Ogbete Main Market', 'Coal Camp', 'New Haven', 'Trans Ekulu', 'Independence Layout', 'UNEC Campus'],
            'Aninri': ['Nenwe', 'Aninri LGA'],
            'Awgu': ['Awgu Town', 'Central Market'],
            'Ezeagu': ['Aguobu-Owa', 'Ezeagu LGA'],
            'Igbo Etiti': ['Ogurute', 'Igbo Etiti LGA'],
            'Igbo Eze North': ['Enugu-Ezike', 'Igbo Eze North LGA'],
            'Igbo Eze South': ['Ibagwa-Aka', 'Igbo Eze South LGA'],
            'Isi Uzo': ['Ikem', 'Isi Uzo LGA'],
            'Nkanu East': ['Nkanu East LGA', 'Amagunze'],
            'Nkanu West': ['Akegbe-Ugwu', 'Nkanu West LGA'],
            'Nsukka': ['Nsukka Central', 'UNN Campus', 'Central Market Nsukka', 'Market Road'],
            'Oji River': ['Oji River Town', 'Central Market'],
            'Udenu': ['Obollo-Afor', 'Udenu LGA'],
            'Udi': ['Udi Town', 'Central Market'],
            'Uzo Uwani': ['Adani', 'Uzo Uwani LGA']
          },
          'Ebonyi': {
            'Abakaliki': ['Abakaliki Central', 'GRA', 'Central Market', 'Kpirikpiri', 'Nwezenyi', 'Government House Area', 'EBSU Campus'],
            'Afikpo North': ['Afikpo Central', 'Central Market Afikpo'],
            'Afikpo South': ['Afikpo South LGA', 'Unwana'],
            'Ebonyi': ['Onueke', 'Ebonyi LGA'],
            'Ezza North': ['Ekka', 'Ezza North LGA'],
            'Ezza South': ['Onueke', 'Ezza South LGA'],
            'Ikwo': ['Ikwo Town', 'Central Market'],
            'Ishielu': ['Ishielu Town', 'Ezza-Ikwo'],
            'Ivo': ['Ivo Town', 'Central Market'],
            'Izzi': ['Igbeagu', 'Izzi LGA'],
            'Ohaozara': ['Okposi', 'Ohaozara LGA'],
            'Ohaukwu': ['Ezzamgbo', 'Ohaukwu LGA'],
            'Onicha': ['Onicha Town', 'Central Market']
          },
          'Ekiti': {
            'Ado Ekiti': ['Ado Ekiti Central', 'GRA', 'Central Market', 'FUNAAB Campus', 'Government House', 'Oja Oba Market', 'New Iyin Road'],
            'Efon': ['Efon Alaaye', 'Central Market'],
            'Ekiti East': ['Omuo', 'Ekiti East LGA'],
            'Ekiti South-West': ['Ilawe', 'Ekiti South-West LGA'],
            'Ekiti West': ['Aramoko', 'Ekiti West LGA'],
            'Emure': ['Emure Ekiti', 'Central Market'],
            'Gbonyin': ['Ode Ekiti', 'Gbonyin LGA'],
            'Ido Osi': ['Ido Ekiti', 'Ido Osi LGA'],
            'Ijero': ['Ijero Ekiti', 'Central Market'],
            'Ikere': ['Ikere Ekiti', 'Central Market'],
            'Ikole': ['Ikole Ekiti', 'Central Market'],
            'Ilejemeje': ['Eda Oniyo', 'Ilejemeje LGA'],
            'Irepodun/Ifelodun': ['Igede Ekiti', 'Irepodun/Ifelodun LGA'],
            'Ise/Orun': ['Ise Ekiti', 'Ise/Orun LGA'],
            'Moba': ['Otun Ekiti', 'Moba LGA'],
            'Oye': ['Oye Ekiti', 'Central Market']
          },
          'Ondo': {
            'Akure North': ['Iju Odo', 'Akure North LGA'],
            'Akure South': ['Akure Central', 'GRA', 'Central Market', 'FUTA Campus', 'Oba Adesida Road', 'Ondo Road', 'Cathedral', 'Isolo Road'],
            'Akoko North-East': ['Ikare', 'Central Market Ikare'],
            'Akoko North-West': ['Okeagbe', 'Akoko North-West LGA'],
            'Akoko South-West': ['Oka', 'Akoko South-West LGA'],
            'Akoko South-East': ['Isua', 'Akoko South-East LGA'],
            'Ese Odo': ['Igbekebo', 'Ese Odo LGA'],
            'Idanre': ['Idanre Town', 'Central Market'],
            'Ifedore': ['Igbara-Oke', 'Ifedore LGA'],
            'Ilaje': ['Igbokoda', 'Ilaje LGA'],
            'Ile Oluji/Okeigbo': ['Ile Oluji', 'Okeigbo'],
            'Irele': ['Irele Town', 'Central Market'],
            'Odigbo': ['Ore', 'Central Market Ore'],
            'Okitipupa': ['Okitipupa Town', 'Central Market'],
            'Ondo East': ['Bolorunduro', 'Ondo East LGA'],
            'Ondo West': ['Ondo Central', 'Central Market Ondo', 'Sabo Oke'],
            'Ose': ['Ifon', 'Ose LGA'],
            'Owo': ['Owo Central', 'Central Market Owo', 'Igboroko Road']
          },
          'Osun': {
            'Osogbo': ['Osogbo Central', 'GRA', 'Central Market', 'Old Garage', 'Oke-Fia', 'Station Road', 'Government House'],
            'Ile-Ife Central': ['Ile-Ife Central', 'OAU Campus', 'Central Market Ife', 'Mayfair'],
            'Ile-Ife East': ['Ile-Ife East LGA', 'Modakeke'],
            'Ile-Ife North': ['Ile-Ife North LGA', 'Ipetumodu'],
            'Ile-Ife South': ['Ile-Ife South LGA', 'Mokuro'],
            'Ilesa East': ['Ilesa Central', 'Central Market Ilesa'],
            'Ilesa West': ['Ilesa West LGA', 'Ijebu-Jesa'],
            'Iwo': ['Iwo Central', 'Central Market Iwo'],
            'Ejigbo': ['Ejigbo Town', 'Central Market'],
            'Ede North': ['Ede Central', 'Central Market Ede'],
            'Ede South': ['Ede South LGA', 'Sekona'],
            'Egbedore': ['Awo', 'Egbedore LGA'],
            'Ifedayo': ['Oke-Ila Orangun', 'Ifedayo LGA'],
            'Ifelodun': ['Ikirun', 'Central Market Ikirun'],
            'Ila': ['Ila Orangun', 'Central Market'],
            'Irepodun': ['Ilobu', 'Central Market Ilobu'],
            'Irewole': ['Ikire', 'Central Market Ikire'],
            'Isokan': ['Apomu', 'Isokan LGA'],
            'Obokun': ['Ibokun', 'Central Market'],
            'Odo Otin': ['Okuku', 'Central Market'],
            'Ola Oluwa': ['Bode Osi', 'Ola Oluwa LGA'],
            'Olorunda': ['Igbona', 'Olorunda LGA'],
            'Oriade': ['Ijebu-Jesa', 'Oriade LGA'],
            'Orolu': ['Ifon Osun', 'Orolu LGA'],
            'Aiyedaade': ['Gbongan', 'Central Market Gbongan'],
            'Aiyedire': ['Ile Ogbo', 'Aiyedire LGA'],
            'Atakumosa East': ['Iperindo', 'Atakumosa East LGA'],
            'Atakumosa West': ['Osu', 'Atakumosa West LGA'],
            'Boluwaduro': ['Otan Ayegbaju', 'Boluwaduro LGA'],
            'Boripe': ['Iragbiji', 'Central Market']
          },
          'Ogun': {
            'Abeokuta North': ['Abeokuta North LGA', 'Akomoje'],
            'Abeokuta South': ['Abeokuta Central', 'GRA', 'Central Market', 'Oke Ilewo', 'Sapon', 'FUNAAB Campus', 'Kuto', 'Ake Palace Area'],
            'Ado-Odo/Ota': ['Ota Central', 'Sango Ota', 'Canaan Land', 'Covenant University', 'Toll Gate', 'OPIC'],
            'Egbado North': ['Ayetoro', 'Central Market'],
            'Egbado South': ['Ilaro', 'Federal Polytechnic Ilaro', 'Central Market Ilaro'],
            'Ewekoro': ['Ewekoro Town', 'Papalanto'],
            'Ifo': ['Ifo Town', 'Sango', 'Agbado'],
            'Ijebu East': ['Ogbere', 'Ijebu East LGA'],
            'Ijebu North': ['Ijebu Igbo', 'Central Market'],
            'Ijebu North East': ['Atan', 'Ijebu North East LGA'],
            'Ijebu Ode': ['Ijebu Ode Central', 'Central Market', 'Folagbade'],
            'Ikenne': ['Ikenne Town', 'Central Market'],
            'Imeko Afon': ['Imeko', 'Central Market'],
            'Ipokia': ['Ipokia Town', 'Idiroko'],
            'Obafemi Owode': ['Owode', 'Obafemi Owode LGA'],
            'Odeda': ['Odeda Town', 'Central Market'],
            'Odogbolu': ['Odogbolu Town', 'Central Market'],
            'Ogun Waterside': ['Abigi', 'Ogun Waterside LGA'],
            'Remo North': ['Isara', 'Central Market'],
            'Shagamu': ['Shagamu Central', 'Central Market', 'Sabo']
          },
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