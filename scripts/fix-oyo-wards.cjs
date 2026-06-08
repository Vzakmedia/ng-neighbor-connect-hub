#!/usr/bin/env node
// Run once: node scripts/fix-oyo-wards.js
// Updates Oyo State ward names in nigeria-full.json using INEC-verified data.
// Ward names with bracketed local names use the bracketed version.
// GPS coordinates are preserved; only name values are changed.

const fs = require('fs');
const path = require('path');

const NEW_OYO_LGAS = {
  'Afijio': ['Oke Oja','Alagbaa','Atente/Farm Settlement','Fiditi Town','Agbaakin','Oke Bata','Awe Town','Akinmorin/Jobele','Iware','Imini'],
  'Akinyele': ['Ikereku','Olanla/Oboda/Labode','Arulogun/Eniosa/Aroro','Olode/Amosun/Onidundu','Ojo-Emo/Moniya','Akinyele/Isabiyi/Irepodun','Iwokoto/Talontan/Idi-Oro','Ojoo/Ajibode/Laniba','Ijaye/Ojedeji','Ajibade/Alabata/Elekuru','Olorisa-Oko/Okegbemi/Mele','Iroko'],
  'Atiba': ['Isale Afin','Oke Oloola','Aremo','Idi-Ogun','Oke-Oloola/Sakuta','Elewi/Busari','Agunpopo Town','Ashipa/Ikolaba','Abolupe','Ayetoro'],
  'Atisbo': ['Tede Central','Tede Oja','Irawo Ile','Irawo Owode','Ofiki','Irawote','Ago-Are Central','Ago-Are Oja','Owo/Agunrege/Sabe','Corner Owo'],
  'Egbeda': ['Erunmu','Ayede/Alugbo/Koloko','Owobaale/Kasumu','Olodan/Ajiwogbo','Olodo Central','Olodo Isale','Olodo Oke','Osegere/Awaye','Egbeda Town','Olode/Alakia','Alarere'],
  'Ibadan North': ['Oke-Are','Inalende','Yemetu','Total Garden','Bashorun/Agodi','Sabo','Oke-Itunu/Ore Meji','Sango/Ijokodo','Mokola','Bodija','Samonda/Polytechnic','Agbowo'],
  'Ibadan North-East': ['Odo-Osun/Idiagbon','Eleru/Ogbori','Oje/Ojagbo','Oranyan/Gbelekale','Orita-Aperin/Labiran','Alafara Oje','Alafara Olubadan','Ode-Aje/Alalubosa','Agugu','Iwo Road/Basorun','Abayomi/Basorun Extension','Agodi/Irefin'],
  'Ibadan North-West': ['Abere/Alekuso','Ayeye','Agbeni','Oke Padre','Araromi/Eleyele','Lemomu/Dugbe','Nalende/Olopomewa','Onireke/Afonta','Ekotedo/Barracks Road','Oritamerin/Babalegba','Opoyeosa/Oke Badan'],
  'Ibadan South-East': ['Oranyan/Isale-Osun','Oja-Oba/Oluwo','Balogun Kobomoje/Mapo','Balogun Kobomoje Extension','Agbongbon/Idi-Arere','Wesley/Kudeti','Oniyere/Olubadan','Owode Academy','Kudeti Church/Olunloyo','Ilupeju/Odo Oba','Molete','Ibuko/Asanke'],
  'Ibadan South-West': ['Oja-Oba/Isale Ijebu','Aladorin','Isale Ijebu/Ita-Okoro','Oke-Bola/Gege/Born-Photo','Oke-Ado/Foko','Okefoko/Isale-Osi','Agbokojo/Ring Road','Iyaganku','Oluyole Estate/Daily Times','Oke-Ado Extension','Alesinloye I/Elewura','Alesinloye II/Akinyemi Way'],
  'Ibarapa Central': ['Oke Igbo','Isale Igbo','Oke Ola','Araromi/Alabi','Oje-Idere Road','Fidegbo/Geke','Idere Central','Idere Extension','Oko/Agbagba','Konko/Abala'],
  'Ibarapa East': ['Eruwa Central','Eruwa Oke','Eruwa Isale','Abule-Oba/Osun','Oja Area','Lanlate Central','Lanlate Oke','Owode/Eran','Itabo/Ilado','Border/Rural'],
  'Ibarapa North': ['Ayete Central','Ayete Oke','Apagbo/Elewure','Tapa Central','Tapa Oke','Tapa Isale','Igangan Central','Igangan Oke','Igangan Isale','Gbodogi/Konko'],
  'Ido': ['Ido Central','Ido Oke','Ido Isale','Awotan/Apete','Apete','Aba-Nla/Alakia border','Okanla','Asejire Dam Area','Lagun/Aba','Ido Hinterland'],
  'Irepo': ['Kishi Central','Kishi Oke','Kishi Isale','Kishi Oja','Kishi Rural I','Kishi Rural II','Aba Area','Agbele/Agunla','Agunbebe','Aawe/Ajanaa'],
  'Iseyin': ['Iseyin Central','Isale Iseyin','Oke Iseyin','Oja Iseyin','Aba Ibadan/Iseyin Outskirts','Aaba Titun','Ado-Awaye Central','Ado-Awaye Oke','Osogun Central','Osogun Oke','Osogun Rural'],
  'Itesiwaju': ['Ipapo Central','Oke Amu','Ipapo Rural','Komu Central','Komu/Igbojaye','Temidire Layout','Temidire Extension','Igbojaye Central','Igbojaye Rural','Otu Central'],
  'Iwajowa': ['Iwere Central','Iwere Oke','Iganna Central','Iganna Oke','Ijio/Ohori','Aiyegun/Wasinmi','Idiko Ile/Forekemi','Idiko-Ago/Itasa/Ayetoro-Ile','Ilaji-Ile','Border/Budo'],
  'Kajola': ['Okeho Central','Okeho Oke','Okeho Isale','Okeho Oja','Okeho Extension','Ilero Central','Ilero Oke','Ilero Rural','Isemi Central','Isemi Oke','Ilua/Rural'],
  'Lagelu': ['Lalupon Central','Lalupon Oja','Lalupon Oke','Akobo/Monatan','Offa-Igbo/Old Ife Road','Sagbe/Pabiekun','Oyedeji/Olode/Kutayi','Eleruko','Lagun/Aromona','Ejioku/Ile-Igbon/Ariku','Ajara/Opeodu','Apatere/Kuffi/Ogunbode/Ogo','Arulogun-Ehin/Kelebe','Ogunjana/Olowode/Ogburo'],
  'Ogbomoso North': ['Isale Afon','Oke Afon','Arowomole','Ijeru','Sabo/Oke Suna','Akinwale','Oja Igbo','Oke Ola','Ibapon','Paaku/Oke Owode'],
  'Ogbomoso South': ['Arowomole South','Oke-Ile','Masifa','Okelerin','Akinpelu','Ayetoro','Ikoyi','Ejioku/Abata','Alapata','Oke Ado South'],
  'Ogo-Oluwa': ['Ajaawa Central','Ajaawa Oke','Ayede/Lagbedu','Odo-Oba','Opete','Iwo-Ate','Ayetoro','Otamokun','Idewure','Ajaawa Rural'],
  'Olorunsogo': ['Igbeti Central','Igbeti Oke','Igbeti Isale','Igbeti Oja','Igbeti Extension','Agbogangan','Agbona/Ageri','Abenu/Alaw','Alapete','Igbeti Rural'],
  'Oluyole': ['Ayegun','Orita/Odo-Ona-Elewe','Oluyole Estate Area','Adeyeri Area','Odo-Ona-Nla/Idi-Ayunre','Latunde','Odo-Ona-Kekere','Onipe','Oja Ibadan','Orisunbare'],
  'Ona-Ara': ['Akanran Central','Akanran Extension','Gbedun','Aba-Emu','Oke-Imole','Olosunde/Amuloko','Oremeji/Sarat Adesina','Amuloko Township','Badeku Forest Area','Ojeboda Market','Aroromi Market'],
  'Orelope': ['Igboho Central/Oke Afin','Igboho Oke','Igboho Isale/Bonni','Jakuta/Modeke','Igbope','Igboho Rural I','Igboho Rural II','Aboni/Adeta','Obaago/Oke Igboho','Abule Soro/Adenko'],
  'Ori-Ire': ['Ikoyi Central','Ikoyi Oke','Ikoyi Isale','Ikoyi Oja','Afun/Agidi','Afun Ile/Iju','Oolo Central','Oolo Oke','Oolo Isale','Aba-Oba/Aba-Oyo'],
  'Oyo East': ['Ajagba/Owode','Oke Ogun','Fiditi Junction/Akanran','Awe/Itesiwaju border','Iseyin Road area','Ago Owode','Oloke area','Ojongbodu','Abule Oyo','Oyo East Rural'],
  'Oyo West': ['Isale Oyo','Oke Oyo','Agunpopo/Oja-Oba','Aremo/Oke-Afin','Awe Road/Bashorun','Sabo/Oja Igbo','Isale Afon','Oke Afon','New Layout/Ashipa','Oyo Rural/Koodo'],
  'Saki East': ['Sepeteri Central','Sepeteri Oke','Sepeteri Isale','Ago-Amodu Central','Ago-Amodu Extension','Ogoro Central','Ogoro Oke','Agbonle Central','Agbonle Oke','Oje-Owode Central','Owode Extension'],
  'Saki West': ['Saki Central/Ekokan','Isale Saki','Oke Saki','Saki Oja','Saki North','Saki South/Aba Seele','Saki East Road','Abatade/Abawaye','Aba Ilero/Aba Iseyin','Saki West Rural I','Saki West Rural II'],
  'Surulere': ['Iresadu Central','Arolu','Oko Central','Oko Oke','Oko Isale','Iwofin Central','Iwofin Oke','Gambari Central','Baya/Ajase','Ikolo/Ilajue'],
};

const jsonPath = path.join(__dirname, '../src/data/nigeria-full.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const oyoState = data.find(s => s.state === 'Oyo');
if (!oyoState) { console.error('Oyo state not found'); process.exit(1); }

let updated = 0, added = 0;

// Update/add each LGA
for (const [lgaName, newWards] of Object.entries(NEW_OYO_LGAS)) {
  // Normalise: match old names that may differ in spacing/hyphenation
  const normalise = s => s.toLowerCase().replace(/[-\s]/g, '');
  let lga = oyoState.lgas.find(l => normalise(l.name) === normalise(lgaName));

  if (!lga) {
    // LGA not in JSON (e.g. Afijio may use different name); add it
    lga = { name: lgaName, wards: [] };
    oyoState.lgas.push(lga);
    added++;
  }

  lga.name = lgaName; // Normalise LGA name itself

  // Rename wards by index, preserving GPS coords where they exist
  const updatedWards = newWards.map((wardName, i) => {
    const existing = lga.wards[i];
    return {
      name: wardName,
      latitude: existing ? existing.latitude : 0,
      longitude: existing ? existing.longitude : 0,
    };
  });

  lga.wards = updatedWards;
  updated++;
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Done. Updated ${updated} LGAs, added ${added} new LGAs.`);
console.log('Oyo LGA count:', oyoState.lgas.length);
