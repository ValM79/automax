import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import MobileSelect from './MobileSelect';
import MakeSelector from './MakeSelector';
import ModelSelector from './ModelSelector';
import BodyTypeSelector from './BodyTypeSelector';

const makes = ['All makes', 'Audi', 'BMW', 'Ford', 'Hyundai', 'Nissan', 'Renault', 'Toyota', 'Volkswagen'];
const models = ['All models', 'Corolla', 'Golf', 'Focus', 'IX20', 'A4', '3 Series'];
const trims = ['All trims', 'SE', 'Sport', 'Executive', 'Comfort', 'Premium'];
const years = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => String(2026 - i));
const counties = ['All Ireland', 'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Mayo', 'Kerry', 'Clare', 'Tipperary', 'Roscommon', 'Westmeath', 'Wexford', 'Wicklow', 'Meath', 'Kildare', 'Other'];

const radii = ['+5km', '+10km', '+20km', '+50km', '+100km', 'Nationwide'];
const priceOptions = ['€100', '€500', '€1,000', '€2,000', '€3,000', '€4,000', '€5,000', '€6,000', '€7,000', '€8,000', '€9,000', '€10,000', '€12,000', '€15,000', '€18,000', '€20,000', '€25,000', '€30,000', '€35,000', '€40,000', '€50,000', '€60,000', '€70,000', '€80,000', '€100,000', '€150,000'];
const mileageOptions = ['0 km', '5,000 km', '10,000 km', '20,000 km', '30,000 km', '40,000 km', '50,000 km', '60,000 km', '75,000 km', '100,000 km', '125,000 km', '150,000 km', '175,000 km', '200,000 km', '250,000 km', '300,000 km', '400,000 km'];
const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'LPG', 'Other'];
const transmissions = ['Manual', 'Automatic', 'Semi-Automatic'];
const bodyTypeImages = {
  SUV: '/img/3ec760ce2_generated_image.jpg',
  Estate: '/img/cd2cf6c5c_generated_image.jpg',
  Hatchback: '/img/2f0d7d7fc_generated_image.jpg',
  Saloon: '/img/fbd551b69_generated_image.jpg',
  MPV: '/img/e56235d3c_generated_image.jpg',
  Coupe: '/img/0cb9c1f70_generated_image.jpg',
  Van: '/img/e655d5475_generated_image.jpg',
  Convertible: '/img/93eab3099_generated_image.jpg',
  'Pick Up': '/img/d65af73b5_generated_image.jpg'
};

const bodyTypes = ['SUV', 'Estate', 'Hatchback', 'Saloon', 'MPV', 'Coupe', 'Van', 'Convertible', 'Pick Up', 'Other'];
const engineSizes = ['Under 1.0L', '1.0–1.4L', '1.4–1.8L', '1.8–2.0L', '2.0–2.5L', '2.5–3.0L', '3.0L+'];
const enginePowers = ['Any', 'Under 75hp', '75–100hp', '100–150hp', '150–200hp', '200–300hp', '300hp+'];
const seatOptions = ['Any', '2', '4', '5', '6', '7', '8+'];
const doorOptions = ['Any', '2', '3', '4', '5'];
const colours = ['Any', 'Black', 'White', 'Silver', 'Grey', 'Navy Blue', 'Blue', 'Red', 'Burgundy', 'Green', 'Yellow', 'Orange', 'Brown', 'Beige', 'Gold', 'Bronze', 'Purple', 'Pink', 'Turquoise', 'Champagne', 'Graphite', 'Copper'];
const roadTaxOptions = ['Under €200', '€200–€400', '€400–€600', '€600+'];
const nctOptions = ['Any', 'Valid NCT/CVRT', 'Expiring in 3 months', 'Expiring in 6 months', 'Expiring in 12 months', 'No NCT/CVRT'];
const adTypes = ['All', 'For Sale', 'Wanted'];

function Section({ title, defaultOpen = true, children, alwaysOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (alwaysOpen) {
    return (
      <div className="border-b border-border py-4">
        <div className="text-base font-semibold text-foreground mb-4">{title}</div>
        {children}
      </div>);

  }
  return (
    <div className="border-b border-border py-4">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full text-base font-semibold text-foreground">
        {title}
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>);

}

function Sel({ value, onChange, options, placeholder, sizeClass }) {
  return <MobileSelect value={value} onChange={onChange} options={options} placeholder={placeholder} sizeClass={sizeClass} />;
}

const batteryKwhOptions = ['24 kWh', '30 kWh', '40 kWh', '50 kWh', '60 kWh', '64 kWh', '77 kWh', '82 kWh', '100 kWh', '100+ kWh'];
const batteryRangeOptions = ['100 km', '150 km', '200 km', '250 km', '300 km', '350 km', '400 km', '450 km', '500 km', '500+ km'];

export default function FiltersSidebar({ onFilterChange, hideFuelType = false, hideTransmission = false, fixedMake = '' }) {
  const [resetKey, setResetKey] = useState(0);
  const [sellerType, setSellerType] = useState('Both');
  const [ratings, setRatings] = useState([]);
  const [vehicles, setVehicles] = useState([{ make: fixedMake, model: '', bodyType: '' }]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [warranty, setWarranty] = useState('');
  const [verifications, setVerifications] = useState([]);
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [mileageFrom, setMileageFrom] = useState('');
  const [mileageTo, setMileageTo] = useState('');
  const [county, setCounty] = useState('All Ireland');
  const [customLocation, setCustomLocation] = useState('');
  const [radius, setRadius] = useState('+5km');
  const [showAllFuel, setShowAllFuel] = useState(true);
  const [fuelSelected, setFuelSelected] = useState([]);
  const [transSelected, setTransSelected] = useState([]);
  const [bodySelected, setBodySelected] = useState([]);
  const [engineSize, setEngineSize] = useState('');
  const [enginePowerFrom, setEnginePowerFrom] = useState('');
  const [enginePowerTo, setEnginePowerTo] = useState('');
  const [batteryFrom, setBatteryFrom] = useState('');
  const [batteryTo, setBatteryTo] = useState('');
  const [batteryRangeFrom, setBatteryRangeFrom] = useState('');
  const [batteryRangeTo, setBatteryRangeTo] = useState('');
  const [seatsSelected, setSeatsSelected] = useState([]);
  const [doorsSelected, setDoorsSelected] = useState([]);
  const [coloursSelected, setColoursSelected] = useState([]);
  const [nctFrom, setNctFrom] = useState('');
  const [nctTo, setNctTo] = useState('');
  const [ownership, setOwnership] = useState([]);
  const [roadTaxFrom, setRoadTaxFrom] = useState('');
  const [roadTaxTo, setRoadTaxTo] = useState('');
  const [reserveOnline, setReserveOnline] = useState(false);
  const [adType, setAdType] = useState('All');
  const [trusted, setTrusted] = useState(false);

  const handleReset = () => {
    setSellerType('Both');
    setRatings([]);
    setVehicles([{ make: fixedMake, model: '', bodyType: '' }]);
    setYearFrom('');setYearTo('');
    setWarranty('');setVerifications([]);
    setPriceFrom('');setPriceTo('');
    setMileageFrom('');setMileageTo('');
    setCounty('All Ireland');setCustomLocation('');setRadius('+5km');
    setShowAllFuel(true);setFuelSelected([]);
    setTransSelected([]);setBodySelected([]);
    setEngineSize('');
    setEnginePowerFrom('');setEnginePowerTo('');
    setBatteryFrom('');setBatteryTo('');
    setBatteryRangeFrom('');setBatteryRangeTo('');
    setSeatsSelected([]);setDoorsSelected([]);
    setColoursSelected([]);setNctFrom('');setNctTo('');
    setOwnership([]);setRoadTaxFrom('');setRoadTaxTo('');
    setReserveOnline(false);setAdType('All');setTrusted(false);
    setResetKey((k) => k + 1);
  };

  const toggleArr = (setter) => (val) => setter((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);

  useEffect(() => {
    if (onFilterChange) {
      const sellerTypes = sellerType === 'Both' ? [] : [sellerType];
      onFilterChange({ vehicles, yearFrom, yearTo, priceFrom, priceTo, mileageFrom, mileageTo, fuelSelected, transSelected, bodySelected, sellerTypes, engineSize, enginePowerFrom, enginePowerTo, batteryFrom, batteryTo, batteryRangeFrom, batteryRangeTo, seatsSelected, doorsSelected, coloursSelected, ownership, roadTaxFrom, roadTaxTo, nctFrom, nctTo, adType, county: county === 'Other' ? customLocation : county });
    }
  }, [vehicles, yearFrom, yearTo, priceFrom, priceTo, mileageFrom, mileageTo, fuelSelected, transSelected, bodySelected, sellerType, engineSize, enginePowerFrom, enginePowerTo, batteryFrom, batteryTo, batteryRangeFrom, batteryRangeTo, seatsSelected, doorsSelected, coloursSelected, ownership, roadTaxFrom, roadTaxTo, nctFrom, nctTo, adType, county, customLocation]);

  return (
    <div className="text-base ml-1">
      {/* Search */}
      <button className="flex items-center justify-center gap-2 w-full bg-primary text-white rounded-lg px-4 py-3 hover:bg-primary/90 transition-colors mb-5 font-semibold text-base">
        Search
      </button>

      {/* Filters header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-lg text-foreground">Filters</span>
        <button onClick={handleReset} className="text-sm text-primary hover:underline mx-3">Reset All</button>
      </div>

      <div key={resetKey}>

      {/* Ad type */}
      <Section title="Ad type" alwaysOpen>
        <div className="flex flex-col gap-2.5">
          {adTypes.map((label) =>
            <label key={label} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="adType" checked={adType === label} onChange={() => setAdType(label)} className="w-4 h-4 accent-primary" />
              <span className="text-base text-foreground">{label}</span>
            </label>
          )}
        </div>
      </Section>

      {/* Location */}
      <Section title="Location" alwaysOpen>
        {county === 'Other' ? (
          <div className="relative">
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="Enter location..."
              className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-9" />
            <button
              type="button"
              onClick={() => { setCounty('All Ireland'); setCustomLocation(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Sel value={county} onChange={setCounty} options={counties} sizeClass="text-base" />
        )}
      </Section>

      {/* Make, Model, Body type */}
      <div className="border-b border-border py-4">
        <div className="text-base font-semibold text-foreground mb-4">Make, Model, Body type</div>
        <div className="flex flex-col gap-3">
          {vehicles.map((v, i) =>
            <div key={i} className="flex flex-col gap-2">
              {i > 0 && <div className="border-t border-border pt-2" />}
              {fixedMake ? (
                <div className="w-full flex items-center border border-border rounded-lg px-4 py-3 text-base bg-secondary text-foreground font-medium">
                  {fixedMake}
                </div>
              ) : (
                <MakeSelector value={v.make} onChange={(val) => setVehicles((prev) => prev.map((x, idx) => idx === i ? { ...x, make: val, model: '' } : x))} />
              )}
              <ModelSelector make={v.make} value={v.model} onChange={(val) => setVehicles((prev) => prev.map((x, idx) => idx === i ? { ...x, model: val } : x))} />
              <BodyTypeSelector value={v.bodyType} onChange={(val) => setVehicles((prev) => prev.map((x, idx) => idx === i ? { ...x, bodyType: val } : x))} />
            </div>
            )}
          {!fixedMake && vehicles.length < 3 && (
          <button onClick={() => setVehicles((prev) => [...prev, { make: '', model: '', bodyType: '' }])}
            className="flex items-center gap-2 text-primary text-sm font-medium hover:underline mt-1">
            <Plus className="w-4 h-4" /> Add another vehicle
          </button>
          )}
        </div>
      </div>

      {/* Year */}
      <Section title="Year" alwaysOpen>
        <div className="grid grid-cols-2 gap-2">
          <Sel value={yearFrom} onChange={setYearFrom} options={years} placeholder="From" />
          <Sel value={yearTo} onChange={setYearTo} options={years} placeholder="To" />
        </div>
      </Section>

      {/* Price */}
      <Section title="Price" alwaysOpen>
        <p className="text-sm text-muted-foreground mb-2">€ EUR</p>
        <div className="grid grid-cols-2 gap-2">
          <Sel value={priceFrom} onChange={setPriceFrom} options={priceOptions} placeholder="From" />
          <Sel value={priceTo} onChange={setPriceTo} options={priceOptions} placeholder="To" />
        </div>
      </Section>

      {/* Mileage */}
      <Section title="Mileage" alwaysOpen>
        <div className="grid grid-cols-2 gap-2">
          <Sel value={mileageFrom} onChange={setMileageFrom} options={mileageOptions} placeholder="From" />
          <Sel value={mileageTo} onChange={setMileageTo} options={mileageOptions} placeholder="To" />
        </div>
      </Section>

      {/* Fuel type / Battery Range */}
      {hideFuelType ? (
        <Section title="Battery Range (km)" alwaysOpen>
          <div className="grid grid-cols-2 gap-2">
            <Sel value={batteryRangeFrom} onChange={setBatteryRangeFrom} options={batteryRangeOptions} placeholder="From" />
            <Sel value={batteryRangeTo} onChange={setBatteryRangeTo} options={batteryRangeOptions} placeholder="To" />
          </div>
        </Section>
      ) : (
        <Section title="Fuel type">
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-3 cursor-pointer mb-1">
              <input type="checkbox" checked={showAllFuel} onChange={(e) => {setShowAllFuel(e.target.checked);if (e.target.checked) setFuelSelected([]);}} className="w-4.5 h-4.5 accent-primary w-5 h-5" />
              <span className="text-base text-foreground">Show all fuel types</span>
            </label>
            {fuelTypes.map((f) =>
            <label key={f} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={fuelSelected.includes(f)} onChange={() => {toggleArr(setFuelSelected)(f);setShowAllFuel(false);}} className="w-5 h-5 accent-primary" />
              <span className="text-base text-foreground">{f}</span>
            </label>
            )}
          </div>
        </Section>
      )}

      {/* Engine size / Battery size */}
      {hideFuelType ? (
        <Section title="Battery size (kWh)" alwaysOpen>
          <div className="grid grid-cols-2 gap-2">
            <Sel value={batteryFrom} onChange={setBatteryFrom} options={batteryKwhOptions} placeholder="From" />
            <Sel value={batteryTo} onChange={setBatteryTo} options={batteryKwhOptions} placeholder="To" />
          </div>
        </Section>
      ) : (
        <Section title="Engine size" alwaysOpen>
          <Sel value={engineSize} onChange={setEngineSize} options={engineSizes} placeholder="Any" />
        </Section>
      )}

      {/* Power (HP) — shown right after Battery size when hideFuelType */}
      {hideFuelType && (
      <Section title="Power (HP)" alwaysOpen>
        <Sel value={enginePowerFrom} onChange={setEnginePowerFrom} options={enginePowers} placeholder="Any" />
      </Section>
      )}

      {/* Transmission */}
      {!hideTransmission && (
      <Section title="Transmission" alwaysOpen>
        <div className="flex flex-wrap gap-2">
          {transmissions.map((t) =>
            <button key={t} onClick={() => toggleArr(setTransSelected)(t)}
            className={`px-4 py-2 border transition-colors rounded-md font-bold text-base text-[hsl(var(--foreground))] ${transSelected.includes(t) ? 'border-primary bg-primary/5 text-primary' : "border-border hover:bg-secondary"}`}>
              {t}
            </button>
            )}
        </div>
      </Section>
      )}

      {/* Seller type */}
      <Section title="Seller type" alwaysOpen>
        <div className="flex flex-wrap gap-2">
          {['Dealership', 'Private seller', 'Both'].map((label) =>
            <button key={label} onClick={() => setSellerType(label)}
            className={`px-4 py-2 border transition-colors rounded-md font-bold text-base text-[hsl(var(--foreground))] ${sellerType === label ? 'border-primary bg-primary/5 text-primary' : "border-border hover:bg-secondary"}`}>
              {label}
            </button>
            )}
        </div>
      </Section>

      {/* Battery range (kWh) — hidden when moved up via hideFuelType */}
      {!hideFuelType && (
      <Section title="Battery range" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {batteryKwhOptions.map((kw) =>
            <button key={kw}
            onClick={() => {setBatteryFrom(kw);setBatteryTo(kw);}}
            className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${batteryFrom === kw ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground hover:bg-secondary'}`}>
              {kw}
            </button>
            )}
        </div>
        <button onClick={() => {setBatteryFrom('');setBatteryTo('');}} className="text-xs text-primary hover:underline mt-2">Clear</button>
      </Section>
      )}

      {/* Seats */}
      <Section title="Seats" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {seatOptions.map((s) =>
            <button key={s} onClick={() => toggleArr(setSeatsSelected)(s)}
            className={`w-12 h-10 border text-sm font-medium transition-colors rounded ${seatsSelected.includes(s) ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}>{s}</button>
            )}
        </div>
      </Section>

      {/* Doors */}
      <Section title="Doors" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {doorOptions.map((d) =>
            <button key={d} onClick={() => toggleArr(setDoorsSelected)(d)}
            className={`px-4 py-2 rounded-full border text-sm transition-colors ${doorsSelected.includes(d) ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}>{d}</button>
            )}
        </div>
      </Section>

      {/* Colour */}
      <Section title="Colour" defaultOpen={false}>
        <div className="flex flex-col gap-1">
          {colours.map((c) =>
            <label key={c} className="flex items-center gap-3 cursor-pointer py-1.5 hover:bg-secondary rounded px-1 transition-colors">
              <input type="checkbox" checked={coloursSelected.includes(c)} onChange={() => toggleArr(setColoursSelected)(c)} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">{c}</span>
            </label>
            )}
        </div>
      </Section>

      {/* Ownership & History */}
      <Section title="Ownership & History" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          {['1 owner', '2 owners', '3+ owners', 'Full service history', 'No accidents'].map((v) =>
            <label key={v} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={ownership.includes(v)} onChange={() => toggleArr(setOwnership)(v)} className="w-5 h-5 accent-primary" />
              <span className="text-base text-foreground">{v}</span>
            </label>
            )}
        </div>
      </Section>

      {/* Road TAX */}
      <Section title="Road TAX" defaultOpen={false}>
        <p className="text-sm text-muted-foreground mb-2">€ EUR</p>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="0" value={roadTaxFrom} onChange={(e) => setRoadTaxFrom(e.target.value)} placeholder="From" className="w-full border border-border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <input type="number" min="0" value={roadTaxTo} onChange={(e) => setRoadTaxTo(e.target.value)} placeholder="To" className="w-full border border-border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
      </Section>

      {/* NCT/CVRT */}
      <Section title="NCT/CVRT" defaultOpen={false}>
        <p className="text-sm text-muted-foreground mb-2">Expiry (MM/YYYY)</p>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={nctFrom} onChange={(e) => setNctFrom(e.target.value)} placeholder="From" className="w-full border border-border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <input type="text" value={nctTo} onChange={(e) => setNctTo(e.target.value)} placeholder="To" className="w-full border border-border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
      </Section>

      </div>

      {/* Bottom Search button */}
      <button className="flex items-center justify-center gap-2 w-full bg-primary text-white rounded-lg px-4 py-3 hover:bg-primary/90 transition-colors mt-5 font-semibold text-base">
        Search
      </button>
    </div>);

}