// Keyword → browseCategory auto-match map
// Used in PlaceAd to auto-detect the right category from user input
const keywordToCategory = {
  // --- Car Makes ---
  opel: 'Cars', vauxhall: 'Cars', volkswagen: 'Cars', vw: 'Cars', ford: 'Cars', toyota: 'Cars', honda: 'Cars', nissan: 'Cars',
  hyundai: 'Cars', kia: 'Cars', renault: 'Cars', peugeot: 'Cars', citroen: 'Cars', fiat: 'Cars', seat: 'Cars', skoda: 'Cars',
  mazda: 'Cars', mitsubishi: 'Cars', subaru: 'Cars', suzuki: 'Cars', dacia: 'Cars', alfa: 'Cars', 'alfa romeo': 'Cars',
  lancia: 'Cars', chrysler: 'Cars', dodge: 'Cars', jeep: 'Cars', chevrolet: 'Cars', buick: 'Cars', cadillac: 'Cars',
  lincoln: 'Cars', pontiac: 'Cars', oldsmobile: 'Cars', saab: 'Cars', volvo: 'Cars', bmw: 'Cars', mercedes: 'Cars',
  audi: 'Cars', porsche: 'Cars', ferrari: 'Cars', lamborghini: 'Cars', maserati: 'Cars', bentley: 'Cars', rolls: 'Cars',
  'rolls-royce': 'Cars', jaguar: 'Cars', 'land rover': 'Cars', landrover: 'Cars', rover: 'Cars', mini: 'Cars',
  lexus: 'Cars', infiniti: 'Cars', acura: 'Cars', genesis: 'Cars', tesla: 'Cars', rivian: 'Cars', lucid: 'Cars',
  polestar: 'Cars', smart: 'Cars', lada: 'Cars', zastava: 'Cars', daewoo: 'Cars', ssangyong: 'Cars', isuzu: 'Cars',
  // --- Car Models (Honda) ---
  civic: 'Cars', accord: 'Cars', crv: 'Cars', 'cr-v': 'Cars', hrv: 'Cars', 'hr-v': 'Cars', jazz: 'Cars', insight: 'Cars',
  // --- Car Models (Ford) ---
  mondeo: 'Cars', focus: 'Cars', fiesta: 'Cars', mustang: 'Cars', kuga: 'Cars', puma: 'Cars', galaxy: 'Cars',
  'c-max': 'Cars', cmax: 'Cars', 's-max': 'Cars', explorer: 'Cars', ranger: 'Trucks', raptor: 'Trucks',
  // --- Car Models (Volkswagen) ---
  golf: 'Cars', polo: 'Cars', passat: 'Cars', tiguan: 'Cars', touareg: 'Cars', arteon: 'Cars',
  't-roc': 'Cars', troc: 'Cars', 'id.3': 'Cars', 'id.4': 'Cars', sharan: 'Cars', touran: 'Cars',
  // --- Car Models (BMW) ---
  '3 series': 'Cars', '5 series': 'Cars', '7 series': 'Cars', '1 series': 'Cars', '2 series': 'Cars',
  '4 series': 'Cars', '6 series': 'Cars', '8 series': 'Cars',
  x1: 'Cars', x2: 'Cars', x3: 'Cars', x4: 'Cars', x5: 'Cars', x6: 'Cars', x7: 'Cars',
  m3: 'Cars', m4: 'Cars', m5: 'Cars', '320d': 'Cars', '318i': 'Cars', '330i': 'Cars', '520d': 'Cars',
  // --- Car Models (Mercedes) ---
  'c class': 'Cars', 'e class': 'Cars', 's class': 'Cars', 'a class': 'Cars', 'b class': 'Cars',
  cla: 'Cars', gla: 'Cars', glb: 'Cars', glc: 'Cars', gle: 'Cars', gls: 'Cars', amg: 'Cars',
  // --- Car Models (Audi) ---
  a1: 'Cars', a2: 'Cars', a3: 'Cars', a4: 'Cars', a5: 'Cars', a6: 'Cars', a7: 'Cars', a8: 'Cars',
  q2: 'Cars', q3: 'Cars', q5: 'Cars', q7: 'Cars', q8: 'Cars', tt: 'Cars', r8: 'Cars',
  // --- Car Models (Toyota) ---
  corolla: 'Cars', camry: 'Cars', yaris: 'Cars', rav4: 'Cars', 'rav-4': 'Cars', prius: 'Cars',
  hilux: 'Trucks', 'land cruiser': 'Cars', chr: 'Cars', 'c-hr': 'Cars', avensis: 'Cars', auris: 'Cars', verso: 'Cars',
  // --- Car Models (Nissan) ---
  qashqai: 'Cars', juke: 'Cars', micra: 'Cars', leaf: 'Cars', xtrail: 'Cars', 'x-trail': 'Cars',
  navara: 'Trucks', pathfinder: 'Cars', murano: 'Cars',
  // --- Car Models (Hyundai) ---
  tucson: 'Cars', i10: 'Cars', i20: 'Cars', i30: 'Cars', i40: 'Cars', ioniq: 'Cars', kona: 'Cars',
  'santa fe': 'Cars', veloster: 'Cars',
  // --- Car Models (Kia) ---
  sportage: 'Cars', sorento: 'Cars', niro: 'Cars', stinger: 'Cars', picanto: 'Cars', ceed: 'Cars', rio: 'Cars', telluride: 'Cars',
  // --- Car Models (Renault) ---
  clio: 'Cars', megane: 'Cars', laguna: 'Cars', scenic: 'Cars', kadjar: 'Cars', captur: 'Cars', zoe: 'Cars', koleos: 'Cars',
  // --- Car Models (Peugeot) ---
  '206': 'Cars', '207': 'Cars', '208': 'Cars', '307': 'Cars', '308': 'Cars', '407': 'Cars', '508': 'Cars',
  '2008': 'Cars', '3008': 'Cars', '5008': 'Cars',
  // --- Car Models (Skoda) ---
  octavia: 'Cars', superb: 'Cars', fabia: 'Cars', kodiaq: 'Cars', karoq: 'Cars', rapid: 'Cars', scala: 'Cars',
  // --- Car Models (Opel/Vauxhall) ---
  astra: 'Cars', corsa: 'Cars', insignia: 'Cars', mokka: 'Cars', zafira: 'Cars', vectra: 'Cars',
  meriva: 'Cars', grandland: 'Cars', crossland: 'Cars',
  // --- Car Models (Seat) ---
  ibiza: 'Cars', leon: 'Cars', ateca: 'Cars', arona: 'Cars', tarraco: 'Cars', alhambra: 'Cars',
  // --- Car Models (Fiat) ---
  punto: 'Cars', '500': 'Cars', bravo: 'Cars', tipo: 'Cars', stilo: 'Cars', multipla: 'Cars', doblo: 'Cars', panda: 'Cars',
  // --- Car Models (Mazda) ---
  mx5: 'Cars', 'mx-5': 'Cars', cx5: 'Cars', 'cx-5': 'Cars', cx3: 'Cars', 'cx-3': 'Cars', mazda3: 'Cars', mazda6: 'Cars',
  // --- Car Models (Subaru) ---
  impreza: 'Cars', outback: 'Cars', forester: 'Cars', legacy: 'Cars', wrx: 'Cars',
  // --- Car Models (Volvo) ---
  xc40: 'Cars', xc60: 'Cars', xc90: 'Cars', v40: 'Cars', v60: 'Cars', v70: 'Cars', v90: 'Cars',
  s40: 'Cars', s60: 'Cars', s90: 'Cars',
  // --- Car Models (Land Rover / Jaguar) ---
  defender: 'Cars', discovery: 'Cars', freelander: 'Cars', evoque: 'Cars', velar: 'Cars', 'range rover': 'Cars',
  xf: 'Cars', xj: 'Cars', xe: 'Cars', fpace: 'Cars', 'f-pace': 'Cars',
  // --- Car Models (Porsche) ---
  '911': 'Cars', cayenne: 'Cars', macan: 'Cars', panamera: 'Cars', boxster: 'Cars', cayman: 'Cars',
  // --- Car Models (Dacia) ---
  duster: 'Cars', sandero: 'Cars', logan: 'Cars', jogger: 'Cars',
  // --- Car Models (Citroen) ---
  c3: 'Cars', c4: 'Cars', c5: 'Cars', berlingo: 'Cars', picasso: 'Cars', dispatch: 'Commercials',
  // --- Car Types ---
  car: 'Cars', cars: 'Cars', sedan: 'Cars', hatchback: 'Cars', saloon: 'Cars', coupe: 'Cars', suv: 'Cars', estate: 'Cars',
  convertible: 'Cars', family: 'Cars', crossover: 'Cars', mpv: 'Cars', people: 'Cars', pickup: 'Trucks',
  // --- New cars are ordinary Cars ads ---
  new: 'Cars', 'new car': 'Cars',
  // --- Electric & Hybrid ---
  'electric & hybrid': 'Electric & Hybrid Cars', 'electric and hybrid': 'Electric & Hybrid Cars',
  'electric car': 'Electric & Hybrid Cars', 'electric cars': 'Electric & Hybrid Cars',
  'hybrid car': 'Electric & Hybrid Cars', 'hybrid cars': 'Electric & Hybrid Cars',
  'ev': 'Electric & Hybrid Cars', 'electric vehicle': 'Electric & Hybrid Cars',
  electric: 'Electric & Hybrid Cars', hybrid: 'Electric & Hybrid Cars', plug: 'Electric & Hybrid Cars',
  // --- Dealership ---
  'dealership cars': 'Dealership Cars', dealership: 'Dealership Cars', dealer: 'Dealership Cars',
  // --- Vintage / Classic ---
  'vintage bikes': 'Vintage Bikes', 'vintage bike': 'Vintage Bikes',
  vintage: 'Vintage Cars', classic: 'Vintage Cars', retro: 'Vintage Cars', antique: 'Vintage Cars', oldtimer: 'Vintage Cars',
  // --- Modified ---
  modified: 'Modified Cars', tuned: 'Modified Cars', custom: 'Modified Cars', lowered: 'Modified Cars', turbo: 'Modified Cars',
  // --- Car Parts ---
  'car parts': 'Car Parts', 'car part': 'Car Parts',
  parts: 'Car Parts', spares: 'Car Parts', spare: 'Car Parts',
  engine: 'Car Parts', gearbox: 'Car Parts', transmission: 'Car Parts', alternator: 'Car Parts',
  radiator: 'Car Parts', exhaust: 'Car Parts', suspension: 'Car Parts', brakes: 'Car Parts', brake: 'Car Parts',
  clutch: 'Car Parts', starter: 'Car Parts', battery: 'Car Parts', bumper: 'Car Parts', bonnet: 'Car Parts',
  door: 'Car Parts', doors: 'Car Parts', axle: 'Car Parts', differential: 'Car Parts', injector: 'Car Parts',
  turbocharger: 'Car Parts', intercooler: 'Car Parts', camshaft: 'Car Parts', crankshaft: 'Car Parts',
  headlight: 'Car Parts', headlights: 'Car Parts', taillight: 'Car Parts', mirror: 'Car Parts',
  windscreen: 'Car Parts', wiper: 'Car Parts', wipers: 'Car Parts', catalytic: 'Car Parts',
  // --- Car Extras ---
  'car extras': 'Car Extras', 'car extra': 'Car Extras',
  tyre: 'Car Extras', tyres: 'Car Extras', tire: 'Car Extras', tires: 'Car Extras', wheels: 'Car Extras', wheel: 'Car Extras',
  alloys: 'Car Extras', alloy: 'Car Extras', rims: 'Car Extras', rim: 'Car Extras',
  extras: 'Car Extras', accessory: 'Car Extras', accessories: 'Car Extras',
  roof: 'Car Extras', 'roof rack': 'Car Extras', towbar: 'Car Extras', stereo: 'Car Extras',
  dashcam: 'Car Extras', 'dash cam': 'Car Extras', mats: 'Car Extras', mat: 'Car Extras',
  seat: 'Car Extras', seats: 'Car Extras', cover: 'Car Extras', covers: 'Car Extras',
  // --- Rally ---
  rally: 'Rally Cars', racing: 'Rally Cars', race: 'Rally Cars', track: 'Rally Cars',
  // --- Breaking / Repairables ---
  breaking: 'Breaking & Repairables', repairable: 'Breaking & Repairables', damaged: 'Breaking & Repairables',
  salvage: 'Breaking & Repairables', crashed: 'Breaking & Repairables', wrecked: 'Breaking & Repairables',
  // --- Trucks & Vans ---
  truck: 'Trucks', lorry: 'Trucks', lorries: 'Trucks', trucks: 'Trucks', hgv: 'Trucks', lgv: 'Trucks',
  van: 'Commercials', vans: 'Commercials', commercial: 'Commercials', commercials: 'Commercials', minivan: 'Commercials',
  transit: 'Commercials', transporter: 'Commercials', sprinter: 'Commercials', vivaro: 'Commercials',
  ducato: 'Commercials', boxer: 'Commercials', traffic: 'Commercials', trafic: 'Commercials',
  trailer: 'Trailers', trailers: 'Trailers', flatbed: 'Trailers', semi: 'Trailers',
  camper: 'Campers', campers: 'Campers', campervan: 'Campers', motorhome: 'Campers', rv: 'Campers',
  coach: 'Coaches & Buses', bus: 'Coaches & Buses', buses: 'Coaches & Buses', minibus: 'Coaches & Buses',
  plant: 'Plant Machinery', machinery: 'Plant Machinery', excavator: 'Plant Machinery', digger: 'Plant Machinery',
  forklift: 'Plant Machinery', tractor: 'Plant Machinery', crane: 'Plant Machinery', jcb: 'Plant Machinery',
  bulldozer: 'Plant Machinery', dumper: 'Plant Machinery', telehandler: 'Plant Machinery',
  caravan: 'Caravans', caravans: 'Caravans',
  // --- Bikes & Bicycles ---
  bike: 'Bikes & Bicycles', bicycle: 'Bikes & Bicycles', bicycles: 'Bikes & Bicycles', cycling: 'Bikes & Bicycles',
  ebike: 'Bikes & Bicycles', pushbike: 'Bikes & Bicycles', mtb: 'Bikes & Bicycles',
  // --- Motorbikes ---
  motorbike: 'Motorbikes', motorcycle: 'Motorbikes', motorcycles: 'Motorbikes', motorbikes: 'Motorbikes', moto: 'Motorbikes',
  harley: 'Motorbikes', kawasaki: 'Motorbikes', yamaha: 'Motorbikes', ducati: 'Motorbikes', triumph: 'Motorbikes',
  ktm: 'Motorbikes', aprilia: 'Motorbikes',
  // --- Scooters ---
  scooter: 'Scooters', scooters: 'Scooters', moped: 'Scooters', vespa: 'Scooters',
  // --- Quads ---
  quad: 'Quads', quads: 'Quads', atv: 'Quads', buggy: 'Quads',
  // --- Boats ---
  boat: 'Boats & Jet Skis', boats: 'Boats & Jet Skis', jetski: 'Boats & Jet Skis', 'jet ski': 'Boats & Jet Skis',
  yacht: 'Boats & Jet Skis', dinghy: 'Boats & Jet Skis', speedboat: 'Boats & Jet Skis', kayak: 'Boats & Jet Skis',
  canoe: 'Boats & Jet Skis', rib: 'Boats & Jet Skis', catamaran: 'Boats & Jet Skis',
  // --- Boat Extras ---
  'boat part': 'Boat Extras', 'boat extra': 'Boat Extras', marine: 'Boat Extras', outboard: 'Boat Extras', anchor: 'Boat Extras',
  // --- Motorbike Extras ---
  'motorbike extra': 'Motorbike Extras', helmet: 'Motorbike Extras', leathers: 'Motorbike Extras',
  gloves: 'Motorbike Extras', visor: 'Motorbike Extras', jacket: 'Motorbike Extras',
};

export default keywordToCategory;