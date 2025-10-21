import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Loader2 } from "lucide-react";

interface Location {
  name: string;
  formatted_address: string;
  place_id: string;
  types: string[];
}

interface LocationSelectorProps {
  onLocationChange: (state: string, city: string, neighborhood: string) => void;
  defaultState?: string;
  defaultCity?: string;
  defaultNeighborhood?: string;
}

// Hardcoded Nigerian states as fallback
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers",
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

// Major cities by state as fallback - ALL Nigerian states with comprehensive LGA data
const STATE_CITIES: { [key: string]: string[] } = {
  'Lagos': ['Lagos Island', 'Lagos Mainland', 'Surulere', 'Ikeja', 'Oshodi-Isolo', 'Mushin', 'Alimosho', 'Agege', 'Ifako-Ijaiye', 'Kosofe', 'Shomolu', 'Ikorodu', 'Epe', 'Badagry', 'Ibeju-Lekki', 'Ojo', 'Amuwo-Odofin', 'Apapa', 'Eti-Osa', 'Ajeromi-Ifelodun', 'Lekki', 'Victoria Island', 'Ikoyi', 'Yaba', 'Gbagada', 'Ajah', 'Maryland', 'Festac'],
  'Federal Capital Territory': ['Abuja Municipal', 'Gwagwalada', 'Kuje', 'Abaji', 'Kwali', 'Bwari', 'Garki', 'Wuse', 'Maitama', 'Asokoro', 'Gwarinpa', 'Kubwa', 'Nyanya', 'Karu', 'Lugbe', 'Life Camp', 'Utako', 'Jabi', 'Katampe', 'Lokogoma', 'Mpape', 'Durumi', 'Gudu', 'Kado', 'Mabushi', 'Dei-Dei', 'Karmo', 'Dutse', 'Apo', 'Galadimawa'],
  'Kano': ['Kano Municipal', 'Fagge', 'Dala', 'Gwale', 'Tarauni', 'Nassarawa', 'Ungogo', 'Kumbotso', 'Warawa', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwarzo', 'Kabo', 'Karaye', 'Kibiya', 'Kiru', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takali', 'Tudun Wada', 'Wudil', 'Bichi', 'Tsanyawa'],
  'Kaduna': ['Kaduna North', 'Kaduna South', 'Chikun', 'Igabi', 'Ikara', 'Jaba', 'Jema\'a', 'Kachia', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria', 'Birnin Gwari', 'Giwa'],
  'Rivers': ['Port Harcourt', 'Obio-Akpor', 'Okrika', 'Ogu-Bolo', 'Eleme', 'Tai', 'Gokana', 'Khana', 'Oyigbo', 'Opobo-Nkoro', 'Andoni', 'Bonny', 'Degema', 'Asari-Toru', 'Akuku-Toru', 'Abua-Odual', 'Ahoada East', 'Ahoada West', 'Ogba-Egbema-Ndoni', 'Emohua', 'Ikwerre', 'Etche', 'Omuma'],
  'Oyo': ['Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomoso North', 'Ogbomoso South', 'Ogo Oluwa', 'Olorunsogo', 'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda'],
  'Katsina': ['Katsina', 'Daura', 'Funtua', 'Malumfashi', 'Kafur', 'Kaita', 'Jibia', 'Mashi', 'Dutsi', 'Batsari', 'Rimi', 'Charanchi', 'Dan Musa', 'Dandume', 'Danja', 'Faskari', 'Ingawa', 'Kankara', 'Kankia', 'Kusada', 'Mai\'Adua', 'Matazu', 'Musawa', 'Safana', 'Sabuwa', 'Sandamu', 'Zango', 'Baure', 'Bindawa', 'Dutsin Ma', 'Kurfi', 'Mani'],
  'Jigawa': ['Dutse', 'Hadejia', 'Kazaure', 'Gumel', 'Ringim', 'Birnin Kudu', 'Garki', 'Babura', 'Birniwa', 'Buji', 'Gantsa', 'Gagarawa', 'Guri', 'Gwaram', 'Jahun', 'Kafin Hausa', 'Kaugama', 'Kiri Kasama', 'Kiyawa', 'Maigatari', 'Malam Madori', 'Miga', 'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi', 'Auyo'],
  'Borno': ['Maiduguri', 'Jere', 'Konduga', 'Bama', 'Gwoza', 'Dikwa', 'Kala/Balge', 'Kukawa', 'Gubio', 'Guzamala', 'Magumeri', 'Ngala', 'Kaga', 'Monguno', 'Nganzai', 'Chibok', 'Damboa', 'Biu', 'Kwaya Kusar', 'Shani', 'Askira/Uba', 'Hawul', 'Bayo'],
  'Yobe': ['Damaturu', 'Potiskum', 'Gashua', 'Nguru', 'Geidam', 'Bade', 'Bursari', 'Fika', 'Fune', 'Gujba', 'Gulani', 'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Tarmuwa', 'Yunusari', 'Yusufari'],
  'Bauchi': ['Bauchi', 'Azare', 'Misau', 'Jama\'are', 'Katagum', 'Zaki', 'Itas/Gadau', 'Gamawa', 'Tafawa Balewa', 'Dass', 'Toro', 'Alkaleri', 'Bauchi LGA', 'Bogoro', 'Damban', 'Darazo', 'Ganjuwa', 'Giade', 'Kirfi', 'Ningi', 'Shira', 'Warji'],
  'Abia': ['Aba North', 'Aba South', 'Umuahia North', 'Umuahia South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umu Nneochi', 'Obingwa'],
  'Adamawa': ['Yola North', 'Yola South', 'Mubi North', 'Mubi South', 'Fufore', 'Ganye', 'Girei', 'Gombi', 'Guyuk', 'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo Belwa', 'Michika', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Demsa'],
  'Akwa Ibom': ['Uyo', 'Ikot Ekpene', 'Eket', 'Oron', 'Abak', 'Etinan', 'Ibiono Ibom', 'Ibesikpo Asutan', 'Ikono', 'Ikot Abasi', 'Ika', 'Ini', 'Itu', 'Mbo', 'Mkpat Enin', 'Nsit Atai', 'Nsit Ibom', 'Nsit Ubium', 'Obot Akara', 'Okobo', 'Onna', 'Oruk Anam', 'Udung Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Essien Udim', 'Eastern Obolo'],
  'Anambra': ['Awka', 'Onitsha', 'Nnewi', 'Ekwulobia', 'Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Ayamelum', 'Dunukofia', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'],
  'Bayelsa': ['Yenagoa', 'Brass', 'Sagbama', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Southern Ijaw'],
  'Benue': ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala', 'Ado', 'Agatu', 'Apa', 'Buruku', 'Guma', 'Gwer East', 'Gwer West', 'Konshisha', 'Kwande', 'Logo', 'Obi', 'Ogbadibo', 'Ohimini', 'Oju', 'Okpokwu', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya'],
  'Cross River': ['Calabar', 'Ikom', 'Ugep', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipal', 'Calabar South', 'Etung', 'Obanliku', 'Obubra', 'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala'],
  'Delta': ['Asaba', 'Warri', 'Sapele', 'Ughelli', 'Agbor', 'Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele LGA', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West'],
  'Ebonyi': ['Abakaliki', 'Afikpo', 'Onueke', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu'],
  'Edo': ['Benin City', 'Auchi', 'Ekpoma', 'Uromi', 'Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba-Okha', 'Oredo', 'Orhionmwon', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde'],
  'Ekiti': ['Ado-Ekiti', 'Ikere', 'Ijero', 'Ikole', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure', 'Gbonyin', 'Ido/Osi', 'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye'],
  'Enugu': ['Enugu', 'Nsukka', 'Oji River', 'Agbani', 'Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Udi', 'Uzo-Uwani'],
  'Gombe': ['Gombe', 'Kumo', 'Deba', 'Bajoga', 'Akko', 'Balanga', 'Billiri', 'Funakaye', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba'],
  'Imo': ['Owerri', 'Orlu', 'Okigwe', 'Mbaise', 'Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba', 'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe LGA', 'Onuimo', 'Orlu LGA', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West'],
  'Kebbi': ['Birnin Kebbi', 'Argungu', 'Zuru', 'Yauri', 'Aleiro', 'Arewa Dandi', 'Augie', 'Bagudo', 'Bunza', 'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko'],
  'Kogi': ['Lokoja', 'Okene', 'Kabba', 'Idah', 'Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Igalamela-Odolu', 'Ijumu', 'Kogi LGA', 'Mopa-Muro', 'Ofu', 'Ogori/Magongo', 'Okehi', 'Okene LGA', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West'],
  'Kwara': ['Ilorin', 'Offa', 'Omu-Aran', 'Jebba', 'Asa', 'Baruten', 'Edu', 'Ekiti (Kwara)', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Oyun', 'Pategi'],
  'Nasarawa': ['Lafia', 'Keffi', 'Akwanga', 'Nasarawa', 'Awe', 'Doma', 'Keana', 'Karu', 'Kokona', 'Nasarawa Eggon', 'Obi', 'Toto', 'Wamba'],
  'Niger': ['Minna', 'Bida', 'Kontagora', 'Suleja', 'Agaie', 'Agwara', 'Baro', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako', 'Gurara', 'Katcha', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Moya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Tafa', 'Wushishi'],
  'Ogun': ['Abeokuta', 'Ijebu-Ode', 'Sagamu', 'Ota', 'Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ikenne', 'Imeko Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Shagamu'],
  'Ondo': ['Akure', 'Ondo', 'Owo', 'Okitipupa', 'Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West', 'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Ondo East', 'Ondo West', 'Ose'],
  'Osun': ['Osogbo', 'Ile-Ife', 'Ilesa', 'Ede', 'Aiyedade', 'Aiyedire', 'Atakunmosa East', 'Atakunmosa West', 'Boluwaduro', 'Boripe', 'Ede North', 'Ede South', 'Egbedore', 'Ejigbo', 'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Ifedayo', 'Ifelodun', 'Ila', 'Ilesa East', 'Ilesa West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo LGA'],
  'Plateau': ['Jos', 'Bukuru', 'Pankshin', 'Shendam', 'Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Qua\'an Pan', 'Riyom', 'Wase'],
  'Sokoto': ['Sokoto', 'Gwadabawa', 'Tambuwal', 'Wurno', 'Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame', 'Sokoto North', 'Sokoto South', 'Tureta', 'Wamako', 'Yabo'],
  'Taraba': ['Jalingo', 'Wukari', 'Bali', 'Gembu', 'Ardo Kola', 'Bali LGA', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Karim Lamido', 'Kurmi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Yorro', 'Zing'],
  'Zamfara': ['Gusau', 'Kaura Namoda', 'Talata Mafara', 'Zurmi', 'Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Maradun', 'Maru', 'Shinkafi', 'Tsafe']
};

// Comprehensive Neighborhoods by city - Detailed Nigeria-specific data
const CITY_NEIGHBORHOODS: { [key: string]: string[] } = {
  // ===== LAGOS STATE NEIGHBORHOODS =====
  'Lagos Island': ['Marina', 'Ikoyi', 'Victoria Island', 'Lekki Phase 1', 'Onikan', 'Falomo', 'Banana Island', 'Lagos Island CMS', 'Broad Street', 'Idumota', 'Balogun', 'Ebute Ero', 'Epetedo', 'Isale Eko'],
  'Ikeja': ['GRA Ikeja', 'Allen Avenue', 'Opebi', 'Oregun', 'Alausa', 'Computer Village', 'Awolowo Way', 'Adeniyi Jones', 'Toyin Street', 'Medical Road', 'Obafemi Awolowo Way', 'Oba Akran', 'Agidingbi', 'Omole Phase 1', 'Omole Phase 2', 'Ojodu', 'Berger'],
  'Lekki': ['Lekki Phase 1', 'Lekki Phase 2', 'Ajah', 'Abraham Adesanya', 'Chevron', 'VGC', 'Oniru', 'Ikate', 'Jakande', 'Osapa London', 'Oral Estate', 'Mega Chicken', 'Elegushi', 'Ilasan'],
  'Victoria Island': ['VI Annex', 'Oniru', 'Maroko', 'Sandfill', 'Bar Beach', 'Adeola Odeku', 'Ahmadu Bello Way', 'Akin Adesola', 'Ozumba Mbadiwe', 'Water Corporation Drive'],
  'Ikoyi': ['Old Ikoyi', 'Parkview Estate', 'Banana Island', 'Dolphin Estate', 'Bourdillon', 'Osborne', 'Turnbull', 'Cameron', 'Cooper', 'Awolowo Road', 'MacPherson', 'Glover'],
  'Yaba': ['Sabo', 'Abule Ijesha', 'Akoka', 'Onike', 'Makoko', 'Oyingbo', 'Alagomeji', 'Herbert Macaulay', 'Queens College', 'Unilag', 'Bariga'],
  'Surulere': ['Adeniran Ogunsanya', 'Aguda', 'Ijeshatedo', 'Itire', 'Lawanson', 'Shitta', 'Randle Avenue', 'Bode Thomas', 'Ogunlana Drive', 'Ojuelegba', 'Iponri', 'Yaba Tech', 'Costain'],
  'Gbagada': ['Phase 1', 'Phase 2', 'Ifako', 'Soluyi', 'New Garage', 'Oworonshoki', 'Pedro', 'Shomolu', 'Onipanu', 'Palmgrove'],
  'Maryland': ['Mende', 'Anthony', 'Ojota', 'Ikosi', 'Ketu', 'Mile 12', 'Alapere', 'Ogudu', 'Kosofe'],
  'Ajah': ['Sangotedo', 'Lakowe', 'Badore', 'Ilaje', 'Ado', 'Awoyaya', 'Bogije', 'Majek', 'Shapati'],
  'Ikorodu': ['Ikorodu Town', 'Ijede', 'Igbogbo', 'Isiu', 'Majidun', 'Agric', 'Erikorodo', 'Ebute', 'Owutu'],
  'Mushin': ['Mushin Market', 'Ladipo', 'Idi Oro', 'Papa Ajao', 'Odi Olowo', 'Alakara', 'Idi Araba'],
  'Festac': ['Festac Phase 1', 'Festac Phase 2', 'Festac Phase 3', 'Amuwo Odofin', 'Satellite Town', 'Mile 2', 'Okota'],
  'Alimosho': ['Egbeda', 'Idimu', 'Ikotun', 'Igando', 'Akowonjo', 'Dopemu', 'Iyana Ipaja', 'Abule Egba', 'Meiran'],
  'Agege': ['Agege Motor Road', 'Pen Cinema', 'Oke Oba', 'Dopemu', 'Mulero', 'Orile Agege'],
  'Badagry': ['Badagry Town', 'Ajara', 'Okokomaiko', 'Seme Border', 'Aradagun', 'Topo'],
  'Epe': ['Epe Town', 'Ejirin', 'Eredo', 'Poka', 'Odoragunsen'],
  'Apapa': ['Apapa Road', 'Creek Road', 'Point Road', 'Liverpool Road', 'Warehouse Road', 'Tin Can Island', 'Wharf'],
  'Lagos Mainland': ['Ebute Metta', 'Yaba', 'Somolu', 'Oyingbo', 'Iddo', 'Otto'],
  
  // ===== FCT ABUJA NEIGHBORHOODS =====
  'Abuja Municipal': ['Central Business District', 'Garki 1', 'Garki 2', 'Wuse', 'Wuse 2', 'Maitama', 'Asokoro', 'Three Arms Zone', 'Eagle Square'],
  'Garki': ['Garki 1', 'Garki 2', 'Area 1', 'Area 2', 'Area 3', 'Area 7', 'Area 8', 'Area 10', 'Area 11'],
  'Wuse': ['Wuse 1', 'Wuse 2', 'Wuse Zone 1', 'Wuse Zone 2', 'Wuse Zone 3', 'Wuse Zone 4', 'Wuse Zone 5', 'Wuse Zone 6', 'Wuse Zone 7'],
  'Gwarinpa': ['Gwarinpa 1st Avenue', 'Gwarinpa Estate', 'Gwarinpa 1', 'Gwarinpa 2', '3rd Avenue', '4th Avenue', '5th Avenue', '6th Avenue'],
  'Kubwa': ['Kubwa Phase 1', 'Kubwa Phase 2', 'Kubwa Phase 3', 'Kubwa Phase 4', 'Byazhin', 'Arab Road', 'Dutse', 'Gado Nasko'],
  'Maitama': ['Maitama District', 'Maitama Extension', 'Maitama I', 'Maitama II'],
  'Asokoro': ['Asokoro District', 'Asokoro Extension', 'Asokoro I', 'Asokoro II'],
  'Jabi': ['Jabi District', 'Jabi Lake', 'Jabi Mall Area', 'Jabi Motor Park'],
  'Utako': ['Utako District', 'Jabi Lake Mall Area', 'Utako Market'],
  'Life Camp': ['Life Camp', 'Jikwoyi', 'Karmo'],
  'Lugbe': ['Lugbe District', 'Lugbe FHA', 'Trademore Estate', 'Airport Road'],
  'Nyanya': ['Nyanya', 'Karu', 'Mararaba', 'Masaka', 'New Nyanya'],
  'Gwagwalada': ['Gwagwalada Town', 'Tungan Maje', 'Paikon Kore', 'Phase 1', 'Phase 2', 'Phase 3'],
  'Kuje': ['Kuje Town', 'Gaube', 'Chibiri', 'Rubochi'],
  'Katampe': ['Katampe Extension', 'Katampe District', 'Diplomatic Quarters'],
  'Lokogoma': ['Lokogoma District', 'Lokogoma Extension', 'Apo District'],
  'Durumi': ['Durumi 1', 'Durumi 2', 'Area 1 Durumi'],
  'Gudu': ['Gudu District', 'Gudu Market', 'Apo Resettlement'],
  
  // ===== KANO STATE NEIGHBORHOODS =====
  'Kano Municipal': ['Kofar Mata', 'Kofar Nasarawa', 'Sabon Gari', 'Fagge', 'Dala', 'Kurmi Market', 'Kantin Kwari', 'Singer Market', 'Kofar Wambai', 'Rijiyar Zaki'],
  'Nassarawa': ['Nassarawa GRA', 'Bompai', 'Zoo Road', 'Sharada', 'Hotoro'],
  'Fagge': ['Fagge Market', 'Jakara', 'Gwammaja', 'Yan Kaba'],
  'Gwale': ['Gwale', 'Rijiyar Lemo', 'Yan Awaki', 'Dandinshe'],
  'Tarauni': ['Tarauni', 'Yankaba', 'Yan Lemo', 'Chiranci'],
  'Ungogo': ['Ungogo', 'Rijiyar Zaki', 'Yan Kura', 'Bachirawa'],
  'Kumbotso': ['Kumbotso', 'Challawa', 'Dan Agundi'],
  
  // ===== PORT HARCOURT NEIGHBORHOODS =====
  'Port Harcourt': ['Old GRA', 'New GRA', 'Diobu', 'Trans Amadi', 'Rumuola', 'Rumuokoro', 'Eliozu', 'D-Line', 'Mile 1', 'Mile 2', 'Mile 3', 'Mile 4', 'Aba Road', 'Ikwerre Road', 'Waterlines', 'Rumuokwuta', 'Rumueme', 'Rumuigbo', 'Stadium Road', 'Garrison'],
  'Obio-Akpor': ['Rumuokwurushi', 'Rumueme', 'Rumuogba', 'Elelenwo', 'Choba', 'Alakahia', 'Rumuosi', 'Mgbuoba', 'Rumuepirikom', 'Rumuolumeni', 'Ozuoba', 'Rukpokwu'],
  'Eleme': ['Eleme Junction', 'Aleto', 'Ogale', 'Alesa', 'Agbonchia'],
  'Okrika': ['Okrika Town', 'George Ama', 'Main Town'],
  
  // ===== IBADAN NEIGHBORHOODS =====
  'Ibadan North': ['Bodija', 'Sango', 'UI', 'Agbowo', 'Ajibode', 'Apete', 'Akobo', 'Felele', 'Eleyele', 'Secretariat'],
  'Ibadan North-East': ['Iwo Road', 'Oke Ado', 'Bashorun', 'Akobo', 'Ologuneru'],
  'Ibadan South-East': ['Ring Road', 'Mokola', 'Oke Ado', 'Challenge', 'Adamasingba', 'Molete', 'New Garage'],
  'Ibadan South-West': ['Aleshinloye', 'Idi Ape', 'Oniyanrin', 'Oke Bola'],
  'Ido': ['Ido Eruwa', 'Apete', 'Ologuneru', 'Bakatari'],
  'Oluyole': ['Idi Ayunre', 'Olunde', 'Araromi'],
  
  // ===== OTHER MAJOR CITIES =====
  'Benin City': ['GRA', 'Ikpoba Hill', 'Ugbowo', 'Uselu', 'Sapele Road', 'Airport Road', 'Upper Sakponba', 'Lower Sakponba', 'Ekenwan', 'Evbuobanosa', 'Ugbor', 'Oregbeni', 'New Benin', 'Ramat Park'],
  'Enugu': ['Independence Layout', 'GRA', 'New Haven', 'Trans Ekulu', 'Achara Layout', 'Abakpa Nike', 'Emene', 'Uwani', 'Coal Camp', 'Ogui', 'Maryland', 'Asata', 'Obiagu', 'Ogbete'],
  'Kaduna North': ['Kaduna GRA', 'Barnawa', 'Sabon Tasha', 'Malali', 'Ungwan Rimi', 'Kawo', 'Badiko', 'Narayi'],
  'Kaduna South': ['Television', 'Kudenda', 'Makera', 'Kakuri', 'Kabala Costain'],
  'Zaria': ['Samaru', 'Sabon Gari', 'Tudun Wada', 'Zaria City', 'Hanwa', 'Wusasa', 'ABU Main Campus'],
  'Owerri': ['GRA', 'New Owerri', 'Ikenegbu', 'Wetheral Road', 'Works Layout', 'World Bank', 'Relief Market', 'Douglas Road', 'Orji', 'Egbu'],
  'Calabar': ['GRA', 'Marian Road', 'Ekpo Abasi', 'Satellite Town', 'Watt Market', 'Murtala Mohammed Highway', 'Mayne Avenue', 'Edibe Edibe', 'Atamunu', 'Big Qua Town'],
  'Abeokuta': ['GRA', 'Oke Ilewo', 'Isale Igbein', 'Kuto', 'Ibara', 'Lantoro', 'Ita Oshin', 'Itoku', 'Oke Mosan', 'Ijeun Titun'],
  'Akure': ['GRA', 'Oba Ile', 'Alagbaka', 'Ondo Road', 'Ijapo', 'NEPA', 'Shagari Village', 'Oke Aro', 'Isikan', 'Cathedral'],
  'Minna': ['GRA', 'Tunga', 'Bosso', 'Chanchaga', 'Sauka Kahuta', 'Dutsen Kura', 'Maitumbi', 'Morris', 'Kpakungu'],
  'Uyo': ['Ikot Ekpene Road', 'Oron Road', 'Eket', 'Aka Road', 'Use Offot', 'Ewet Housing Estate', 'Shelter Afrique', 'Itam', 'Mbak Itam'],
  'Warri': ['GRA', 'Effurun', 'Airport Road', 'PTI Road', 'Okere', 'Okumagba Layout', 'NPA', 'Jakpa Road', 'Ekpan'],
  'Asaba': ['GRA', 'Cable Point', 'Okpanam Road', 'Summit Road', 'DBS Road', 'West End', 'Nnebisi Road', 'Infant Jesus'],
  'Aba North': ['Ariaria', 'Ogbor Hill', 'Ngwa Road', 'Umuode', 'Eziama'],
  'Aba South': ['Aba Main Market', 'Eziukwu', 'St. Michael Road', 'Port Harcourt Road', 'Cemetery Road', 'Azikiwe Road'],
  'Umuahia North': ['Umuahia GRA', 'Ibeku', 'Nsukka Road', 'Ugwunchara'],
  'Umuahia South': ['Umuahia Township', 'Ubakala', 'Olokoro', 'Ahiaeke'],
  'Jos': ['Jos GRA', 'Bukuru', 'Rayfield', 'Gangare', 'Lamingo', 'Angwan Rukuba', 'Terminus', 'Rantya', 'Tudun Wada Jos', 'Vom'],
  'Ilorin': ['GRA', 'Tanke', 'Fate Road', 'Unity Road', 'Sango', 'Oke Ose', 'Adewole', 'Basin', 'Kulende', 'Taiwo', 'Agaka', 'Pakata'],
  'Awka': ['Unizik', 'Ifite', 'Ngozika Estate', 'Aroma Junction', 'Okpuno', 'Agu Awka'],
  'Onitsha': ['Main Market', 'Fegge', 'GRA', 'Trans Nkisi', 'Inland Town', 'Woliwo', '3-3', 'Oguta Road', 'Odoakpu'],
  'Nnewi': ['Nnewi Central', 'Otolo', 'Umudim', 'Uruagu', 'Ichi', 'Nkwo Market Area'],
  'Osogbo': ['Oke Fia', 'Ola Iya', 'Station Road', 'MDS', 'Okeji', 'Oke Baale', 'Odi Olowo'],
  'Ile-Ife': ['Lagere', 'Opa', 'OAU Campus', 'Mayfair', 'Enuwa', 'Moore', 'Iremo'],
  'Ilesa': ['Isokun', 'Ereja', 'Iloro', 'Imo', 'Ijoka'],
  'Ado-Ekiti': ['GRA', 'Ajilosun', 'Basiri', 'Ijigbo', 'Irona', 'Oke Ila', 'Dalimore'],
  'Lokoja': ['Adankolo', 'Phase 1', 'Phase 2', 'Felele', 'Ganaja', 'Gadumo', 'Crusher'],
  'Okene': ['Okene Central', 'Obehira', 'Upogoro'],
  'Jalingo': ['Jalingo Township', 'Magami', 'Nukkai', 'Sabon Gari Jalingo'],
  'Gusau': ['Tudun Wada Gusau', 'Unguwan Dosa', 'Sabon Gari Gusau'],
  'Lafia': ['Lafia Central', 'Doma', 'Akurba', 'Shabu'],
  'Keffi': ['Keffi Town', 'Angwan Jaba', 'Liman Katagum'],
  'Damaturu': ['Damaturu Township', 'Bindigari', 'Gwange'],
  'Maiduguri': ['GRA Maiduguri', 'Bulumkutu', 'Gwange', 'Shehuri', 'Monday Market', 'Lagos Street', 'Damboa Road', 'Custom'],
  'Bauchi': ['Bauchi GRA', 'Dutsen Tanshi', 'Yelwa', 'Warinje', 'Kobi'],
  'Gombe': ['Gombe Township', 'Pantami', 'Bajoga'],
  'Yola North': ['Jimeta', 'Doubeli', 'Karewa'],
  'Yola South': ['Namtari', 'Yola Town', 'Gwadabawa Yola'],
  'Dutse': ['Dutse Township', 'Kiyawa'],
  'Birnin Kebbi': ['Birnin Kebbi Township', 'Gwadangaji'],
  'Sokoto': ['Sokoto GRA', 'Arkilla', 'Runjin Sambo', 'Mabera'],
  'Katsina': ['Katsina GRA', 'Kofar Kaura', 'Kofar Marusa'],
  'Makurdi': ['North Bank', 'Wadata', 'High Level', 'New GRA', 'Modern Market'],
  'Yenagoa': ['Amarata', 'Kpansia', 'Ovom', 'Swali'],
  'Auchi': ['Auchi Township', 'Iyerekhu', 'Iyakpi']
};

export const LocationSelector = ({ 
  onLocationChange, 
  defaultState, 
  defaultCity, 
  defaultNeighborhood 
}: LocationSelectorProps) => {
  const [states, setStates] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Location[]>([]);
  
  const [selectedState, setSelectedState] = useState(defaultState || "");
  const [selectedCity, setSelectedCity] = useState(defaultCity || "");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(defaultNeighborhood || "");
  const [neighborhoodSearch, setNeighborhoodSearch] = useState("");
  
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const MAX_RETRIES = 3;

  // Fetch states on component mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState);
      setSelectedCity("");
      setSelectedNeighborhood("");
      setCities([]);
      setNeighborhoods([]);
    }
  }, [selectedState]);

  // Fetch neighborhoods when city changes
  useEffect(() => {
    if (selectedCity && selectedState) {
      fetchNeighborhoods(selectedState, selectedCity);
      setSelectedNeighborhood("");
      setNeighborhoods([]);
    }
  }, [selectedCity]);

  // Search neighborhoods with debounce
  useEffect(() => {
    if (neighborhoodSearch && selectedCity && selectedState) {
      const timer = setTimeout(() => {
        fetchNeighborhoods(selectedState, selectedCity, neighborhoodSearch);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [neighborhoodSearch, selectedState, selectedCity]);

  // Notify parent of location changes
  useEffect(() => {
    onLocationChange(selectedState, selectedCity, selectedNeighborhood);
  }, [selectedState, selectedCity, selectedNeighborhood, onLocationChange]);

  const fetchLocations = async (type: 'states' | 'cities' | 'neighborhoods', payload: any, attempt = 0): Promise<any[]> => {
    try {
      console.log(`Fetching ${type}, attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
      
      // For states, use hardcoded fallback immediately
      if (type === 'states') {
        console.log('Using hardcoded states list');
        return NIGERIAN_STATES.map((stateName) => ({
          name: stateName,
          formatted_address: `${stateName}, Nigeria`,
          place_id: `state_${stateName.toLowerCase().replace(/\s+/g, '_')}`,
          types: ['administrative_area_level_1']
        }));
      }
      
      // For cities, use comprehensive LGA data immediately
      if (type === 'cities' && payload.state) {
        console.log('📍 Using comprehensive LGA list for', payload.state);
        const cities = STATE_CITIES[payload.state] || [];
        return cities.map((cityName) => ({
          name: cityName,
          formatted_address: `${cityName} LGA, ${payload.state}, Nigeria`,
          place_id: `city_${cityName.toLowerCase().replace(/\s+/g, '_')}`,
          types: ['locality', 'lga']
        }));
      }
      
      // For neighborhoods, use comprehensive Ward data immediately
      if (type === 'neighborhoods' && payload.city) {
        console.log('📍 Using comprehensive Ward data for', payload.city);
        const neighborhoods = CITY_NEIGHBORHOODS[payload.city] || [];
        
        if (neighborhoods.length === 0) {
          console.warn(`⚠️ No wards found for ${payload.city}`);
        }
        
        return neighborhoods.map((hood) => ({
          name: hood,
          formatted_address: `${hood} Ward, ${payload.city}, ${payload.state}, Nigeria`,
          place_id: `neighborhood_${hood.toLowerCase().replace(/\s+/g, '_')}`,
          types: ['neighborhood', 'ward']
        }));
      }
      
      const { data, error } = await supabase.functions.invoke('nigeria-locations', {
        body: { type, ...payload }
      });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Retry logic with exponential backoff
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchLocations(type, payload, attempt + 1);
        }
        
        setError(error.message || 'Failed to load location data');
        toast({
          title: "Error fetching locations",
          description: `${error.message}. Please try again or contact support.`,
          variant: "destructive",
        });
        return [];
      }

      if (data?.error) {
        console.error('Function returned error:', data.error);
        
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchLocations(type, payload, attempt + 1);
        }
        
        setError(data.error);
        toast({
          title: "Error fetching locations",
          description: data.error,
          variant: "destructive",
        });
        return [];
      }

      setError(null);
      setRetryCount(0);
      return data?.locations || [];
    } catch (error: any) {
      console.error('Error calling function:', error);
      
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        setRetryCount(attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchLocations(type, payload, attempt + 1);
      }
      
      setError('Failed to fetch location data after multiple attempts');
      toast({
        title: "Connection Error",
        description: "Failed to load location data. Please check your internet connection and try again.",
        variant: "destructive",
      });
      return [];
    }
  };

  const fetchStates = async () => {
    setLoadingStates(true);
    setError(null);
    const locations = await fetchLocations('states', {});
    setStates(locations);
    setLoadingStates(false);
  };
  
  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    fetchStates();
  };

  const fetchCities = async (state: string) => {
    setLoadingCities(true);
    const locations = await fetchLocations('cities', { state });
    setCities(locations);
    setLoadingCities(false);
  };

  const fetchNeighborhoods = async (state: string, city: string, query?: string) => {
    setLoadingNeighborhoods(true);
    const locations = await fetchLocations('neighborhoods', { state, city, query });
    setNeighborhoods(locations);
    setLoadingNeighborhoods(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Location Information <span className="text-destructive">*</span></h3>
        <p className="text-sm text-muted-foreground">(All fields required)</p>
      </div>
      
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive font-medium mb-2">
            {retryCount > 0 ? `Retrying... (Attempt ${retryCount}/${MAX_RETRIES})` : 'Failed to load location data'}
          </p>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button onClick={handleRetry} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      )}

      {/* State Selector */}
      <div className="space-y-2">
        <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
        <Select value={selectedState} onValueChange={setSelectedState}>
          <SelectTrigger>
            <SelectValue placeholder={loadingStates ? "Loading states..." : "Select your state"} />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border max-h-60 overflow-y-auto">
            {loadingStates ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading states...</span>
              </div>
            ) : (
              states.map((state) => (
                <SelectItem key={state.place_id} value={state.name}>
                  {state.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* LGA Selector */}
      <div className="space-y-2">
        <Label htmlFor="city">Local Government Area (LGA) <span className="text-destructive">*</span></Label>
        <Select 
          value={selectedCity} 
          onValueChange={setSelectedCity}
          disabled={!selectedState}
        >
          <SelectTrigger>
            <SelectValue 
              placeholder={
                !selectedState 
                  ? "Select a state first" 
                  : loadingCities 
                    ? "Loading LGAs..." 
                    : "Select your LGA"
              } 
            />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border max-h-60 overflow-y-auto">
            {loadingCities ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Loading LGAs...</span>
              </div>
            ) : (
              cities.map((city) => (
                <SelectItem key={city.place_id} value={city.name}>
                  {city.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Ward Search and Selector */}
      <div className="space-y-2">
        <Label htmlFor="neighborhood">Ward/Neighborhood <span className="text-destructive">*</span></Label>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={!selectedCity ? "Select an LGA first" : "Search for your ward..."}
              value={neighborhoodSearch}
              onChange={(e) => setNeighborhoodSearch(e.target.value)}
              disabled={!selectedCity}
              className="pl-10"
            />
          </div>
          
          <Select 
            value={selectedNeighborhood} 
            onValueChange={setSelectedNeighborhood}
            disabled={!selectedCity}
          >
            <SelectTrigger>
              <SelectValue 
                placeholder={
                  !selectedCity 
                    ? "Select an LGA first" 
                    : loadingNeighborhoods 
                      ? "Loading wards..." 
                      : "Select your ward"
                } 
              />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border max-h-60 overflow-y-auto">
              {loadingNeighborhoods ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading wards...</span>
                </div>
              ) : neighborhoods.length > 0 ? (
                neighborhoods.map((neighborhood) => (
                  <SelectItem key={neighborhood.place_id} value={neighborhood.name}>
                    {neighborhood.name}
                  </SelectItem>
                ))
              ) : selectedCity && (
                <div className="p-4 text-center text-muted-foreground">
                  No wards found for {selectedCity}. This LGA may not have ward data yet.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedState && selectedCity && selectedNeighborhood && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {selectedNeighborhood} Ward, {selectedCity} LGA, {selectedState} State
            </span>
          </div>
        </div>
      )}
    </div>
  );
};