-- Fix Oyo State location data in user profiles.
-- 1. Normalise LGA names (hyphenation fixes + add Afijio support)
-- 2. Map old ward names to new INEC-verified names
-- 3. Null out any neighbourhood that still doesn't match the new data

-- ── Step 1: LGA name normalisation ───────────────────────────────────────────
UPDATE profiles SET city = 'Ogo-Oluwa'   WHERE state = 'Oyo' AND city = 'Ogo Oluwa';
UPDATE profiles SET city = 'Ona-Ara'     WHERE state = 'Oyo' AND city = 'Ona Ara';
UPDATE profiles SET city = 'Ori-Ire'     WHERE state = 'Oyo' AND city = 'Ori Ire';
UPDATE profiles SET city = 'Ogbomoso North' WHERE state = 'Oyo' AND city = 'Ogbomosho North';
UPDATE profiles SET city = 'Ogbomoso South' WHERE state = 'Oyo' AND city = 'Ogbomosho South';

-- ── Step 2: Ward name mapping ─────────────────────────────────────────────────

-- Afijio
UPDATE profiles SET neighborhood = 'Oke Oja'                WHERE state='Oyo' AND city='Afijio' AND neighborhood IN ('Ilora I','Ilora');
UPDATE profiles SET neighborhood = 'Alagbaa'                 WHERE state='Oyo' AND city='Afijio' AND neighborhood = 'Ilora II';
UPDATE profiles SET neighborhood = 'Atente/Farm Settlement'  WHERE state='Oyo' AND city='Afijio' AND neighborhood = 'Ilora III';
UPDATE profiles SET neighborhood = 'Fiditi Town'             WHERE state='Oyo' AND city='Afijio' AND neighborhood IN ('Fiditi I','Fiditi');
UPDATE profiles SET neighborhood = 'Agbaakin'                WHERE state='Oyo' AND city='Afijio' AND neighborhood = 'Fiditi II';
UPDATE profiles SET neighborhood = 'Oke Bata'                WHERE state='Oyo' AND city='Afijio' AND neighborhood = 'Awe I';
UPDATE profiles SET neighborhood = 'Awe Town'                WHERE state='Oyo' AND city='Afijio' AND neighborhood = 'Awe II';

-- Atiba
UPDATE profiles SET neighborhood = 'Isale Afin'              WHERE state='Oyo' AND city='Atiba' AND neighborhood IN ('Oke-Afin I','Oke Afin I');
UPDATE profiles SET neighborhood = 'Oke Oloola'              WHERE state='Oyo' AND city='Atiba' AND neighborhood IN ('Oke-Afin II','Oke Afin II');
UPDATE profiles SET neighborhood = 'Idi-Ogun'                WHERE state='Oyo' AND city='Atiba' AND neighborhood = 'Bashorun';
UPDATE profiles SET neighborhood = 'Oke-Oloola/Sakuta'       WHERE state='Oyo' AND city='Atiba' AND neighborhood = 'Agunpopo I';
UPDATE profiles SET neighborhood = 'Elewi/Busari'            WHERE state='Oyo' AND city='Atiba' AND neighborhood = 'Agunpopo II';
UPDATE profiles SET neighborhood = 'Agunpopo Town'           WHERE state='Oyo' AND city='Atiba' AND neighborhood = 'Agunpopo III';
UPDATE profiles SET neighborhood = 'Ashipa/Ikolaba'          WHERE state='Oyo' AND city='Atiba' AND neighborhood = 'Ashipa I';
UPDATE profiles SET neighborhood = 'Abolupe'                 WHERE state='Oyo' AND city='Atiba' AND neighborhood = 'Ashipa II';
UPDATE profiles SET neighborhood = 'Ayetoro'                 WHERE state='Oyo' AND city='Atiba' AND neighborhood = 'Ashipa III';

-- Atisbo
UPDATE profiles SET neighborhood = 'Tede Central'            WHERE state='Oyo' AND city='Atisbo' AND neighborhood = 'Tede I';
UPDATE profiles SET neighborhood = 'Tede Oja'                WHERE state='Oyo' AND city='Atisbo' AND neighborhood = 'Tede II';
UPDATE profiles SET neighborhood = 'Irawote'                 WHERE state='Oyo' AND city='Atisbo' AND neighborhood = 'Alaga';
UPDATE profiles SET neighborhood = 'Ago-Are Central'         WHERE state='Oyo' AND city='Atisbo' AND neighborhood = 'Ago-Are I';
UPDATE profiles SET neighborhood = 'Ago-Are Oja'             WHERE state='Oyo' AND city='Atisbo' AND neighborhood = 'Ago-Are II';
UPDATE profiles SET neighborhood = 'Corner Owo'              WHERE state='Oyo' AND city='Atisbo' AND neighborhood = 'Baasi';

-- Egbeda
UPDATE profiles SET neighborhood = 'Olodo Central'           WHERE state='Oyo' AND city='Egbeda' AND neighborhood IN ('Olodo/Kumapayi I','Olodo I');
UPDATE profiles SET neighborhood = 'Olodo Isale'             WHERE state='Oyo' AND city='Egbeda' AND neighborhood = 'Olodo II';
UPDATE profiles SET neighborhood = 'Olodo Oke'               WHERE state='Oyo' AND city='Egbeda' AND neighborhood = 'Olodo III';
UPDATE profiles SET neighborhood = 'Egbeda Town'             WHERE state='Oyo' AND city='Egbeda' AND neighborhood = 'Egbeda';
UPDATE profiles SET neighborhood = 'Alarere'                 WHERE state='Oyo' AND city='Egbeda' AND neighborhood = 'Olubadan Estate';

-- Ibadan North
UPDATE profiles SET neighborhood = 'Oke-Are'                 WHERE state='Oyo' AND city='Ibadan North' AND neighborhood IN ('Ward I','Ward I - N2');
UPDATE profiles SET neighborhood = 'Inalende'                WHERE state='Oyo' AND city='Ibadan North' AND neighborhood IN ('Ward II','Ward II - N3');
UPDATE profiles SET neighborhood = 'Yemetu'                  WHERE state='Oyo' AND city='Ibadan North' AND neighborhood IN ('Ward III','Ward III - N4');
UPDATE profiles SET neighborhood = 'Total Garden'            WHERE state='Oyo' AND city='Ibadan North' AND neighborhood IN ('Ward IV','Ward IV - N5a');
UPDATE profiles SET neighborhood = 'Bashorun/Agodi'          WHERE state='Oyo' AND city='Ibadan North' AND neighborhood IN ('Ward V','Ward V - N5b');
UPDATE profiles SET neighborhood = 'Sabo'                    WHERE state='Oyo' AND city='Ibadan North' AND neighborhood IN ('Ward VI','Sabo');
UPDATE profiles SET neighborhood = 'Oke-Itunu/Ore Meji'      WHERE state='Oyo' AND city='Ibadan North' AND neighborhood = 'Ward VII';
UPDATE profiles SET neighborhood = 'Sango/Ijokodo'           WHERE state='Oyo' AND city='Ibadan North' AND neighborhood IN ('Ward VIII','Sango');
UPDATE profiles SET neighborhood = 'Mokola'                  WHERE state='Oyo' AND city='Ibadan North' AND neighborhood IN ('Ward IX','Mokola');
UPDATE profiles SET neighborhood = 'Bodija'                  WHERE state='Oyo' AND city='Ibadan North' AND neighborhood IN ('Ward X','Bodija');
UPDATE profiles SET neighborhood = 'Samonda/Polytechnic'     WHERE state='Oyo' AND city='Ibadan North' AND neighborhood IN ('Ward XI','Samonda');
UPDATE profiles SET neighborhood = 'Agbowo'                  WHERE state='Oyo' AND city='Ibadan North' AND neighborhood IN ('Ward XII','Agbowo','UI');

-- Ibarapa Central
UPDATE profiles SET neighborhood = 'Oke Igbo'                WHERE state='Oyo' AND city='Ibarapa Central' AND neighborhood = 'Igbo-Ora I';
UPDATE profiles SET neighborhood = 'Isale Igbo'              WHERE state='Oyo' AND city='Ibarapa Central' AND neighborhood = 'Igbo-Ora II';
UPDATE profiles SET neighborhood = 'Oke Ola'                 WHERE state='Oyo' AND city='Ibarapa Central' AND neighborhood = 'Igbo-Ora III';
UPDATE profiles SET neighborhood = 'Araromi/Alabi'           WHERE state='Oyo' AND city='Ibarapa Central' AND neighborhood = 'Igbo-Ora IV';
UPDATE profiles SET neighborhood = 'Oje-Idere Road'          WHERE state='Oyo' AND city='Ibarapa Central' AND neighborhood = 'Igbo-Ora V';
UPDATE profiles SET neighborhood = 'Fidegbo/Geke'            WHERE state='Oyo' AND city='Ibarapa Central' AND neighborhood = 'Igbo-Ora VI';
UPDATE profiles SET neighborhood = 'Idere Central'           WHERE state='Oyo' AND city='Ibarapa Central' AND neighborhood = 'Idere I';
UPDATE profiles SET neighborhood = 'Idere Extension'         WHERE state='Oyo' AND city='Ibarapa Central' AND neighborhood = 'Idere II';
UPDATE profiles SET neighborhood = 'Oko/Agbagba'             WHERE state='Oyo' AND city='Ibarapa Central' AND neighborhood = 'Igbo-Ora VII';
UPDATE profiles SET neighborhood = 'Konko/Abala'             WHERE state='Oyo' AND city='Ibarapa Central' AND neighborhood = 'Igbo-Ora VIII';

-- Ibarapa East
UPDATE profiles SET neighborhood = 'Eruwa Central'           WHERE state='Oyo' AND city='Ibarapa East' AND neighborhood = 'Eruwa I';
UPDATE profiles SET neighborhood = 'Eruwa Oke'               WHERE state='Oyo' AND city='Ibarapa East' AND neighborhood = 'Eruwa II';
UPDATE profiles SET neighborhood = 'Eruwa Isale'             WHERE state='Oyo' AND city='Ibarapa East' AND neighborhood = 'Eruwa III';
UPDATE profiles SET neighborhood = 'Abule-Oba/Osun'          WHERE state='Oyo' AND city='Ibarapa East' AND neighborhood = 'Eruwa IV';
UPDATE profiles SET neighborhood = 'Oja Area'                WHERE state='Oyo' AND city='Ibarapa East' AND neighborhood = 'Eruwa V';
UPDATE profiles SET neighborhood = 'Lanlate Central'         WHERE state='Oyo' AND city='Ibarapa East' AND neighborhood = 'Lanlate I';
UPDATE profiles SET neighborhood = 'Lanlate Oke'             WHERE state='Oyo' AND city='Ibarapa East' AND neighborhood = 'Lanlate II';
UPDATE profiles SET neighborhood = 'Owode/Eran'              WHERE state='Oyo' AND city='Ibarapa East' AND neighborhood = 'Lanlate III';
UPDATE profiles SET neighborhood = 'Itabo/Ilado'             WHERE state='Oyo' AND city='Ibarapa East' AND neighborhood = 'Lanlate IV';

-- Ibarapa North
UPDATE profiles SET neighborhood = 'Ayete Central'           WHERE state='Oyo' AND city='Ibarapa North' AND neighborhood = 'Ayete I';
UPDATE profiles SET neighborhood = 'Ayete Oke'               WHERE state='Oyo' AND city='Ibarapa North' AND neighborhood = 'Ayete II';
UPDATE profiles SET neighborhood = 'Apagbo/Elewure'          WHERE state='Oyo' AND city='Ibarapa North' AND neighborhood = 'Ayete III';
UPDATE profiles SET neighborhood = 'Tapa Central'            WHERE state='Oyo' AND city='Ibarapa North' AND neighborhood = 'Tapa I';
UPDATE profiles SET neighborhood = 'Tapa Oke'                WHERE state='Oyo' AND city='Ibarapa North' AND neighborhood = 'Tapa II';
UPDATE profiles SET neighborhood = 'Tapa Isale'              WHERE state='Oyo' AND city='Ibarapa North' AND neighborhood = 'Tapa III';
UPDATE profiles SET neighborhood = 'Igangan Central'         WHERE state='Oyo' AND city='Ibarapa North' AND neighborhood = 'Igangan I';
UPDATE profiles SET neighborhood = 'Igangan Oke'             WHERE state='Oyo' AND city='Ibarapa North' AND neighborhood = 'Igangan II';
UPDATE profiles SET neighborhood = 'Igangan Isale'           WHERE state='Oyo' AND city='Ibarapa North' AND neighborhood = 'Igangan III';
UPDATE profiles SET neighborhood = 'Gbodogi/Konko'           WHERE state='Oyo' AND city='Ibarapa North' AND neighborhood = 'Ayete/Tapa Rural';

-- Ido
UPDATE profiles SET neighborhood = 'Ido Central'             WHERE state='Oyo' AND city='Ido' AND neighborhood = 'Ido I';
UPDATE profiles SET neighborhood = 'Ido Oke'                 WHERE state='Oyo' AND city='Ido' AND neighborhood = 'Ido II';
UPDATE profiles SET neighborhood = 'Ido Isale'               WHERE state='Oyo' AND city='Ido' AND neighborhood = 'Ido III';
UPDATE profiles SET neighborhood = 'Awotan/Apete'            WHERE state='Oyo' AND city='Ido' AND neighborhood IN ('Awotan','Apete','Ido Eruwa');
UPDATE profiles SET neighborhood = 'Asejire Dam Area'        WHERE state='Oyo' AND city='Ido' AND neighborhood = 'Asejire';
UPDATE profiles SET neighborhood = 'Ido Hinterland'          WHERE state='Oyo' AND city='Ido' AND neighborhood IN ('Ido Rural','Bakatari','Ologuneru');

-- Irepo
UPDATE profiles SET neighborhood = 'Kishi Central'           WHERE state='Oyo' AND city='Irepo' AND neighborhood = 'Kishi I';
UPDATE profiles SET neighborhood = 'Kishi Oke'               WHERE state='Oyo' AND city='Irepo' AND neighborhood = 'Kishi II';
UPDATE profiles SET neighborhood = 'Kishi Isale'             WHERE state='Oyo' AND city='Irepo' AND neighborhood = 'Kishi III';
UPDATE profiles SET neighborhood = 'Kishi Oja'               WHERE state='Oyo' AND city='Irepo' AND neighborhood = 'Kishi IV';
UPDATE profiles SET neighborhood = 'Kishi Rural I'           WHERE state='Oyo' AND city='Irepo' AND neighborhood = 'Kishi V';
UPDATE profiles SET neighborhood = 'Kishi Rural II'          WHERE state='Oyo' AND city='Irepo' AND neighborhood = 'Kishi VI';
UPDATE profiles SET neighborhood = 'Aba Area'                WHERE state='Oyo' AND city='Irepo' AND neighborhood = 'Kishi VII';
UPDATE profiles SET neighborhood = 'Agbele/Agunla'           WHERE state='Oyo' AND city='Irepo' AND neighborhood = 'Kishi VIII';
UPDATE profiles SET neighborhood = 'Agunbebe'                WHERE state='Oyo' AND city='Irepo' AND neighborhood = 'Kishi IX';
UPDATE profiles SET neighborhood = 'Aawe/Ajanaa'             WHERE state='Oyo' AND city='Irepo' AND neighborhood = 'Kishi X';

-- Iseyin
UPDATE profiles SET neighborhood = 'Iseyin Central'          WHERE state='Oyo' AND city='Iseyin' AND neighborhood = 'Iseyin I';
UPDATE profiles SET neighborhood = 'Isale Iseyin'            WHERE state='Oyo' AND city='Iseyin' AND neighborhood = 'Iseyin II';
UPDATE profiles SET neighborhood = 'Oke Iseyin'              WHERE state='Oyo' AND city='Iseyin' AND neighborhood = 'Iseyin III';
UPDATE profiles SET neighborhood = 'Oja Iseyin'              WHERE state='Oyo' AND city='Iseyin' AND neighborhood = 'Iseyin IV';
UPDATE profiles SET neighborhood = 'Aba Ibadan/Iseyin Outskirts' WHERE state='Oyo' AND city='Iseyin' AND neighborhood = 'Iseyin V';
UPDATE profiles SET neighborhood = 'Aaba Titun'              WHERE state='Oyo' AND city='Iseyin' AND neighborhood = 'Iseyin VI';
UPDATE profiles SET neighborhood = 'Ado-Awaye Central'       WHERE state='Oyo' AND city='Iseyin' AND neighborhood = 'Ado-Awaye I';
UPDATE profiles SET neighborhood = 'Ado-Awaye Oke'           WHERE state='Oyo' AND city='Iseyin' AND neighborhood = 'Ado-Awaye II';
UPDATE profiles SET neighborhood = 'Osogun Central'          WHERE state='Oyo' AND city='Iseyin' AND neighborhood = 'Osogun I';
UPDATE profiles SET neighborhood = 'Osogun Oke'              WHERE state='Oyo' AND city='Iseyin' AND neighborhood = 'Osogun II';
UPDATE profiles SET neighborhood = 'Osogun Rural'            WHERE state='Oyo' AND city='Iseyin' AND neighborhood = 'Osogun III';

-- Itesiwaju
UPDATE profiles SET neighborhood = 'Ipapo Central'           WHERE state='Oyo' AND city='Itesiwaju' AND neighborhood IN ('Ipapo/Oke-Amu I','Ipapo I');
UPDATE profiles SET neighborhood = 'Oke Amu'                 WHERE state='Oyo' AND city='Itesiwaju' AND neighborhood IN ('Ipapo/Oke-Amu II','Ipapo II');
UPDATE profiles SET neighborhood = 'Ipapo Rural'             WHERE state='Oyo' AND city='Itesiwaju' AND neighborhood IN ('Ipapo/Oke-Amu III','Ipapo III');
UPDATE profiles SET neighborhood = 'Komu Central'            WHERE state='Oyo' AND city='Itesiwaju' AND neighborhood = 'Komu I';
UPDATE profiles SET neighborhood = 'Komu/Igbojaye'           WHERE state='Oyo' AND city='Itesiwaju' AND neighborhood = 'Komu II';
UPDATE profiles SET neighborhood = 'Temidire Layout'         WHERE state='Oyo' AND city='Itesiwaju' AND neighborhood = 'Temidire I';
UPDATE profiles SET neighborhood = 'Temidire Extension'      WHERE state='Oyo' AND city='Itesiwaju' AND neighborhood = 'Temidire II';
UPDATE profiles SET neighborhood = 'Igbojaye Central'        WHERE state='Oyo' AND city='Itesiwaju' AND neighborhood = 'Igbojaye I';
UPDATE profiles SET neighborhood = 'Igbojaye Rural'          WHERE state='Oyo' AND city='Itesiwaju' AND neighborhood = 'Igbojaye II';
UPDATE profiles SET neighborhood = 'Otu Central'             WHERE state='Oyo' AND city='Itesiwaju' AND neighborhood = 'Otu';

-- Iwajowa
UPDATE profiles SET neighborhood = 'Iwere Central'           WHERE state='Oyo' AND city='Iwajowa' AND neighborhood = 'Iwere-Ile I';
UPDATE profiles SET neighborhood = 'Iwere Oke'               WHERE state='Oyo' AND city='Iwajowa' AND neighborhood = 'Iwere-Ile II';
UPDATE profiles SET neighborhood = 'Iganna Central'          WHERE state='Oyo' AND city='Iwajowa' AND neighborhood = 'Iganna I';
UPDATE profiles SET neighborhood = 'Iganna Oke'              WHERE state='Oyo' AND city='Iwajowa' AND neighborhood = 'Iganna II';
UPDATE profiles SET neighborhood = 'Ijio/Ohori'              WHERE state='Oyo' AND city='Iwajowa' AND neighborhood = 'Ijio';
UPDATE profiles SET neighborhood = 'Aiyegun/Wasinmi'         WHERE state='Oyo' AND city='Iwajowa' AND neighborhood = 'Aiyegun';
UPDATE profiles SET neighborhood = 'Idiko Ile/Forekemi'      WHERE state='Oyo' AND city='Iwajowa' AND neighborhood = 'Idiko-Ile';
UPDATE profiles SET neighborhood = 'Border/Budo'             WHERE state='Oyo' AND city='Iwajowa' AND neighborhood = 'Iwere Rural';

-- Kajola
UPDATE profiles SET neighborhood = 'Okeho Central'           WHERE state='Oyo' AND city='Kajola' AND neighborhood = 'Okeho I';
UPDATE profiles SET neighborhood = 'Okeho Oke'               WHERE state='Oyo' AND city='Kajola' AND neighborhood = 'Okeho II';
UPDATE profiles SET neighborhood = 'Okeho Isale'             WHERE state='Oyo' AND city='Kajola' AND neighborhood = 'Okeho III';
UPDATE profiles SET neighborhood = 'Okeho Oja'               WHERE state='Oyo' AND city='Kajola' AND neighborhood = 'Okeho IV';
UPDATE profiles SET neighborhood = 'Okeho Extension'         WHERE state='Oyo' AND city='Kajola' AND neighborhood = 'Okeho V';
UPDATE profiles SET neighborhood = 'Ilero Central'           WHERE state='Oyo' AND city='Kajola' AND neighborhood = 'Ilero I';
UPDATE profiles SET neighborhood = 'Ilero Oke'               WHERE state='Oyo' AND city='Kajola' AND neighborhood = 'Ilero II';
UPDATE profiles SET neighborhood = 'Ilero Rural'             WHERE state='Oyo' AND city='Kajola' AND neighborhood = 'Ilero III';
UPDATE profiles SET neighborhood = 'Isemi Central'           WHERE state='Oyo' AND city='Kajola' AND neighborhood = 'Isemi-Ile/Ilua I';
UPDATE profiles SET neighborhood = 'Isemi Oke'               WHERE state='Oyo' AND city='Kajola' AND neighborhood = 'Isemi-Ile/Ilua II';
UPDATE profiles SET neighborhood = 'Ilua/Rural'              WHERE state='Oyo' AND city='Kajola' AND neighborhood = 'Isemi-Ile/Ilua III';

-- Lagelu
UPDATE profiles SET neighborhood = 'Lalupon Central'         WHERE state='Oyo' AND city='Lagelu' AND neighborhood = 'Lalupon I';
UPDATE profiles SET neighborhood = 'Lalupon Oja'             WHERE state='Oyo' AND city='Lagelu' AND neighborhood = 'Lalupon II';
UPDATE profiles SET neighborhood = 'Lalupon Oke'             WHERE state='Oyo' AND city='Lagelu' AND neighborhood = 'Lalupon III';
UPDATE profiles SET neighborhood = 'Akobo/Monatan'           WHERE state='Oyo' AND city='Lagelu' AND neighborhood = 'Olorunda/Monatan';
UPDATE profiles SET neighborhood = 'Offa-Igbo/Old Ife Road'  WHERE state='Oyo' AND city='Lagelu' AND neighborhood = 'Offa-Igbo';
UPDATE profiles SET neighborhood = 'Eleruko'                 WHERE state='Oyo' AND city='Lagelu' AND neighborhood = 'Ogunremi/Ogunsina';

-- Ogbomoso North (also handle old Ogbomosho spelling)
UPDATE profiles SET neighborhood = 'Isale Afon'              WHERE state='Oyo' AND city IN ('Ogbomoso North','Ogbomosho North') AND neighborhood = 'Ogbomoso I';
UPDATE profiles SET neighborhood = 'Oke Afon'                WHERE state='Oyo' AND city IN ('Ogbomoso North','Ogbomosho North') AND neighborhood = 'Ogbomoso II';
UPDATE profiles SET neighborhood = 'Arowomole'               WHERE state='Oyo' AND city IN ('Ogbomoso North','Ogbomosho North') AND neighborhood = 'Ogbomoso III';
UPDATE profiles SET neighborhood = 'Ijeru'                   WHERE state='Oyo' AND city IN ('Ogbomoso North','Ogbomosho North') AND neighborhood = 'Ogbomoso IV';
UPDATE profiles SET neighborhood = 'Sabo/Oke Suna'           WHERE state='Oyo' AND city IN ('Ogbomoso North','Ogbomosho North') AND neighborhood = 'Ogbomoso V';
UPDATE profiles SET neighborhood = 'Akinwale'                WHERE state='Oyo' AND city IN ('Ogbomoso North','Ogbomosho North') AND neighborhood = 'Ogbomoso VI';
UPDATE profiles SET neighborhood = 'Oja Igbo'                WHERE state='Oyo' AND city IN ('Ogbomoso North','Ogbomosho North') AND neighborhood = 'Ogbomoso VII';
UPDATE profiles SET neighborhood = 'Oke Ola'                 WHERE state='Oyo' AND city IN ('Ogbomoso North','Ogbomosho North') AND neighborhood = 'Ogbomoso VIII';
UPDATE profiles SET neighborhood = 'Ibapon'                  WHERE state='Oyo' AND city IN ('Ogbomoso North','Ogbomosho North') AND neighborhood = 'Ogbomoso IX';
UPDATE profiles SET neighborhood = 'Paaku/Oke Owode'         WHERE state='Oyo' AND city IN ('Ogbomoso North','Ogbomosho North') AND neighborhood = 'Ogbomoso X';

-- Ogbomoso South (also handle old Ogbomosho spelling)
UPDATE profiles SET neighborhood = 'Arowomole South'         WHERE state='Oyo' AND city IN ('Ogbomoso South','Ogbomosho South') AND neighborhood = 'Ogbomoso South I';
UPDATE profiles SET neighborhood = 'Oke-Ile'                 WHERE state='Oyo' AND city IN ('Ogbomoso South','Ogbomosho South') AND neighborhood = 'Ogbomoso South II';
UPDATE profiles SET neighborhood = 'Masifa'                  WHERE state='Oyo' AND city IN ('Ogbomoso South','Ogbomosho South') AND neighborhood = 'Ogbomoso South III';
UPDATE profiles SET neighborhood = 'Okelerin'                WHERE state='Oyo' AND city IN ('Ogbomoso South','Ogbomosho South') AND neighborhood = 'Ogbomoso South IV';
UPDATE profiles SET neighborhood = 'Akinpelu'                WHERE state='Oyo' AND city IN ('Ogbomoso South','Ogbomosho South') AND neighborhood = 'Ogbomoso South V';
UPDATE profiles SET neighborhood = 'Ayetoro'                 WHERE state='Oyo' AND city IN ('Ogbomoso South','Ogbomosho South') AND neighborhood = 'Ogbomoso South VI';
UPDATE profiles SET neighborhood = 'Ikoyi'                   WHERE state='Oyo' AND city IN ('Ogbomoso South','Ogbomosho South') AND neighborhood = 'Ogbomoso South VII';
UPDATE profiles SET neighborhood = 'Ejioku/Abata'            WHERE state='Oyo' AND city IN ('Ogbomoso South','Ogbomosho South') AND neighborhood = 'Ogbomoso South VIII';
UPDATE profiles SET neighborhood = 'Alapata'                 WHERE state='Oyo' AND city IN ('Ogbomoso South','Ogbomosho South') AND neighborhood = 'Ogbomoso South IX';
UPDATE profiles SET neighborhood = 'Oke Ado South'           WHERE state='Oyo' AND city IN ('Ogbomoso South','Ogbomosho South') AND neighborhood = 'Ogbomoso South X';

-- Ogo-Oluwa (was 'Ogo Oluwa')
UPDATE profiles SET neighborhood = 'Ajaawa Central'          WHERE state='Oyo' AND city IN ('Ogo-Oluwa','Ogo Oluwa') AND neighborhood = 'Ajaawa I';
UPDATE profiles SET neighborhood = 'Ajaawa Oke'              WHERE state='Oyo' AND city IN ('Ogo-Oluwa','Ogo Oluwa') AND neighborhood = 'Ajaawa II';
UPDATE profiles SET neighborhood = 'Ayede/Lagbedu'           WHERE state='Oyo' AND city IN ('Ogo-Oluwa','Ogo Oluwa') AND neighborhood = 'Ajaawa III';
UPDATE profiles SET neighborhood = 'Odo-Oba'                 WHERE state='Oyo' AND city IN ('Ogo-Oluwa','Ogo Oluwa') AND neighborhood = 'Ajaawa IV';
UPDATE profiles SET neighborhood = 'Opete'                   WHERE state='Oyo' AND city IN ('Ogo-Oluwa','Ogo Oluwa') AND neighborhood = 'Ajaawa V';
UPDATE profiles SET neighborhood = 'Iwo-Ate'                 WHERE state='Oyo' AND city IN ('Ogo-Oluwa','Ogo Oluwa') AND neighborhood = 'Ajaawa VI';
UPDATE profiles SET neighborhood = 'Ayetoro'                 WHERE state='Oyo' AND city IN ('Ogo-Oluwa','Ogo Oluwa') AND neighborhood = 'Ajaawa VII';
UPDATE profiles SET neighborhood = 'Otamokun'                WHERE state='Oyo' AND city IN ('Ogo-Oluwa','Ogo Oluwa') AND neighborhood = 'Ajaawa VIII';
UPDATE profiles SET neighborhood = 'Idewure'                 WHERE state='Oyo' AND city IN ('Ogo-Oluwa','Ogo Oluwa') AND neighborhood = 'Ajaawa IX';
UPDATE profiles SET neighborhood = 'Ajaawa Rural'            WHERE state='Oyo' AND city IN ('Ogo-Oluwa','Ogo Oluwa') AND neighborhood = 'Ajaawa X';

-- Olorunsogo
UPDATE profiles SET neighborhood = 'Igbeti Central'          WHERE state='Oyo' AND city='Olorunsogo' AND neighborhood = 'Igbeti I';
UPDATE profiles SET neighborhood = 'Igbeti Oke'              WHERE state='Oyo' AND city='Olorunsogo' AND neighborhood = 'Igbeti II';
UPDATE profiles SET neighborhood = 'Igbeti Isale'            WHERE state='Oyo' AND city='Olorunsogo' AND neighborhood = 'Igbeti III';
UPDATE profiles SET neighborhood = 'Igbeti Oja'              WHERE state='Oyo' AND city='Olorunsogo' AND neighborhood = 'Igbeti IV';
UPDATE profiles SET neighborhood = 'Igbeti Extension'        WHERE state='Oyo' AND city='Olorunsogo' AND neighborhood = 'Igbeti V';
UPDATE profiles SET neighborhood = 'Agbona/Ageri'            WHERE state='Oyo' AND city='Olorunsogo' AND neighborhood = 'Igbeti VII';
UPDATE profiles SET neighborhood = 'Abenu/Alaw'              WHERE state='Oyo' AND city='Olorunsogo' AND neighborhood = 'Igbeti VIII';
UPDATE profiles SET neighborhood = 'Alapete'                 WHERE state='Oyo' AND city='Olorunsogo' AND neighborhood = 'Igbeti IX';
UPDATE profiles SET neighborhood = 'Igbeti Rural'            WHERE state='Oyo' AND city='Olorunsogo' AND neighborhood = 'Igbeti X';

-- Oluyole
UPDATE profiles SET neighborhood = 'Oluyole Estate Area'     WHERE state='Oyo' AND city='Oluyole' AND neighborhood IN ('Muslim/Agric','Olunde');
UPDATE profiles SET neighborhood = 'Adeyeri Area'            WHERE state='Oyo' AND city='Oluyole' AND neighborhood = 'Egbeda-Tuba';
UPDATE profiles SET neighborhood = 'Odo-Ona-Kekere'         WHERE state='Oyo' AND city='Oluyole' AND neighborhood IN ('Bare','Ido Ayunre','Idi Ayunre');
UPDATE profiles SET neighborhood = 'Oja Ibadan'              WHERE state='Oyo' AND city='Oluyole' AND neighborhood = 'Aba-Nla';

-- Ona-Ara (was 'Ona Ara')
UPDATE profiles SET neighborhood = 'Akanran Central'         WHERE state='Oyo' AND city IN ('Ona-Ara','Ona Ara') AND neighborhood = 'Akanran I';
UPDATE profiles SET neighborhood = 'Akanran Extension'       WHERE state='Oyo' AND city IN ('Ona-Ara','Ona Ara') AND neighborhood = 'Akanran II';
UPDATE profiles SET neighborhood = 'Aba-Emu'                 WHERE state='Oyo' AND city IN ('Ona-Ara','Ona Ara') AND neighborhood = 'Idi-Ose';
UPDATE profiles SET neighborhood = 'Oke-Imole'               WHERE state='Oyo' AND city IN ('Ona-Ara','Ona Ara') AND neighborhood = 'Olunloyo';
UPDATE profiles SET neighborhood = 'Olosunde/Amuloko'        WHERE state='Oyo' AND city IN ('Ona-Ara','Ona Ara') AND neighborhood = 'Olorunsogo';
UPDATE profiles SET neighborhood = 'Oremeji/Sarat Adesina'   WHERE state='Oyo' AND city IN ('Ona-Ara','Ona Ara') AND neighborhood = 'Oremeji';
UPDATE profiles SET neighborhood = 'Amuloko Township'        WHERE state='Oyo' AND city IN ('Ona-Ara','Ona Ara') AND neighborhood = 'Amuloko';
UPDATE profiles SET neighborhood = 'Badeku Forest Area'      WHERE state='Oyo' AND city IN ('Ona-Ara','Ona Ara') AND neighborhood = 'Badeku';
UPDATE profiles SET neighborhood = 'Ojeboda Market'          WHERE state='Oyo' AND city IN ('Ona-Ara','Ona Ara') AND neighborhood = 'Ojeboda';
UPDATE profiles SET neighborhood = 'Aroromi Market'          WHERE state='Oyo' AND city IN ('Ona-Ara','Ona Ara') AND neighborhood = 'Aroromi/Dagbolu';

-- Orelope
UPDATE profiles SET neighborhood = 'Igboho Central/Oke Afin' WHERE state='Oyo' AND city='Orelope' AND neighborhood = 'Igboho I';
UPDATE profiles SET neighborhood = 'Igboho Oke'              WHERE state='Oyo' AND city='Orelope' AND neighborhood = 'Igboho II';
UPDATE profiles SET neighborhood = 'Igboho Isale/Bonni'      WHERE state='Oyo' AND city='Orelope' AND neighborhood = 'Igboho III';
UPDATE profiles SET neighborhood = 'Jakuta/Modeke'           WHERE state='Oyo' AND city='Orelope' AND neighborhood = 'Igboho IV';
UPDATE profiles SET neighborhood = 'Igbope'                  WHERE state='Oyo' AND city='Orelope' AND neighborhood = 'Igboho V';
UPDATE profiles SET neighborhood = 'Igboho Rural I'          WHERE state='Oyo' AND city='Orelope' AND neighborhood = 'Igboho VI';
UPDATE profiles SET neighborhood = 'Igboho Rural II'         WHERE state='Oyo' AND city='Orelope' AND neighborhood = 'Igboho VII';
UPDATE profiles SET neighborhood = 'Aboni/Adeta'             WHERE state='Oyo' AND city='Orelope' AND neighborhood = 'Igboho VIII';
UPDATE profiles SET neighborhood = 'Obaago/Oke Igboho'       WHERE state='Oyo' AND city='Orelope' AND neighborhood = 'Igboho IX';
UPDATE profiles SET neighborhood = 'Abule Soro/Adenko'       WHERE state='Oyo' AND city='Orelope' AND neighborhood = 'Igboho X';

-- Ori-Ire (was 'Ori Ire')
UPDATE profiles SET neighborhood = 'Ikoyi Central'           WHERE state='Oyo' AND city IN ('Ori-Ire','Ori Ire') AND neighborhood = 'Ikoyi-Ile I';
UPDATE profiles SET neighborhood = 'Ikoyi Oke'               WHERE state='Oyo' AND city IN ('Ori-Ire','Ori Ire') AND neighborhood = 'Ikoyi-Ile II';
UPDATE profiles SET neighborhood = 'Ikoyi Isale'             WHERE state='Oyo' AND city IN ('Ori-Ire','Ori Ire') AND neighborhood = 'Ikoyi-Ile III';
UPDATE profiles SET neighborhood = 'Ikoyi Oja'               WHERE state='Oyo' AND city IN ('Ori-Ire','Ori Ire') AND neighborhood = 'Ikoyi-Ile IV';
UPDATE profiles SET neighborhood = 'Afun/Agidi'              WHERE state='Oyo' AND city IN ('Ori-Ire','Ori Ire') AND neighborhood = 'Ikoyi-Ile V';
UPDATE profiles SET neighborhood = 'Afun Ile/Iju'            WHERE state='Oyo' AND city IN ('Ori-Ire','Ori Ire') AND neighborhood = 'Ikoyi-Ile VI';
UPDATE profiles SET neighborhood = 'Oolo Central'            WHERE state='Oyo' AND city IN ('Ori-Ire','Ori Ire') AND neighborhood = 'Oolo I';
UPDATE profiles SET neighborhood = 'Oolo Oke'                WHERE state='Oyo' AND city IN ('Ori-Ire','Ori Ire') AND neighborhood = 'Oolo II';
UPDATE profiles SET neighborhood = 'Oolo Isale'              WHERE state='Oyo' AND city IN ('Ori-Ire','Ori Ire') AND neighborhood = 'Oolo III';
UPDATE profiles SET neighborhood = 'Aba-Oba/Aba-Oyo'         WHERE state='Oyo' AND city IN ('Ori-Ire','Ori Ire') AND neighborhood = 'Oolo IV';

-- Oyo East
UPDATE profiles SET neighborhood = 'Ajagba/Owode'            WHERE state='Oyo' AND city='Oyo East' AND neighborhood = 'Oyo East I';
UPDATE profiles SET neighborhood = 'Oke Ogun'                WHERE state='Oyo' AND city='Oyo East' AND neighborhood = 'Oyo East II';
UPDATE profiles SET neighborhood = 'Fiditi Junction/Akanran'  WHERE state='Oyo' AND city='Oyo East' AND neighborhood = 'Oyo East III';
UPDATE profiles SET neighborhood = 'Awe/Itesiwaju border'    WHERE state='Oyo' AND city='Oyo East' AND neighborhood = 'Oyo East IV';
UPDATE profiles SET neighborhood = 'Iseyin Road area'         WHERE state='Oyo' AND city='Oyo East' AND neighborhood = 'Oyo East V';
UPDATE profiles SET neighborhood = 'Ago Owode'               WHERE state='Oyo' AND city='Oyo East' AND neighborhood = 'Oyo East VI';
UPDATE profiles SET neighborhood = 'Oloke area'              WHERE state='Oyo' AND city='Oyo East' AND neighborhood = 'Oyo East VII';
UPDATE profiles SET neighborhood = 'Ojongbodu'               WHERE state='Oyo' AND city='Oyo East' AND neighborhood = 'Oyo East VIII';
UPDATE profiles SET neighborhood = 'Abule Oyo'               WHERE state='Oyo' AND city='Oyo East' AND neighborhood = 'Oyo East IX';
UPDATE profiles SET neighborhood = 'Oyo East Rural'          WHERE state='Oyo' AND city='Oyo East' AND neighborhood = 'Oyo East X';

-- Oyo West
UPDATE profiles SET neighborhood = 'Isale Oyo'               WHERE state='Oyo' AND city='Oyo West' AND neighborhood = 'Oyo West I';
UPDATE profiles SET neighborhood = 'Oke Oyo'                 WHERE state='Oyo' AND city='Oyo West' AND neighborhood = 'Oyo West II';
UPDATE profiles SET neighborhood = 'Agunpopo/Oja-Oba'        WHERE state='Oyo' AND city='Oyo West' AND neighborhood = 'Oyo West III';
UPDATE profiles SET neighborhood = 'Aremo/Oke-Afin'          WHERE state='Oyo' AND city='Oyo West' AND neighborhood = 'Oyo West IV';
UPDATE profiles SET neighborhood = 'Awe Road/Bashorun'       WHERE state='Oyo' AND city='Oyo West' AND neighborhood = 'Oyo West V';
UPDATE profiles SET neighborhood = 'Sabo/Oja Igbo'           WHERE state='Oyo' AND city='Oyo West' AND neighborhood = 'Oyo West VI';
UPDATE profiles SET neighborhood = 'Isale Afon'              WHERE state='Oyo' AND city='Oyo West' AND neighborhood = 'Oyo West VII';
UPDATE profiles SET neighborhood = 'Oke Afon'                WHERE state='Oyo' AND city='Oyo West' AND neighborhood = 'Oyo West VIII';
UPDATE profiles SET neighborhood = 'New Layout/Ashipa'       WHERE state='Oyo' AND city='Oyo West' AND neighborhood = 'Oyo West IX';
UPDATE profiles SET neighborhood = 'Oyo Rural/Koodo'         WHERE state='Oyo' AND city='Oyo West' AND neighborhood = 'Oyo West X';

-- Saki East
UPDATE profiles SET neighborhood = 'Sepeteri Central'        WHERE state='Oyo' AND city='Saki East' AND neighborhood = 'Sepeteri I';
UPDATE profiles SET neighborhood = 'Sepeteri Oke'            WHERE state='Oyo' AND city='Saki East' AND neighborhood = 'Sepeteri II';
UPDATE profiles SET neighborhood = 'Sepeteri Isale'          WHERE state='Oyo' AND city='Saki East' AND neighborhood = 'Sepeteri III';
UPDATE profiles SET neighborhood = 'Ago-Amodu Central'       WHERE state='Oyo' AND city='Saki East' AND neighborhood = 'Ago-Amodu I';
UPDATE profiles SET neighborhood = 'Ago-Amodu Extension'     WHERE state='Oyo' AND city='Saki East' AND neighborhood = 'Ago-Amodu II';
UPDATE profiles SET neighborhood = 'Ogoro Central'           WHERE state='Oyo' AND city='Saki East' AND neighborhood = 'Ogoro I';
UPDATE profiles SET neighborhood = 'Ogoro Oke'               WHERE state='Oyo' AND city='Saki East' AND neighborhood = 'Ogoro II';
UPDATE profiles SET neighborhood = 'Agbonle Central'         WHERE state='Oyo' AND city='Saki East' AND neighborhood = 'Agbonle I';
UPDATE profiles SET neighborhood = 'Agbonle Oke'             WHERE state='Oyo' AND city='Saki East' AND neighborhood = 'Agbonle II';
UPDATE profiles SET neighborhood = 'Oje-Owode Central'       WHERE state='Oyo' AND city='Saki East' AND neighborhood = 'Oje-Owode I';
UPDATE profiles SET neighborhood = 'Owode Extension'         WHERE state='Oyo' AND city='Saki East' AND neighborhood = 'Oje-Owode II';

-- Saki West
UPDATE profiles SET neighborhood = 'Saki Central/Ekokan'     WHERE state='Oyo' AND city='Saki West' AND neighborhood = 'Saki I';
UPDATE profiles SET neighborhood = 'Isale Saki'              WHERE state='Oyo' AND city='Saki West' AND neighborhood = 'Saki II';
UPDATE profiles SET neighborhood = 'Oke Saki'                WHERE state='Oyo' AND city='Saki West' AND neighborhood = 'Saki III';
UPDATE profiles SET neighborhood = 'Saki Oja'                WHERE state='Oyo' AND city='Saki West' AND neighborhood = 'Saki IV';
UPDATE profiles SET neighborhood = 'Saki North'              WHERE state='Oyo' AND city='Saki West' AND neighborhood = 'Saki V';
UPDATE profiles SET neighborhood = 'Saki South/Aba Seele'    WHERE state='Oyo' AND city='Saki West' AND neighborhood = 'Saki VI';
UPDATE profiles SET neighborhood = 'Saki East Road'          WHERE state='Oyo' AND city='Saki West' AND neighborhood = 'Saki VII';
UPDATE profiles SET neighborhood = 'Abatade/Abawaye'         WHERE state='Oyo' AND city='Saki West' AND neighborhood = 'Saki VIII';
UPDATE profiles SET neighborhood = 'Aba Ilero/Aba Iseyin'    WHERE state='Oyo' AND city='Saki West' AND neighborhood = 'Saki IX';
UPDATE profiles SET neighborhood = 'Saki West Rural I'       WHERE state='Oyo' AND city='Saki West' AND neighborhood = 'Saki X';
UPDATE profiles SET neighborhood = 'Saki West Rural II'      WHERE state='Oyo' AND city='Saki West' AND neighborhood = 'Saki XI';

-- Surulere
UPDATE profiles SET neighborhood = 'Iresadu Central'         WHERE state='Oyo' AND city='Surulere' AND neighborhood = 'Iresadu/Arolu I';
UPDATE profiles SET neighborhood = 'Arolu'                   WHERE state='Oyo' AND city='Surulere' AND neighborhood = 'Iresadu/Arolu II';
UPDATE profiles SET neighborhood = 'Oko Central'             WHERE state='Oyo' AND city='Surulere' AND neighborhood = 'Oko I';
UPDATE profiles SET neighborhood = 'Oko Oke'                 WHERE state='Oyo' AND city='Surulere' AND neighborhood = 'Oko II';
UPDATE profiles SET neighborhood = 'Oko Isale'               WHERE state='Oyo' AND city='Surulere' AND neighborhood = 'Oko III';
UPDATE profiles SET neighborhood = 'Iwofin Central'          WHERE state='Oyo' AND city='Surulere' AND neighborhood = 'Iwofin I';
UPDATE profiles SET neighborhood = 'Iwofin Oke'              WHERE state='Oyo' AND city='Surulere' AND neighborhood = 'Iwofin II';
UPDATE profiles SET neighborhood = 'Gambari Central'         WHERE state='Oyo' AND city='Surulere' AND neighborhood = 'Gambari/Baya I';
UPDATE profiles SET neighborhood = 'Baya/Ajase'              WHERE state='Oyo' AND city='Surulere' AND neighborhood = 'Gambari/Baya II';
UPDATE profiles SET neighborhood = 'Ikolo/Ilajue'            WHERE state='Oyo' AND city='Surulere' AND neighborhood = 'Surulere Rural';

-- ── Step 3: Safety net — null out any remaining unrecognised neighbourhoods ───
UPDATE profiles
SET neighborhood = NULL
WHERE state = 'Oyo'
  AND neighborhood IS NOT NULL
  AND neighborhood NOT IN (
    'Oke Oja','Alagbaa','Atente/Farm Settlement','Fiditi Town','Agbaakin','Oke Bata','Awe Town','Akinmorin/Jobele','Iware','Imini',
    'Ikereku','Olanla/Oboda/Labode','Arulogun/Eniosa/Aroro','Olode/Amosun/Onidundu','Ojo-Emo/Moniya','Akinyele/Isabiyi/Irepodun','Iwokoto/Talontan/Idi-Oro','Ojoo/Ajibode/Laniba','Ijaye/Ojedeji','Ajibade/Alabata/Elekuru','Olorisa-Oko/Okegbemi/Mele','Iroko',
    'Isale Afin','Oke Oloola','Aremo','Idi-Ogun','Oke-Oloola/Sakuta','Elewi/Busari','Agunpopo Town','Ashipa/Ikolaba','Abolupe','Ayetoro',
    'Tede Central','Tede Oja','Irawo Ile','Irawo Owode','Ofiki','Irawote','Ago-Are Central','Ago-Are Oja','Owo/Agunrege/Sabe','Corner Owo',
    'Erunmu','Ayede/Alugbo/Koloko','Owobaale/Kasumu','Olodan/Ajiwogbo','Olodo Central','Olodo Isale','Olodo Oke','Osegere/Awaye','Egbeda Town','Olode/Alakia','Alarere',
    'Oke-Are','Inalende','Yemetu','Total Garden','Bashorun/Agodi','Sabo','Oke-Itunu/Ore Meji','Sango/Ijokodo','Mokola','Bodija','Samonda/Polytechnic','Agbowo',
    'Odo-Osun/Idiagbon','Eleru/Ogbori','Oje/Ojagbo','Oranyan/Gbelekale','Orita-Aperin/Labiran','Alafara Oje','Alafara Olubadan','Ode-Aje/Alalubosa','Agugu','Iwo Road/Basorun','Abayomi/Basorun Extension','Agodi/Irefin',
    'Abere/Alekuso','Ayeye','Agbeni','Oke Padre','Araromi/Eleyele','Lemomu/Dugbe','Nalende/Olopomewa','Onireke/Afonta','Ekotedo/Barracks Road','Oritamerin/Babalegba','Opoyeosa/Oke Badan',
    'Oranyan/Isale-Osun','Oja-Oba/Oluwo','Balogun Kobomoje/Mapo','Balogun Kobomoje Extension','Agbongbon/Idi-Arere','Wesley/Kudeti','Oniyere/Olubadan','Owode Academy','Kudeti Church/Olunloyo','Ilupeju/Odo Oba','Molete','Ibuko/Asanke',
    'Oja-Oba/Isale Ijebu','Aladorin','Isale Ijebu/Ita-Okoro','Oke-Bola/Gege/Born-Photo','Oke-Ado/Foko','Okefoko/Isale-Osi','Agbokojo/Ring Road','Iyaganku','Oluyole Estate/Daily Times','Oke-Ado Extension','Alesinloye I/Elewura','Alesinloye II/Akinyemi Way',
    'Oke Igbo','Isale Igbo','Oke Ola','Araromi/Alabi','Oje-Idere Road','Fidegbo/Geke','Idere Central','Idere Extension','Oko/Agbagba','Konko/Abala',
    'Eruwa Central','Eruwa Oke','Eruwa Isale','Abule-Oba/Osun','Oja Area','Lanlate Central','Lanlate Oke','Owode/Eran','Itabo/Ilado','Border/Rural',
    'Ayete Central','Ayete Oke','Apagbo/Elewure','Tapa Central','Tapa Oke','Tapa Isale','Igangan Central','Igangan Oke','Igangan Isale','Gbodogi/Konko',
    'Ido Central','Ido Oke','Ido Isale','Awotan/Apete','Apete','Aba-Nla/Alakia border','Okanla','Asejire Dam Area','Lagun/Aba','Ido Hinterland',
    'Kishi Central','Kishi Oke','Kishi Isale','Kishi Oja','Kishi Rural I','Kishi Rural II','Aba Area','Agbele/Agunla','Agunbebe','Aawe/Ajanaa',
    'Iseyin Central','Isale Iseyin','Oke Iseyin','Oja Iseyin','Aba Ibadan/Iseyin Outskirts','Aaba Titun','Ado-Awaye Central','Ado-Awaye Oke','Osogun Central','Osogun Oke','Osogun Rural',
    'Ipapo Central','Oke Amu','Ipapo Rural','Komu Central','Komu/Igbojaye','Temidire Layout','Temidire Extension','Igbojaye Central','Igbojaye Rural','Otu Central',
    'Iwere Central','Iwere Oke','Iganna Central','Iganna Oke','Ijio/Ohori','Aiyegun/Wasinmi','Idiko Ile/Forekemi','Idiko-Ago/Itasa/Ayetoro-Ile','Ilaji-Ile','Border/Budo',
    'Okeho Central','Okeho Oke','Okeho Isale','Okeho Oja','Okeho Extension','Ilero Central','Ilero Oke','Ilero Rural','Isemi Central','Isemi Oke','Ilua/Rural',
    'Lalupon Central','Lalupon Oja','Lalupon Oke','Akobo/Monatan','Offa-Igbo/Old Ife Road','Sagbe/Pabiekun','Oyedeji/Olode/Kutayi','Eleruko','Lagun/Aromona','Ejioku/Ile-Igbon/Ariku','Ajara/Opeodu','Apatere/Kuffi/Ogunbode/Ogo','Arulogun-Ehin/Kelebe','Ogunjana/Olowode/Ogburo',
    'Isale Afon','Oke Afon','Arowomole','Ijeru','Sabo/Oke Suna','Akinwale','Oja Igbo','Ibapon','Paaku/Oke Owode',
    'Arowomole South','Oke-Ile','Masifa','Okelerin','Akinpelu','Ikoyi','Ejioku/Abata','Alapata','Oke Ado South',
    'Ajaawa Central','Ajaawa Oke','Ayede/Lagbedu','Odo-Oba','Opete','Iwo-Ate','Otamokun','Idewure','Ajaawa Rural',
    'Igbeti Central','Igbeti Oke','Igbeti Isale','Igbeti Oja','Igbeti Extension','Agbogangan','Agbona/Ageri','Abenu/Alaw','Alapete','Igbeti Rural',
    'Ayegun','Orita/Odo-Ona-Elewe','Oluyole Estate Area','Adeyeri Area','Odo-Ona-Nla/Idi-Ayunre','Latunde','Odo-Ona-Kekere','Onipe','Oja Ibadan','Orisunbare',
    'Akanran Central','Akanran Extension','Gbedun','Aba-Emu','Oke-Imole','Olosunde/Amuloko','Oremeji/Sarat Adesina','Amuloko Township','Badeku Forest Area','Ojeboda Market','Aroromi Market',
    'Igboho Central/Oke Afin','Igboho Oke','Igboho Isale/Bonni','Jakuta/Modeke','Igbope','Igboho Rural I','Igboho Rural II','Aboni/Adeta','Obaago/Oke Igboho','Abule Soro/Adenko',
    'Ikoyi Central','Ikoyi Oke','Ikoyi Isale','Ikoyi Oja','Afun/Agidi','Afun Ile/Iju','Oolo Central','Oolo Oke','Oolo Isale','Aba-Oba/Aba-Oyo',
    'Ajagba/Owode','Oke Ogun','Fiditi Junction/Akanran','Awe/Itesiwaju border','Iseyin Road area','Ago Owode','Oloke area','Ojongbodu','Abule Oyo','Oyo East Rural',
    'Isale Oyo','Oke Oyo','Agunpopo/Oja-Oba','Aremo/Oke-Afin','Awe Road/Bashorun','Sabo/Oja Igbo','New Layout/Ashipa','Oyo Rural/Koodo',
    'Sepeteri Central','Sepeteri Oke','Sepeteri Isale','Ago-Amodu Central','Ago-Amodu Extension','Ogoro Central','Ogoro Oke','Agbonle Central','Agbonle Oke','Oje-Owode Central','Owode Extension',
    'Saki Central/Ekokan','Isale Saki','Oke Saki','Saki Oja','Saki North','Saki South/Aba Seele','Saki East Road','Abatade/Abawaye','Aba Ilero/Aba Iseyin','Saki West Rural I','Saki West Rural II',
    'Iresadu Central','Arolu','Oko Central','Oko Oke','Oko Isale','Iwofin Central','Iwofin Oke','Gambari Central','Baya/Ajase','Ikolo/Ilajue'
  );
