// "Model types" (trims / versions) for the models in modelsData, written as Make -> Model -> 'Trim|Trim|...'.
// This is a starting list for the Model types filter and for the suggestions on Place Ad: a seller can still type any other
// trim, and every trim that appears on a live ad is added to the filter automatically. Models that are not listed here have
// no suggestions yet.
const AUDI = 'SE|Sport|S line|Black Edition|Vorsprung|Edition 1';
const BMW_SUV = 'SE|xLine|M Sport|M Sport Pro|Edition';
const MB = 'SE|Sport|AMG Line|AMG Line Premium|AMG Line Premium Plus|Exclusive|Night Edition|Progressive|Premium|Premium Plus';
const VW = 'S|Life|Match|Style|R-Line|SE|SEL|Black Edition';
const PSA = 'Access|Active|Allure|Allure Premium|GT Line|GT Premium|Style|Like|Feline|Business|Edition';
const KIA = '1|2|3|4|GT-Line|GT-Line S|Business|Edition';
const HYU = 'S|SE|SE Connect|Premium|Premium SE|Comfort|Executive|N Line|Ultimate|Go|Active|Classic|Style|Tech';
const TOY = 'Terra|Aura|Luna|Sol|Icon|Excel|Design|Dynamic|GR Sport|Premiere|Business Edition';
const SKO = 'S|SE|SE Technology|SE L|SE Drive|Monte Carlo|Sportline|Laurin & Klement|Ambition|Style|Elegance|vRS';
const REN = 'Play|Evolution|Techno|Iconic|Esprit Alpine|R.S. Line|Equilibre|Intens|Dynamique|Expression|Signature|GT Line';
const SEAT = 'SE|SE Technology|FR|FR Sport|Xcellence|Xcellence Lux|Style|Reference|Move';
const MAZ = 'SE-L|SE-L Lux|Sport Nav|GT Sport|Exclusive-Line|Homura|Takumi|Newground|Centre-Line|Prime-Line|Kuro Edition';
const OPEL = 'Edition|SE|SRi|Elite|Ultimate|GS|GS Line|Design|Business Edition|Elegance|Griffin|Electric';
const VOLVO = 'Core|Plus|Ultimate|Momentum|Momentum Pro|Inscription|R-Design|Recharge|Dark|Bright';
const JLR = 'S|SE|HSE|R-Dynamic S|R-Dynamic SE|R-Dynamic HSE|Autobiography|First Edition|Edition';
const LEXUS = 'Executive|Luxury|Premier|Sport|F Sport|Takumi|Hybrid';

const trimsByMake = {
  Abarth: { '500': '500|595|595 Competizione|595 Turismo|695|500e', '595': 'Pista|Turismo|Competizione', '124 Spider': 'Spider|Turismo' },
  'Alfa Romeo': {
    Giulia: 'Super|Sprint|Ti|Veloce|Quadrifoglio|Speciale|Lusso', Giulietta: 'Super|Sprint|Lusso|Veloce|Speciale|Business Edition|Distinctive|Exclusive|Quadrifoglio Verde',
    MiTo: 'Distinctive|Lusso|Veloce|Super|Sprint|Junior|Quadrifoglio Verde', Stelvio: 'Super|Sprint|Ti|Veloce|Quadrifoglio|Speciale|Lusso', Tonale: 'Sprint|Ti|Veloce|Speciale|Edizione Speciale',
  },
  'Aston Martin': { DBX: 'DBX|DBX707', Vantage: 'V8|V12|F1 Edition|Roadster|AMR', DB11: 'V8|V12|AMR|Volante' },
  Audi: {
    A1: AUDI + '|Technik|Competition', A3: AUDI + '|Technik|Competition', A4: AUDI + '|Technik|Competition', A5: AUDI + '|Technik|Competition', A6: AUDI + '|Technik', A7: 'SE|Sport|S line|Black Edition|Vorsprung|Edition 1',
    A8: 'SE|Sport|S line|Black Edition|Vorsprung', Q2: AUDI + '|Technik', Q3: AUDI + '|Technik', Q4: 'Sport|S line|Black Edition|Vorsprung|Edition 1|Technik', 'Q4 e-tron': 'Sport|S line|Black Edition|Vorsprung|Edition 1|Technik',
    'Q4 Sportback e-tron': 'Sport|S line|Black Edition|Vorsprung|Edition 1|Technik', Q5: AUDI + '|Technik', 'Q5 Sportback': 'Sport|S line|Black Edition|Vorsprung|Edition 1|Technik', Q7: AUDI + '|Technik',
    Q8: 'S line|Black Edition|Vorsprung|Edition 1|Technik', 'Q8 e-tron': 'Sport|S line|Black Edition|Vorsprung|Edition 1|Technik', 'e-tron': 'Sport|S line|Black Edition|Vorsprung|Edition 1|Technik|Launch Edition',
    'Q6 e-tron': 'Sport|S line|Black Edition|Vorsprung|Edition 1|Technik|Performance', TT: 'TT|Sport|S line|Black Edition|TTS|TT RS|Competition|Vorsprung',
  },
  Bentley: { Bentayga: 'V8|Azure|Speed|EWB|Hybrid|S|Mulliner', Continental: 'GT|GTC|V8|Speed|Azure|Mulliner', 'Flying Spur': 'V8|W12|Speed|Azure|Hybrid|Mulliner' },
  BMW: {
    '1 Series': 'SE|Sport|M Sport|M Sport Pro Edition|Shadow Edition|Edition|M135i', '2 Series': 'SE|Sport|M Sport|M Sport Pro Edition|Luxury|Shadow Edition|Gran Coupe|Active Tourer|Gran Tourer',
    '3 Series': 'SE|Sport|Luxury|M Sport|M Sport Pro Edition|Shadow Edition|Touring|Edition|M340i', '4 Series': 'SE|Sport|M Sport|M Sport Pro Edition|Luxury|Shadow Edition|Gran Coupe|Convertible',
    '5 Series': 'SE|Sport|Luxury|M Sport|M Sport Pro|Exclusive|Touring|Shadow Edition', '6 Series': 'SE|Sport|M Sport|Gran Turismo|Gran Coupe|Convertible',
    '7 Series': 'Sport|Exclusive|M Sport|Pure Excellence|Design Pure Excellence|Individual', '8 Series': 'Coupe|Gran Coupe|Convertible|M Sport|M Sport Pro',
    X1: 'SE|Sport|xLine|M Sport|M Sport Pro|Premium|Edition', X2: 'SE|Sport|M Sport|M Sport X|Edition', X3: BMW_SUV + '|Sport|Exclusive', X4: 'xLine|M Sport|M Sport X|M40i|Edition',
    X5: BMW_SUV + '|Exclusive|M50i', X6: 'M Sport|M Sport Pro|Edition|M50i', X7: 'xLine|M Sport|M Sport Pro|Edition|M60i',
    iX: 'xDrive40|xDrive50|M60|Sport|Sport Pro', iX1: 'xDrive30|eDrive20|xLine|M Sport|Sport', iX3: 'Premier Edition|Premier Edition Pro|M Sport|Inspiring|Impressive',
    i3: 'i3|i3s|94Ah|120Ah|Range Extender', i4: 'eDrive35|eDrive40|M50|Sport|M Sport|M Sport Pro|M Sport Pro Edition', i5: 'eDrive40|xDrive40|M60|M Sport|M Sport Pro',
    i7: 'xDrive60|M70|M Sport|Excellence', Z4: 'sDrive20i|sDrive30i|M40i|M Sport|Sport',
  },
  BYD: { 'Atto 3': 'Comfort|Design|Boost|Active|Advanced', Dolphin: 'Active|Comfort|Design|Boost|Extended Range', Seal: 'Comfort|Design|Excellence|Performance|Dynamic', 'Seal U': 'Comfort|Design|Boost|Excellence' },
  Citroen: {
    Berlingo: 'Feel|Flair|Shine|Plus|Touch|Origins|Enterprise|Driver|Worker|XTR|Business|Edition', C1: 'Touch|Feel|Flair|Shine|Edition|Furio|Urban Ride|VTR|VTR+',
    C3: 'Touch|Feel|Flair|Shine|Plus|Origins|Max|Edition|Selection|VTR|VTR+|Exclusive', 'C3 Aircross': 'Touch|Feel|Flair|Shine|Plus|Max|Edition|Origins', C4: 'Touch|Feel|Flair|Shine|Plus|Max|Edition|Business|Exclusive|VTR|Selection',
    'C4 Cactus': 'Touch|Feel|Flair|Shine|Edition|Origins|Rip Curl', C5: 'Touch|Feel|Flair|Exclusive|Business|Selection|VTR|Edition', 'C5 Aircross': 'Touch|Feel|Flair|Shine|Plus|Max|Edition|Hybrid',
    'C5 X': 'Feel|Shine|Max|Plus|Hybrid', 'e-C4': 'Feel|Flair|Shine|Plus|Max|Edition', Dispatch: 'Enterprise|Driver|Worker|Business|Edition|XL|M', Jumpy: 'Enterprise|Driver|Worker|Business|Edition|XL|M',
  },
  Cupra: {
    Born: 'V1|V2|V3|Edition|e-Boost|Dynamic', Formentor: 'V1|V2|V3|VZ1|VZ2|VZ3|Edition|e-Hybrid|VZ', Leon: 'V1|V2|V3|VZ1|VZ2|VZ3|Edition|e-Hybrid|Sportstourer|VZ', Tavascan: 'V1|V2|VZ|Endurance',
  },
  Dacia: {
    Duster: 'Essential|Comfort|Prestige|Laureate|Ambiance|Expression|Journey|Extreme|Access|Adventure', Jogger: 'Essential|Comfort|Expression|Extreme|Journey|Hybrid',
    Logan: 'Access|Ambiance|Laureate|Prestige|Essential|Comfort|Expression|SL', Sandero: 'Access|Ambiance|Laureate|Prestige|Essential|Comfort|Expression|Journey|Extreme|SL',
    'Sandero Stepway': 'Essential|Comfort|Prestige|Laureate|Ambiance|Expression|Extreme|Journey|SL', Spring: 'Essential|Comfort|Comfort Plus|Extreme|Expression',
  },
  'DS Automobiles': {
    'DS 3': 'Chic|So Chic|Performance Line|Pallas|Opera|Rivoli|E-Tense', 'DS 3 Crossback': 'Elegance|Performance Line|Prestige|Grand Chic|So Chic|La Premiere|E-Tense',
    'DS 4': 'Bastille|Performance Line|Trocadero|Rivoli|La Premiere|E-Tense|Cross', 'DS 7': 'Bastille|Performance Line|Trocadero|Rivoli|Opera|La Premiere|E-Tense|Elegance|Prestige|So Chic', 'DS 9': 'Performance Line|Rivoli|Opera|Trocadero|E-Tense',
  },
  Fiat: {
    '500': 'Pop|Lounge|Rock Star|S|Sport|Dolcevita|Collezione|Mirror|Star|Pop Star|Cult', '500X': 'Pop|Pop Star|Lounge|Cross|Cross Plus|Sport|Urban|City Cross|Connect|Club|Dolcevita|Red',
    '500e': 'Action|Passion|Icon|La Prima|Red|Pop', '500L': 'Pop|Pop Star|Lounge|Cross|Trekking|Living|Urban|Mirror', Doblo: 'Active|Dynamic|Eleganza|Lounge|Maxi|SX|Business|Pro',
    Ducato: 'Base|Maxi|Combi|Panorama|LWB|MWB', Panda: 'Pop|Easy|Lounge|Cross|City Cross|Trekking|Sport|4x4|Mirror|Active', Tipo: 'Pop|Easy|Lounge|Sport|Cross|Mirror|Life|City Life|Red',
  },
  Ford: {
    Fiesta: 'Studio|Style|Zetec|Titanium|ST-Line|ST-Line X|ST-Line Vignale|Vignale|ST|Active|Active X|Edge|Trend|Titanium X|Zetec S|Ghia|Black Edition|Connected|Edition',
    Focus: 'Studio|Style|Zetec|Titanium|ST-Line|ST-Line X|ST-Line Vignale|Titanium X|Vignale|ST|ST-3|Active|Active X|Edge|Trend|Zetec S|RS|Ghia|Connected|Edition',
    Puma: 'Titanium|ST-Line|ST-Line X|ST-Line Vignale|Titanium X|Titanium Vignale|ST|Gold Edition|Active|Vignale|Trend|Connected|Gen-E|Gen-E Premium',
    Kuga: 'Zetec|Titanium|ST-Line|ST-Line X|Titanium X|Vignale|ST-Line Edition|Titanium Edition|Active|Active X|Trend|Edge|Plug-in Hybrid|Style',
    EcoSport: 'Zetec|Titanium|ST-Line|Active|Trend|Edge|Titanium X|ST-Line Edition|Black Edition|S', Mondeo: 'Style|Zetec|Titanium|Titanium X|ST-Line|Vignale|Edge|Trend|Ghia|Hybrid',
    Mustang: 'GT|EcoBoost|Mach 1|Bullitt|V8|Convertible|Fastback|Dark Horse', 'Mustang Mach-E': 'Standard Range|Extended Range|Premium|GT|Select|AWD',
    Transit: 'Base|Leader|Trend|Limited|Sport|Trail|Kombi|Double Cab-in-Van|Van|Minibus', 'Transit Custom': 'Base|Leader|Trend|Limited|Sport|Trail|Active|MS-RT|Kombi|Double Cab-in-Van|Plug-in Hybrid|Van',
    Ranger: 'XL|XLT|Limited|Wildtrak|Raptor|Tremor|Stormtrak|Platinum|PHEV', Edge: 'Zetec|Titanium|Titanium X|ST-Line|Sport|Vignale', Explorer: 'ST-Line|Platinum|ST|Plug-in Hybrid|Limited',
    'C-Max': 'Zetec|Titanium|Titanium X|Edge|Style|Trend|Energi|Hybrid', 'S-Max': 'Zetec|Titanium|Titanium X|ST-Line|Vignale|Edge|Style|Trend|Hybrid', Galaxy: 'Zetec|Titanium|Titanium X|ST-Line|Vignale|Edge|Style|Trend|Hybrid',
  },
  Genesis: { G70: 'Luxury|Sport|Sport Line|Shooting Brake|Business', G80: 'Luxury|Sport|Sport Line|Electrified', GV70: 'Luxury|Sport|Sport Line|Electrified|Business', GV80: 'Luxury|Sport|Sport Line|Prestige|Coupe', 'Electrified GV70': 'Luxury|Sport|Sport Line' },
  Honda: {
    Civic: 'S|SE|SR|Sport|Sport Line|EX|GT|Executive|Type R|Elegance|Advance|Comfort|Lifestyle|Prestige|e:HEV', 'CR-V': 'S|SE|SR|SX|Elegance|Advance|Executive|Lifestyle|Comfort|Sport Line|EX|e:HEV|Prestige',
    Jazz: 'S|SE|SR|SX|ES|EX|Comfort|Elegance|Executive|Crosstar|Advance|e:HEV|Sport|Trend|Lifestyle', 'HR-V': 'S|SE|SR|SX|EX|Comfort|Elegance|Executive|Advance|Advance Style|Sport|e:HEV|Lifestyle',
    Accord: 'SE|ES|EX|GT|Executive|Elegance|Sport|Type S|Comfort|Lifestyle|Hybrid', e: 'Advance|Standard', 'e:Ny1': 'Elegance|Advance|Standard', Legend: 'Standard|Luxury',
  },
  Hyundai: {
    i10: HYU + '|N Line|Fresh', i20: HYU + '|Sport', i30: HYU + '|Tourer|Fastback|N', i40: 'Active|Style|Premium|Comfort|Classic|Executive|Deluxe|Blue Drive|Tourer',
    Kona: HYU + '|Electric|Hybrid|N Line S|Play', Tucson: HYU + '|Plug-in Hybrid|Hybrid|N Line S', 'Santa Fe': 'SE|Premium|Executive|Ultimate|Calligraphy|N Line|Plug-in Hybrid|Hybrid',
    'IONIQ 5': 'Executive|Premium|Ultimate|N Line|N|Standard Range|Long Range|Go|Go Plus|Evolve|Prime', 'IONIQ 6': 'Executive|Premium|Ultimate|Standard Range|Long Range|Go|Evolve|Prime',
    IONIQ: 'Premium|Premium SE|SE|Hybrid|Plug-in Hybrid|Electric|Executive|Style|Comfort|Blue Drive', Nexo: 'Standard|Premium|Executive', Staria: 'Premium|Premium Plus|Executive|Lounge|Camper|Load',
  },
  Infiniti: {
    Q30: 'SE|Sport|Premium|Premium Tech|Business Executive|Sport Tech|Urban', Q50: 'SE|Sport|Sport Tech|Premium|Premium Tech|Hybrid|Business Executive|Red Sport',
    Q60: 'Sport|Sport Tech|Premium|Red Sport|Business Executive|Pure', QX30: 'SE|Sport|Premium|Premium Tech|Business Executive|Sport Tech|Urban', QX50: 'Pure|Luxe|Sensory|Essential|Sport|Autograph', QX70: 'Premium|Sport|Sport Tech|Executive|S Design',
  },
  Jaguar: {
    'E-Pace': JLR + '|Chequered Flag|P300e|Plug-in Hybrid', 'F-Pace': JLR + '|Chequered Flag|Prestige|Portfolio|Pure|SVR|Landmark|R-Sport', 'F-Type': 'P300|P380|P450|R|R-Dynamic|Convertible|Coupe|First Edition|75|Chequered Flag|SVR',
    'I-Pace': 'S|SE|HSE|R-Dynamic|First Edition|Black|EV400', XE: JLR + '|Prestige|Portfolio|Pure|Landmark|R-Sport|Chequered Flag', XF: JLR + '|Prestige|Portfolio|Pure|Landmark|R-Sport|Sportbrake|Chequered Flag|Luxury',
    XJ: 'Portfolio|Premium Luxury|Luxury|Supersport|XJR|Autobiography|LWB',
  },
  Jeep: {
    Avenger: 'Longitude|Altitude|Summit|Limited|e-Hybrid|1st Edition|Electric', Compass: 'Longitude|Limited|Night Eagle|S|Trailhawk|Altitude|Summit|Upland|4xe|Sport|Overland|Business',
    Renegade: 'Longitude|Limited|Night Eagle|S|Trailhawk|Altitude|Summit|Upland|4xe|Sport|Overland|Business', Wrangler: 'Sport|Sahara|Rubicon|Overland|Unlimited|Willys|Sport S|Night Eagle|4xe|Altitude',
    'Grand Cherokee': 'Limited|Overland|Summit|Laredo|Trailhawk|SRT|Summit Reserve|4xe|Night Eagle|Altitude|L', Cherokee: 'Longitude|Limited|Night Eagle|Trailhawk|Sport|Overland|Altitude|Summit|Latitude',
    Gladiator: 'Overland|Rubicon|Sport|Mojave|Willys',
  },
  Kia: {
    Ceed: KIA + '|GT|ST-Line|Tourer|Sportswagon|Sport|Platinum', EV3: 'Air|Earth|GT-Line|GT-Line S|Standard Range|Long Range', EV6: 'Air|Earth|GT-Line|GT-Line S|GT|Standard Range|Long Range',
    EV9: 'Air|Earth|GT-Line|GT-Line S', Niro: KIA + '|Sport|Premium|Hybrid|Plug-in Hybrid|Electric|First Edition|Platinum|Air|Earth', Picanto: KIA + '|X-Line|X-Line S|Sport|Platinum|City',
    ProCeed: 'GT|GT-Line|GT-Line S|1|2|3|4|Edition|Business|Platinum', Sorento: KIA + '|Plug-in Hybrid|Hybrid|First Edition|KX-1|KX-2|KX-3|Platinum|Sport',
    Sportage: KIA + '|X-Line|X-Line S|Hybrid|Plug-in Hybrid|First Edition|KX-1|KX-2|KX-3|Platinum|Sport', Stinger: 'GT|GT-Line|GT-Line S|GT S|2.0|3.3 T-GDi|2.2 CRDi',
    Stonic: KIA + '|First Edition|Sport|Platinum|Hybrid', Xceed: KIA + '|First Edition|Sport|Platinum|Plug-in Hybrid',
  },
  'Land Rover': {
    Defender: 'S|SE|HSE|X-Dynamic S|X-Dynamic SE|X-Dynamic HSE|X|V8|Hard Top|Commercial|75th Limited Edition|First Edition|Country Pack|Explorer Pack|Octa',
    Discovery: JLR + '|HSE Luxury|Landmark|Metropolitan Edition|Commercial|Graphite', 'Discovery Sport': JLR + '|Landmark|Pure|Metropolitan Edition|Commercial|Dynamic S|Dynamic SE|Dynamic HSE',
    Freelander: 'S|SE|HSE|XS|GS|TD4|SD4|Sport|Adventurer|Freestyle|Graphite', 'Range Rover': 'SE|HSE|Vogue|Vogue SE|Autobiography|SV|First Edition|Westminster|Fifty|LWB|Dynamic SE|Dynamic HSE|PHEV',
    'Range Rover Evoque': JLR + '|Pure|Prestige|Dynamic|Landmark|Urban Edition|Plug-in Hybrid|Convertible', 'Range Rover Sport': JLR + '|HST|Dynamic SE|Dynamic HSE|SVR|Stealth|Plug-in Hybrid|Westminster|SV',
    'Range Rover Velar': JLR + '|Dynamic SE|Dynamic HSE|Plug-in Hybrid',
  },
  Lexus: { CT: LEXUS + '|Advance|Business', IS: LEXUS + '|Business|Pro', NX: LEXUS + '|Business|Pro|Plug-in Hybrid|Overtrail', RX: LEXUS + '|Business|Pro|Plug-in Hybrid', UX: LEXUS + '|Business|Pro|Electric', LC: 'Sport|Sport+|Luxury|Limited Edition|Convertible|500|500h', LS: 'Luxury|Premier|F Sport|Hybrid|500h|Takumi', LX: 'Luxury|Premier|F Sport|Ultra Luxury|Sport' },
  Mazda: { 'CX-3': 'SE-L|SE-L Nav|SE-L Lux|Sport Nav|GT Sport|Exclusive|Executive|Platinum|Takumi|Sport Black|Black Edition', 'CX-30': MAZ, 'CX-5': MAZ + '|Roam|Sport Black', 'CX-60': 'Exclusive-Line|Homura|Takumi|Prime-Line|Centre-Line|Plug-in Hybrid|Newground', Mazda2: MAZ + '|Hybrid', Mazda3: MAZ + '|Fastback|Saloon|Skyactiv-X', Mazda6: MAZ + '|Saloon|Tourer', 'MX-5': MAZ + '|RF|Roadster|Sport Tech', 'MX-30': 'SE-L|SE-L Lux|Sport Lux|GT Sport|Exclusive-Line|Makoto|Industrial Vintage|Homura|Takumi|R-EV' },
  'Mercedes-Benz': {
    'A-Class': MB + '|A 35|A 45', 'B-Class': MB, 'C-Class': MB + '|Avantgarde|C 43|C 63|Estate|Coupe|Cabriolet', CLA: 'Sport|AMG Line|AMG Line Premium|AMG Line Premium Plus|Night Edition|Edition|Shooting Brake|CLA 35|CLA 45',
    CLS: 'AMG Line|AMG Line Premium|AMG Line Premium Plus|Sport|Night Edition|Premium|Premium Plus|CLS 53', 'E-Class': MB + '|Avantgarde|E 53|E 63|Estate|Coupe|Cabriolet|All-Terrain',
    EQA: 'Sport|AMG Line|AMG Line Premium|AMG Line Premium Plus|Exclusive|Progressive|Edition', EQB: 'Sport|AMG Line|AMG Line Premium|AMG Line Premium Plus|Exclusive|Progressive|Edition',
    EQC: 'Sport|AMG Line|AMG Line Premium|AMG Line Premium Plus|Exclusive|Edition 1886', EQE: 'Sport|AMG Line|AMG Line Premium|AMG Line Premium Plus|Exclusive|350|500|43 AMG|53 AMG',
    EQS: 'Sport|AMG Line|AMG Line Premium|AMG Line Premium Plus|Exclusive|450+|580|53 AMG', 'G-Class': 'G 350|G 400|G 500|G 63|AMG Line|Night Edition|Professional|G 580',
    GLA: MB + '|GLA 35|GLA 45', GLB: MB + '|GLB 35', GLC: MB + '|GLC 43|GLC 63|Coupe|Plug-in Hybrid', GLE: MB + '|GLE 53|GLE 63|Coupe|Plug-in Hybrid', GLS: 'AMG Line|AMG Line Premium|AMG Line Premium Plus|Exclusive|Night Edition|Premium|Premium Plus|GLS 63|Maybach',
    ML: 'SE|Sport|AMG Sport|Grand Edition|ML 250|ML 350|ML 63|BlueEfficiency', 'S-Class': 'AMG Line|AMG Line Premium|AMG Line Premium Plus|Exclusive|Premium|Premium Plus|L|Plug-in Hybrid|S 500|S 580|S 63|Maybach',
    SL: 'SL 55|SL 63|SL 43|AMG Line|Roadster|SL 400|SL 500', SLC: 'AMG Line|AMG Line Premium|AMG Line Premium Plus|Premium|Premium Plus|Sport|SLC 43|Final Edition',
    Sprinter: 'Standard|Premium|Pro|Select|Panel Van|Tipper|Dropside|Crew Cab|Minibus|Camper', 'V-Class': 'Sport|AMG Line|AMG Line Premium|Exclusive|Avantgarde|Grand Edition|Premium|EQV',
  },
  MG: {
    MG3: 'Excite|Exclusive|Trophy|Style|Hybrid+|SE|Core', MG4: 'SE|SE Long Range|Trophy|Trophy Long Range|XPOWER|Excite|Standard Range|Long Range|Essence', MG5: 'Excite|Exclusive|SE|Trophy|Long Range|Standard Range|Estate',
    'MG ZS': 'Excite|Exclusive|Trophy|SE|Core|Hybrid+|Long Range|Standard Range|Essence', 'ZS EV': 'Excite|Exclusive|Trophy|Long Range|Standard Range|Essence|SE',
  },
  Mini: {
    Cooper: 'Classic|Sport|Exclusive|Favoured|Level 1|Level 2|Level 3|Cooper S|Cooper SE|John Cooper Works|Resolute|Electric|Essential|Premium|Premium Plus|Untamed', Countryman: 'Classic|Sport|Exclusive|Cooper S|Cooper SE|Cooper D|Cooper SD|John Cooper Works|Essential|Premium|Premium Plus|ALL4|Plug-in Hybrid|Electric',
    Clubman: 'Classic|Sport|Exclusive|Cooper S|Cooper D|Cooper SD|John Cooper Works|Essential|Premium|Premium Plus|ALL4', Convertible: 'Classic|Sport|Exclusive|Cooper S|Cooper SD|John Cooper Works|Essential|Premium|Premium Plus',
    Paceman: 'Cooper|Cooper S|Cooper D|Cooper SD|John Cooper Works|ALL4', Roadster: 'Cooper|Cooper S|Cooper SD|John Cooper Works',
  },
  Mitsubishi: {
    ASX: '2|3|4|Instyle|Intense|Invite|Black Edition|Diamond|Edition|Hybrid|Exceed', 'Eclipse Cross': '2|3|4|5|Instyle|Intense|Invite|Black Edition|Diamond|Edition|Exceed|Plug-in Hybrid|PHEV|Design|Dynamic|Verve',
    L200: 'Barbarian|Barbarian X|Warrior|Trojan|Titan|Series 5|Series 6|4Life|4Work|Double Cab|Club Cab|Single Cab|Challenger|Animal', Outlander: '2|3|4|5|Instyle|Intense|Invite|Black Edition|Diamond|Edition|Exceed|Plug-in Hybrid|PHEV|Design|Dynamic|Verve|GX3h|GX4h|GX5h',
    'Outlander PHEV': 'Instyle|Intense|Invite|Black Edition|Diamond|Edition|Exceed|Design|Dynamic|Verve|GX3h|GX4h|GX5h|2|3|4|5',
  },
  Nissan: {
    Juke: 'Visia|Acenta|Acenta Premium|Tekna|N-Connecta|N-Design|Premiere Edition|Shiro|Business|Bose Personal Edition|Hybrid|Enigma|Tekna+', Leaf: 'Visia|Visia Plus|Acenta|Tekna|N-Connecta|N-Tec|e+|40kWh|62kWh|3.ZERO|Shiro|e+ Tekna|e+ N-Connecta',
    Micra: 'Visia|Visia+|Acenta|Tekna|N-Connecta|N-Sport|Bose Personal Edition|Business|Shiro|Enigma|Premiere Edition|N-Design|IG-T', Navara: 'Visia|Acenta|Acenta+|Tekna|N-Guard|N-Connecta|N-Trek|Tekna+|Double Cab|King Cab|Single Cab|Platinum|Pro-4X|Trek-1|Outlaw',
    Note: 'Visia|Acenta|Acenta Premium|Tekna|N-Connecta|N-Tec|Business|Bose Personal Edition|Shiro|Enigma|Premiere Edition|N-Design|e-Power', Qashqai: 'Visia|Visia+|Acenta|Acenta+|Acenta Premium|Tekna|Tekna+|N-Connecta|N-Tec|N-Vision|N-Design|Premiere Edition|Business|Shiro|Enigma|Hybrid|e-Power|Platinum|Premium',
    'X-Trail': 'Visia|Visia+|Acenta|Acenta+|Acenta Premium|Tekna|Tekna+|N-Connecta|N-Tec|N-Vision|N-Design|Premiere Edition|Business|Shiro|Hybrid|e-Power|e-4ORCE|Platinum|Premium|7 Seater|5 Seater', Ariya: 'Advance|Evolve|Evolve+|Premiere|Engage|Venture|Platinum|Boost|Performance|e-4ORCE|63kWh|87kWh',
    Pathfinder: 'S|SV|SL|Platinum|Tekna|Visia|Acenta|N-Connecta|N-Trek|Premium|Business|Rock Creek|7 Seater',
  },
  Opel: {
    Astra: OPEL + '|Sports Tourer|GSe|Hybrid|VXR|Sport|Excite|Exclusiv|Energy|Limited Edition|Club|Active|SC', Corsa: OPEL + '|GSe|Hybrid|VXR|Sport|Excite|Exclusiv|Energy|Limited Edition|Club|Active|SC|Corsa-e|Rocks-e', Crossland: OPEL + '|Excite|Tech Line|Selection|Innovation|Cosmo|Active|Sport|Energy|Limited Edition',
    Grandland: OPEL + '|Hybrid|Plug-in Hybrid|Hybrid4|GSe|Excite|Tech Line|Selection|Innovation|Cosmo|Active|Sport|Energy', Insignia: OPEL + '|Tourer|Sports Tourer|Grand Sport|Country Tourer|GSi|VXR|Sport|Exclusiv|Energy|Limited Edition|Club|Active|SC|Innovation|Brougham',
    Mokka: OPEL + '|e|Mokka-e|Excite|Tech Line|Selection|Cosmo|Active|Sport|Energy', 'Mokka-e': OPEL + '|e|Excite|Tech Line|Selection|Cosmo|Active|Sport|Energy', Vivaro: 'Edition|Dynamic|Sportive|Prime|Elite|Business|Combi|Crew Van|Panel Van|L1H1|L2H1|L2H2|L3H1|L3H2|Life|Cargo|Electric|e-Vivaro|Pro',
    Zafira: 'Expression|SC|SE|SRi|Elite|Ultimate|Design|Business|Sport|Excite|Exclusiv|Energy|Limited Edition|Club|Active|Elegance|Tourer|Life|Tech Line|Selection|Cosmo', Meriva: 'Expression|SC|SE|SRi|Elite|Design|Business|Sport|Excite|Exclusiv|Energy|Limited Edition|Club|Active|Enjoy|Cosmo|Essentia|Merit|Start',
    Adam: 'Jam|Glam|Slam|Rocks|Rocks S|S|Unlimited|Black Edition|White Edition|Grand Slam|Limited Edition|Energy', Cascada: 'Elite|SE|SRi|Limited Edition|Elite Nav|SE Nav|SRi Nav|Excite|Exclusiv|Sport|Turbo|Bi-Turbo|Supreme|Griffin',
    Agila: 'Expression|Club|Design|Enjoy|Active|Elegance|Edition|Cosmo|Comfort|Essentia|Merit|Start|S|SE|SC|SRi',
  },
  Peugeot: {
    '107': 'Access|Active|Allure|Collection|Feline|GT Line|Roland Garros|Top!|Urban|Black Edition|Envy|XR|X-Line', '108': 'Access|Active|Allure|Collection|Feline|GT Line|Roland Garros|Top!|Urban|Black Edition|Selection|Envy|Exclusive',
    '208': PSA + '|Roland Garros|Signature|Tech Edition|Allure Premium+|GT Premium+|e-208|Electric|Bluelion|Pure Tech|BlueHDi', '2008': PSA + '|Roland Garros|Signature|Tech Edition|Allure Premium+|GT Premium+|e-2008|Electric|Pure Tech|BlueHDi|Crossway',
    '3008': PSA + '|Allure Premium+|GT Premium+|Hybrid|Hybrid4|Plug-in Hybrid|GT Pack|Crossway|Elegance|Executive', '308': PSA + '|SW|Estate|Plug-in Hybrid|GTi|e-308|Elegance|Executive|Allure Pack', '408': 'Allure|Allure Premium|GT|GT Premium|Hybrid|Plug-in Hybrid|Electric',
    '508': PSA + '|SW|Estate|Hybrid|Plug-in Hybrid|PSE|Fastback|Elegance|Executive', '5008': PSA + '|Hybrid|GT Pack|Elegance|Executive|7 Seater', '4008': 'Access|Active|Allure|GT|GT Line|Premium|Style|Like|Feline|Edition|Business|Hybrid|Plug-in Hybrid',
    'e-208': 'Active|Allure|Allure Premium|GT|GT Line|GT Premium|Style|Roland Garros', 'e-2008': 'Active|Allure|Allure Premium|GT|GT Line|GT Premium|Style|Roland Garros|Crossway', Expert: 'Standard|Compact|Long|Professional|Asphalt|Premium|Pro|Combi|Traveller|Panel Van|Electric|e-Expert',
    Partner: 'Professional|Ride|Grip|Asphalt|Pro|Standard|Long|Panel Van|Crew Van|Combi|Tepee|Outdoor|Electric|e-Partner|L1|L2', Rifter: 'Active|Allure|GT|GT Line|Standard|Long|Style|Like|Premium|Mixto|Electric|e-Rifter',
  },
  Polestar: { 'Polestar 2': 'Standard Range Single Motor|Long Range Single Motor|Long Range Dual Motor|Performance|Plus|Pilot|Launch Edition|BST Edition 270', 'Polestar 3': 'Long Range Dual Motor|Plus|Pilot|Launch Edition|Performance', 'Polestar 4': 'Long Range Single Motor|Long Range Dual Motor|Plus|Pilot|Launch Edition|Performance' },
  Porsche: {
    '718': 'Boxster|Cayman|Boxster S|Cayman S|Boxster GTS|Cayman GTS|Spyder|GT4|GT4 RS|T|Style Edition', '911': 'Carrera|Carrera S|Carrera 4|Carrera 4S|Carrera GTS|Targa 4|Targa 4S|Turbo|Turbo S|GT3|GT3 RS|GT3 Touring|T|Cabriolet|Coupe|Sport Classic|Dakar|GT2 RS',
    Cayenne: 'Base|S|GTS|Turbo|Turbo S E-Hybrid|E-Hybrid|Platinum Edition|Coupe|Diesel|Turbo GT', 'Cayenne Coupé': 'Base|S|GTS|Turbo|Turbo S E-Hybrid|E-Hybrid|Platinum Edition|Diesel|Turbo GT', Macan: 'Base|S|GTS|Turbo|T|Electric|4|Diesel|S Diesel|Platinum Edition|Turbo Electric|4S',
    Panamera: 'Base|4|4S|GTS|Turbo|Turbo S|E-Hybrid|4 E-Hybrid|4S E-Hybrid|Turbo S E-Hybrid|Platinum Edition|Sport Turismo|Executive|Diesel', Taycan: 'Base|4|4S|GTS|Turbo|Turbo S|Cross Turismo|Sport Turismo|Performance Battery|Performance Battery Plus|Turbo GT',
  },
  Renault: {
    Arkana: 'Evolution|Techno|Esprit Alpine|R.S. Line|Iconic|Intens|E-Tech|Hybrid|Equilibre|Edition One', Austral: 'Evolution|Techno|Esprit Alpine|Iconic|Equilibre|Edition One|E-Tech|Hybrid', Captur: REN + '|E-Tech|Plug-in Hybrid|Extreme|S Edition|Zen|Initiale Paris|Bose Edition',
    Clio: REN + '|E-Tech|Zen|Sport|RS|Renaultsport|Trophy|Cup|Sport Tourer|Grand Tour|Hybrid|S Edition|Bose Edition|Initiale Paris', Espace: 'Evolution|Techno|Esprit Alpine|Iconic|Equilibre|Edition One|E-Tech|Hybrid|Intens|Initiale Paris|Zen|Dynamique|Signature|Expression|Play',
    Kadjar: REN + '|Zen|Bose Edition|Initiale Paris|S Edition|Extreme', Kangoo: 'Business|Business+|Sport|Extra|Extra+|Advance|Techno|Evolution|Maxi|Combi|Van|Crew Van|Panel Van|E-Tech Electric|Electric|Z.E.|Expression|Dynamique|Authentique|Privilege',
    Megane: REN + '|E-Tech|Plug-in Hybrid|Zen|Sport|RS|Trophy|Cup|Grand Tour|Sport Tourer|Coupe|Coupe-Cabriolet|GT|Bose Edition|Initiale Paris|S Edition', 'Megane E-Tech': 'Evolution|Techno|Iconic|Equilibre|Esprit Alpine|Launch Edition|Comfort Range|Extended Range|EV40|EV60',
    Scenic: REN + '|E-Tech|Zen|Grand Scenic|Sport|Initiale Paris|Bose Edition|S Edition|7 Seater|5 Seater', Trafic: 'Business|Business+|Sport|Extra|Advance|Techno|Evolution|Combi|Van|Crew Van|Panel Van|Passenger|Sport Line|Formula Edition|Life|SL27|SL28|SL29|LL29|LL30|LL31',
    Twingo: 'Play|Expression|Dynamique|Signature|Iconic|Techno|Evolution|S Edition|Electric|Intens|Zen|Equilibre|Gordini|Gordini 130|RS|Renaultsport|Cup|Rip Curl|Night & Day|Collection|Vibes', Zoe: 'Play|Expression|Dynamique|Signature|Iconic|Techno|Evolution|Intens|Zen|Life|Life R90|Life R110|Zen R90|Zen R110|Intens R110|Iconic R135|Z.E. 40|Z.E. 50|R110|R135|R90',
  },
  SEAT: {
    Arona: SEAT + '|FR Edition|Black Edition|Beats|TGI|TSI', Ateca: SEAT + '|FR Edition|Black Edition|Cupra|4Drive', Ibiza: SEAT + '|S|Toca|Connect|Copa|Cupra|ST|Sport Tourer|Sportcoupe|Black Edition|Beats|SE Dynamic', Leon: SEAT + '|S|Cupra|Cupra 280|Cupra 290|Cupra 300|Cupra 310|ST|Sportstourer|X-Perience|e-Hybrid|eTSI|TGI|Black Edition|Beats',
    Mii: 'S|SE|FR Line|Toca|Mango|By Cosmopolitan|By Mango|Chic|I-Tech|SE Design|Design|Electric|Sport|Edition', Tarraco: SEAT + '|e-Hybrid|Plug-in Hybrid|7 Seater|5 Seater|4Drive', Toledo: 'S|SE|SE Technology|FR|Style|Reference|Move|SX|SXL|Stylance|Signo|Sport',
  },
  Skoda: {
    Citigo: 'S|SE|SE Technology|Monte Carlo|Colour Edition|Greentech|Active|Ambition|Style|Elegance|SE L|E-iV|Electric', Enyaq: 'iV 60|iV 80|iV 80x|iV RS|Sportline|Sportline Plus|Loft|Suite|Lodge|Founders Edition|First Edition|Laurin & Klement|Selection|Coupe|85|85x|RS|60|80',
    'Enyaq Coupé': 'iV 60|iV 80|iV 80x|iV RS|Sportline|Sportline Plus|First Edition|Laurin & Klement|85|85x|RS|60|80', Fabia: SKO + '|Colour Edition|Greentech|Estate|Combi|Scout|Classic|Comfort|Family|Joy|Fresh|Fair|Cool Edition|Ambiente|Greenline|Tech Edition', Kamiq: SKO + '|Colour Edition|Greentech|Scout|Design|Suite|Loft|Lodge',
    Karoq: SKO + '|Scout|Sportline Plus|SE L Executive|4x4|Design|Business', Kodiaq: SKO + '|Scout|Sportline Plus|SE L Executive|4x4|iV|Plug-in Hybrid|7 Seater|5 Seater', Octavia: SKO + '|Estate|Combi|Scout|Greentech|iV|Plug-in Hybrid|G-Tec|TGI|Greenline|Business|Colour Edition',
    Rapid: SKO + '|Spaceback|Colour Edition|Greentech|Greenline|Fresh|Fair|Cool Edition', Scala: SKO + '|Colour Edition|Greentech|G-Tec|TGI|Suite|Loft|Lodge|Business', Superb: SKO + '|Estate|Combi|Scout|iV|Plug-in Hybrid|SE L Executive|Business|Greenline|Suite|Loft|Lodge',
  },
  Smart: { ForTwo: 'Passion|Prime|Pure|Proxy|Edition|Brabus|Cabrio|Coupe|EQ|Electric Drive|Urban|Style|Pulse|Black Edition|Flashlight|Greenflash|Grandstyle', ForFour: 'Passion|Prime|Pure|Proxy|Edition|Brabus|EQ|Electric Drive|Urban|Style|Pulse|Black Edition|Flashlight|Greenflash|Grandstyle', 'EQ fortwo': 'Passion|Prime|Pure|Proxy|Edition|Brabus|Cabrio|Coupe|Urban|Style|Pulse|Black Edition|Flashlight|Greenflash|Grandstyle' },
  Subaru: {
    Forester: 'XE|XE Premium|XT|X|S|SE|SE Premium|Sport|Premium|Touring|Limited|Wilderness|e-Boxer|Hybrid|2.0i|2.5i|2.0D|XC|XS|Lineartronic', Impreza: 'XE|XE Premium|XT|X|S|SE|SE Premium|Sport|Premium|Touring|Limited|2.0i|1.6i|WRX|WRX STI|STI|RS|RX|XV|Crosstrek|Outback Sport',
    Legacy: 'XE|XE Premium|XT|X|S|SE|SE Premium|Sport|Premium|Touring|Limited|2.0i|2.5i|3.0R|2.0D|Wagon|Estate|Saloon|Outback|GT|Spec B|Tourer', Outback: 'XE|XE Premium|XT|X|S|SE|SE Premium|Sport|Premium|Touring|Limited|Wilderness|2.0i|2.5i|3.0R|2.0D|Onyx Edition',
    XV: 'XE|XE Premium|XT|X|S|SE|SE Premium|Sport|Premium|Touring|Limited|2.0i|1.6i|e-Boxer|Hybrid|Crosstrek',
  },
  Suzuki: {
    Alto: 'SZ|SZ2|SZ3|SZ4|SZ5|SZ-T|GL|GLX|VX|VXR|VXL|XL', Baleno: 'SZ3|SZ4|SZ5|SZ-T|Boosterjet|Dualjet|Mild Hybrid|Hybrid|Motion|Ultra', Celerio: 'SZ2|SZ3|SZ4|SZ5|SZ-T|GL|GLX|Motion|Ultra', Ignis: 'SZ3|SZ4|SZ5|SZ-T|Dualjet|Mild Hybrid|Hybrid|Motion|Ultra|Allgrip',
    Jimny: 'SZ4|SZ5|SZ-T|SZ3|Allgrip|Pro|Commercial|JLX|JLX+|Sierra|Lite|1.3 VVT|1.5 Allgrip', 'S-Cross': 'SZ3|SZ4|SZ5|SZ-T|Boosterjet|Dualjet|Mild Hybrid|Hybrid|Allgrip|Motion|Ultra|Full Hybrid|Strong Hybrid',
    Swift: 'SZ2|SZ3|SZ4|SZ5|SZ-T|SZ-L|Boosterjet|Dualjet|Mild Hybrid|Hybrid|Sport|GL|GLX|Attitude|Motion|Ultra|1.2 Dualjet|1.0 Boosterjet|1.4 Boosterjet', Vitara: 'SZ3|SZ4|SZ5|SZ-T|SZ-L|Boosterjet|Dualjet|Mild Hybrid|Hybrid|Allgrip|Sport|GL|GLX|Motion|Ultra|Full Hybrid|Strong Hybrid|Grand Vitara|JLX',
  },
  Tesla: {
    'Model 3': 'Standard Range|Standard Range Plus|Long Range|Performance|Rear-Wheel Drive|Long Range AWD|Highland', 'Model S': '60|75|85|90|100D|75D|90D|P85D|P90D|P100D|Long Range|Plaid|Performance|Dual Motor',
    'Model X': '60D|75D|90D|100D|P90D|P100D|Long Range|Plaid|Performance|Dual Motor|7 Seater|6 Seater|5 Seater', 'Model Y': 'Standard Range|Long Range|Performance|Rear-Wheel Drive|Long Range AWD|7 Seater|5 Seater|Juniper|Launch Series', Cybertruck: 'AWD|Cyberbeast|Rear-Wheel Drive|Foundation Series',
  },
  Toyota: {
    Yaris: TOY + '|Strata|Active|Style|Sport|Cool|Bi-Tone|Hybrid|GR|Premiere Edition|Icon Tech|Executive|Lounge', Corolla: TOY + '|Luna Sport|Strata|Active|Style|Sport|Trek|Premium|Touring Sports|Hybrid|Executive|Lounge', 'C-HR': TOY + '|Orange Edition|Lounge|Bi-Tone|Sport|Premium|Active|Style|Hybrid|Plug-in Hybrid',
    RAV4: TOY + '|Adventure|Style|Active|Plug-in|Hybrid|Premium|Lounge|Invincible', Aygo: 'Pure|Pop|X-Play|X-Pure|X-Trend|X-Clusiv|X-Cite|X-Style|Fire|Ice|Edge|Limited|X|X-Wave|X-Press', Avensis: 'Terra|Strata|Luna|Sol|Aura|Icon|Business Edition|T2|T3|T4|T Spirit|Executive|Active|Premium',
    Auris: 'Terra|Strata|Luna|Sol|Aura|Icon|Sport|Excel|Design|Active|Style|Hybrid|Touring Sports|Business Edition|Premium|T Spirit|T2|T3|T4|Executive', Prius: 'Active|Business Edition|Excel|Design|Luna|Sol|T3|T Spirit|Icon|Plug-in|Prime|Dynamic|Lounge|Executive|Premium',
    'Land Cruiser': 'Active|Invincible|Icon|Utility|Pro|LC4|LC3|LC2|Executive|Double Cab|Lounge|Sol|Luna|Commercial|GX|GXL|VX|VX-R|Sahara|GR Sport|First Edition', Hilux: 'Active|Icon|Invincible|Invincible X|Professional|GR Sport|Double Cab|Extra Cab|Single Cab|Black Edition|Luna|Sol|Utility|Arctic|Trail|Highlander|SR|SR5|Rogue|Workmate',
    Proace: 'Active|Comfort|Icon|Business|Professional|Shuttle|Verso|City|Luxury|Compact|Medium|Long|Worker|Panel Van|Crew Van|Combi|Electric|L1|L2|L3', Verso: 'Terra|Strata|Luna|Sol|Aura|Icon|Active|Sport|T2|T3|T4|T Spirit|Excel|Business Edition|7 Seater|5 Seater',
    Camry: 'Luna|Sol|Icon|Excel|Design|Executive|Premium|Hybrid|SE|XSE|LE|XLE|TRD', 'Corolla Cross': 'Luna|Sol|Icon|Excel|Design|Premium|GR Sport|Hybrid', 'Yaris Cross': 'Luna|Sol|Icon|Excel|Design|Premiere|Premiere Edition|GR Sport|Adventure|Elegant|Bi-Tone',
    bZ4X: 'Luna|Sol|Premium|Pure|Motion|Luxury', 'Aygo X': 'Pure|Edge|Limited|Undercover|Pulse|Air Edition|Hybrid', 'C-HR+': 'Luna|Sol|Premium|Icon|Excel|Design|Premiere|GR Sport', 'Urban Cruiser': 'Luna|Sol|Icon|Excel|Design|Premium|Hybrid', GT86: 'Standard|Pro|Aero|Aero Pack|Orange Edition|Club Series|Blaze Edition|TRD',
    GR86: 'Standard|Pro|Aero|Premium|Base|TRD', 'GR Yaris': 'Circuit|Circuit Pack|Standard|RZ|RZ High Performance|Core|GRMN', Supra: 'Pro|Legend|Fuji Speedway Edition|Premium|Base|3.0|2.0',
  },
  Vauxhall: {
    Astra: OPEL + '|Sports Tourer|GSe|Hybrid|VXR|Sport|Excite|Exclusiv|Energy|Limited Edition|Club|Active|SC', Corsa: OPEL + '|GSe|Hybrid|VXR|Sport|Excite|Exclusiv|Energy|Limited Edition|Club|Active|SC|Corsa-e', Crossland: OPEL + '|Excite|Tech Line|Selection|Innovation|Cosmo|Active|Sport|Energy|Limited Edition',
    Grandland: OPEL + '|Hybrid|Plug-in Hybrid|Hybrid4|GSe|Excite|Tech Line|Selection|Innovation|Cosmo|Active|Sport|Energy', Insignia: OPEL + '|Tourer|Sports Tourer|Grand Sport|Country Tourer|GSi|VXR|Sport|Exclusiv|Energy|Limited Edition|Club|Active|SC|Innovation|Brougham', Mokka: OPEL + '|e|Mokka-e|Excite|Tech Line|Selection|Cosmo|Active|Sport|Energy',
  },
  Volkswagen: {
    'ID.4': 'Life|Style|Business|Family|Pro|Pro Max|Max|GTX|1st Edition|Pro Style|Pro Plus|Life Dx|Pro Performance', 'ID.3': 'Life|Style|Business|Family|Pro|Pro Max|Pro Performance|Pro S|GTX|1st|Max|Match|Pro Plus', 'ID.5': 'Style|Pro|Pro Max|GTX|Max|Pro Performance|Pro Plus',
    'ID.7': 'Pro|Pro Match|Pro S|Style|Tourer|GTX|Pro Plus', Golf: VW + '|GTI|GTD|GTE|R|Highline|Comfortline|Trendline|Bluemotion|Match Edition|Move|Active|Edition|GT|Alltrack|e-Golf|Sportsvan|Clubsport|Design', 'Golf Variant': VW + '|Highline|Comfortline|Trendline|Bluemotion|Match Edition|Move|Active|Edition|GT|Alltrack|Estate',
    Polo: VW + '|GTI|Beats|Sport|Comfortline|Trendline|Highline|Bluemotion|Match Edition|Move|Edition|Active|Design|Cross|BlueGT', Passat: 'SE|SE Business|SEL|GT|R-Line|Comfortline|Highline|Trendline|Business|Elegance|Life|Alltrack|GTE|Estate|Saloon|Variant|Executive|Bluemotion',
    Tiguan: VW + '|R|Elegance|Comfortline|Highline|Trendline|Allspace|Active|Escape|Track & Field|Track & Style|Sport & Style|eHybrid|Plug-in Hybrid|4Motion', 'T-Roc': VW + '|R|Design|Active|Edition|Cabriolet|4Motion', 'T-Cross': VW + '|Edition|Active|Design',
    Touareg: 'SE|SEL|R-Line|Black Edition|Elegance|Atmosphere|V6|Edition|Executive|R|eHybrid|Plug-in Hybrid|V8|V10|Exclusive|Terrain Tech|Escape', Touran: 'S|SE|SE Family|Match|Life|Trendline|Comfortline|Highline|R-Line|Bluemotion|Style|Edition|7 Seater|5 Seater|Cross Touran',
    Arteon: 'Elegance|R-Line|Shooting Brake|SEL|GT|Edition|R|SE|Black Edition|eHybrid|Plug-in Hybrid', Caddy: 'Startline|Trendline|Comfortline|Highline|Life|Style|Maxi|Maxi Life|Maxi Style|Cargo|Commerce|Commerce Pro|California|Kombi|Panel Van|Van|C20|C20 Plus|Business|Sportline|Black Edition|Beach|Alltrack|Cross|e-Caddy|Electric',
    California: 'Beach|Ocean|Coast|Beach Tour|Beach Camper|Ocean Edition|Coast Edition|T5|T6|T6.1', Caravelle: 'Trendline|Comfortline|Highline|Executive|SE|SEL|Startline|Edition|Black Edition|T5|T6|T6.1|LWB|SWB|9 Seater|8 Seater|7 Seater|Generation Six', Crafter: 'Startline|Trendline|Highline|Business|SWB|LWB|MWB|Panel Van|Van|Kombi|Crew Cab|Dropside|Tipper|Luton|Chassis Cab|CR28|CR30|CR32|CR35|CR50|e-Crafter|Electric',
    Sharan: 'S|SE|SEL|Match|R-Line|Trendline|Comfortline|Highline|Edition|Bluemotion|7 Seater|5 Seater', Scirocco: 'GT|R-Line|R|GTS|Bluemotion|S|Edition|Cup|Mayfair', Transporter: 'Startline|Trendline|Highline|Kombi|Shuttle|Sportline|Caravelle|Panel Van|Limited|Black Edition|Business|Edition|T5|T6|T6.1|SWB|LWB|Crew Van|Tipper|Dropside|T28|T30|T32',
    Amarok: 'Life|Style|PanAmericana|Aventura|Highline|Trendline|Comfortline|Dark Label|Canyon|Extreme|Sportline|V6|Edition|Startline|Black Edition|Double Cab|Single Cab', 'Up!': 'Take Up!|Move Up!|High Up!|Club Up!|Black Up!|White Up!|Beats|GTI|e-Up!|Cross Up!|Rock Up!|Style Up!|Life Up!|Edition|Eco Up!|Groove Up!',
  },
  Volvo: {
    C40: 'Core|Plus|Ultimate|Pure Electric|Recharge|Twin|Single|Single Motor|Twin Motor|Extended Range|Standard Range', EX30: 'Core|Plus|Ultra|Single Motor|Twin Motor|Twin Motor Performance|Extended Range|Standard Range|Cross Country', EX40: 'Core|Plus|Ultimate|Single Motor|Twin Motor|Extended Range|Standard Range|Ultra',
    EX90: 'Core|Plus|Ultra|Twin Motor|Twin Motor Performance|Single Motor|7 Seater|6 Seater', S60: VOLVO + '|Polestar Engineered|T8|T6|T5|D4|B4|B5|Cross Country|Plug-in Hybrid|Mild Hybrid', S90: VOLVO + '|Polestar Engineered|T8|T6|T5|D5|D4|B5|B6|Plug-in Hybrid|Mild Hybrid|Excellence|LWB',
    V40: 'Core|Plus|Momentum|Inscription|R-Design|Cross Country|SE|SE Lux|SE Nav|SE Lux Nav|ES|ES Lux|R-Design Lux|T2|T3|T4|T5|D2|D3|D4|Business Edition|Classic|Kinetic|Summum|Excite', V60: VOLVO + '|Polestar Engineered|Cross Country|T8|T6|T5|D5|D4|D3|B4|B5|Plug-in Hybrid|Mild Hybrid|SE|SE Lux|ES|R-Design Lux|Business Edition',
    V90: VOLVO + '|Polestar Engineered|Cross Country|T8|T6|T5|D5|D4|B5|B6|Plug-in Hybrid|Mild Hybrid|SE|SE Lux|ES|R-Design Lux|Business Edition', XC40: VOLVO + '|Polestar Engineered|Pure Electric|Single Motor|Twin Motor|Extended Range|T5|T4|T3|D4|D3|B3|B4|B5|Plug-in Hybrid|Mild Hybrid|SE|SE Lux|ES|R-Design Lux|Business Edition|First Edition|Cross Country',
    XC60: VOLVO + '|Polestar Engineered|T8|T6|T5|D5|D4|D3|B4|B5|B6|Plug-in Hybrid|Mild Hybrid|SE|SE Lux|ES|R-Design Lux|Business Edition|First Edition|Cross Country', XC90: VOLVO + '|Polestar Engineered|T8|T6|T5|D5|D4|B5|B6|Plug-in Hybrid|Mild Hybrid|SE|SE Lux|ES|R-Design Lux|Business Edition|First Edition|Excellence|7 Seater|5 Seater',
  },
  Isuzu: { 'D-Max': 'Utility|Eiger|DL20|DL40|V-Cross|Arctic Trucks|Blade|Double Cab|Extended Cab|Single Cab', 'Mu-X': 'Utility|DL20|DL40|Blade|Arctic Trucks|V-Cross', Trooper: 'Duty|Citation|Equippe|SWB|LWB' },
  INEOS: { Grenadier: 'Utility Wagon|Station Wagon|Fieldmaster Edition|Trialmaster Edition|Black Edition', 'Grenadier Quartermaster': 'Utility|Fieldmaster Edition|Trialmaster Edition' },
  KGM: { Korando: 'ELX|EX|EX+|Ultimate|Rebel|Sport|Plus|Mild Hybrid|Electric', Rexton: 'ELX|EX|EX+|Ultimate|Rebel|Sport|Plus|Ultimate+', Tivoli: 'ELX|EX|EX+|Ultimate|Rebel|Sport|Plus|SE|Urban|Mild Hybrid|Grand|XLV', Torres: 'EX|ELX|Ultimate|Rebel|Plus|EVX' },
  Ssangyong: { Korando: 'ELX|EX|EX+|Ultimate|Rebel|Sport|Plus|SE|SX|e-Motion|Electric', Rexton: 'ELX|EX|EX+|Ultimate|Rebel|Sport|Plus|Ultimate+|SX|SE', Tivoli: 'ELX|EX|EX+|Ultimate|Rebel|Sport|Plus|SE|Urban|SX|XLV|Grand', Musso: 'EX|ELX|Ultimate|Rebel|Rhino|Saracen|Sport|Plus|SE|Pickup', XLV: 'ELX|EX|EX+|Ultimate|Rebel|Sport|Plus|SE|SX', Turismo: 'ES|SE|SX|ELX|EX|Ultimate|Plus|7 Seater|9 Seater' },
  Maserati: { Ghibli: 'GT|Modena|Trofeo|Hybrid|S|S Q4|Diesel|GranLusso|GranSport', Grecale: 'GT|Modena|Trofeo|Folgore', Levante: 'GT|Modena|Trofeo|Hybrid|S|S Q4|Diesel|GranLusso|GranSport', Quattroporte: 'GT|Modena|Trofeo|S|S Q4|Diesel|GranLusso|GranSport|V8', MC20: 'MC20|Cielo' },
  Alpine: { A110: 'Pure|Legende|GT|S|R|Premiere Edition|Color Edition|Tour|GTS' },
  Lotus: { Emira: 'V6 First Edition|I4 First Edition|V6|I4|Emira V6|Emira I4', Elise: 'Elise|S|R|SC|Sport|Sport 220|Cup 250|Cup 260|Club Racer', Exige: 'Sport|S|Cup|Cup 380|Sport 350|Sport 410|Sport 380|V6 Cup|Roadster', Evora: '400|410|GT410|Sport 410|S|Sport|GT430|Sport 410 Final Edition', Eletre: 'Eletre|S|R' },
};

// performance and sporting versions that had no list yet
const extra = {
  BMW: { M2: 'Competition|CS', M3: 'Competition|CS|Touring|xDrive', M4: 'Competition|CS|CSL|Convertible|xDrive', M5: 'Competition|CS|Touring', M8: 'Competition|Gran Coupe|Convertible' },
  Audi: {
    S3: 'Sportback|Saloon|Cabriolet', S4: 'Avant|Saloon', S5: 'Sportback|Coupe|Cabriolet', SQ5: 'Sportback|TDI|TFSI',
    RS3: 'Sportback|Saloon|Performance', RS4: 'Avant|Competition', RS5: 'Sportback|Coupe|Cabriolet|Competition', RS6: 'Avant|Performance|GT',
    'RS Q3': 'Sportback', 'RS Q8': 'Performance', R8: 'V10|V10 Plus|Performance|Spyder', 'e-tron GT': 'quattro|RS|Performance',
  },
};
Object.entries(extra).forEach(([make, models]) => { trimsByMake[make] = { ...models, ...(trimsByMake[make] || {}) }; });

// versions every car can come in, for the models we have no list of their own for
export const defaultCarTypes = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric', 'Automatic', 'Manual'];

// the same make written in different ways
const alias = { opel: 'Vauxhall', vauxhall: 'Opel', mini: 'Mini' };

const find = (obj, key) => {
  const k = Object.keys(obj).find((x) => x.toLowerCase() === String(key || '').toLowerCase());
  return k ? obj[k] : null;
};

// the trims known for a make and model: ['SE', 'Sport', ...] (empty when we have none)
export function knownTrims(make, model) {
  const m = find(trimsByMake, make) || find(trimsByMake, alias[String(make || '').toLowerCase()]);
  const line = m && find(m, model);
  if (!line) return [];
  return [...new Set(line.split('|').map((t) => t.trim()).filter(Boolean))];
}
