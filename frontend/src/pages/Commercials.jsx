import React, { useState } from 'react';
import BackButton from '../components/automarket/BackButton';
import { useUserAds, userAdToListingItem } from '../hooks/useUserAds';
import { Link } from 'react-router-dom';
import { Search, Star, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import Pagination from '../components/automarket/Pagination';
import MakeSelector from '../components/automarket/MakeSelector';
import ModelSelector from '../components/automarket/ModelSelector';

const ITEMS_PER_PAGE = 12;
import ListingCard from '../components/automarket/ListingCard';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import MobileCategoryFilters from '../components/automarket/MobileCategoryFilters';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { queryClientInstance } from '@/lib/query-client';

const counties = ['All Ireland', 'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kerry', 'Wexford', 'Wicklow', 'Meath', 'Kildare'];
const radii = ['+5km', '+10km', '+20km', '+50km', '+100km', 'Nationwide'];
const vanMakes = ['All makes', 'Ford', 'Renault', 'Volkswagen', 'Mercedes', 'Peugeot', 'Citroën', 'Fiat', 'Vauxhall', 'Toyota', 'Nissan', 'MAN', 'Iveco'];
const vanModels = ['All models', 'Transit', 'Master', 'Sprinter', 'Crafter', 'Boxer', 'Jumper', 'Ducato', 'Movano', 'Proace', 'NV400', 'TGE'];
const years = ['', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014 & older'];
const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'LPG', 'Other'];
const transmissions = ['Manual', 'Automatic', 'Semi-Automatic'];
const bodyTypes = ['Panel Van', 'Crew Van', 'Luton Van', 'Dropside', 'Tipper', 'Refrigerated', 'Minibus', 'Box Van'];
const colours = ['Any', 'Black', 'White', 'Silver', 'Grey', 'Blue', 'Red', 'Green', 'Yellow', 'Orange', 'Brown'];
const regCountries = ['Any', 'Ireland', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Other'];
const adTypes = ['All', 'For Sale', 'Wanted'];

const listings = [];


function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
      <Star key={s} className={`w-3 h-3 ${s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-muted-foreground'}`} />
      )}
    </div>);

}

function FilterSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-3">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full text-sm font-semibold text-foreground">
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>);

}

function Sel({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none border border-border rounded-lg px-3 py-2.5 text-sm bg-card hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary/40 pr-7 text-foreground transition-colors cursor-pointer">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>);

}

export default function Commercials() {
  const [search, setSearch] = useState('');
  const [county, setCounty] = useState('All Ireland');
  const [radius, setRadius] = useState('+5km');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [sellerTypes, setSellerTypes] = useState([]);
  const [mileageFrom, setMileageFrom] = useState('');
  const [mileageTo, setMileageTo] = useState('');
  const [fuelSelected, setFuelSelected] = useState([]);
  const [transSelected, setTransSelected] = useState([]);
  const [bodySelected, setBodySelected] = useState([]);
  const [colour, setColour] = useState('Any');
  const [regCountry, setRegCountry] = useState('Any');
  const [reserveOnline, setReserveOnline] = useState(false);
  const [adType, setAdType] = useState('All');
  const [savedIds, setSavedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const userAds = useUserAds(['Commercials']);

  const toggleSaved = (id) => setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleArr = (setter) => (val) => setter((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);

  const handleReset = () => {
    setCounty('All Ireland');setRadius('+5km');
    setMake('');setModel('');
    setYearFrom('');setYearTo('');
    setPriceFrom('');setPriceTo('');
    setSellerTypes([]);
    setMileageFrom('');setMileageTo('');
    setFuelSelected([]);setTransSelected([]);setBodySelected([]);
    setColour('Any');setRegCountry('Any');
    setReserveOnline(false);setAdType('All');
  };

  const normalizedUserAds = userAds.map(ad => ({ ...userAdToListingItem(ad), isUserAd: true }));
  const allListings = [...normalizedUserAds, ...listings];

  const allFiltered = allListings.filter((l) => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase());
    const matchCounty = county === 'All Ireland' || (l.location || '').includes(county);
    const matchMake = !make || l.title.toLowerCase().includes(make.toLowerCase());
    const _n = (v) => String(v || '').toLowerCase().replace(/[\s-]+/g, '_');
    const matchAdType = !adType || adType === 'All' || _n(l.adType || 'for_sale') === _n(adType);
    return matchSearch && matchCounty && matchMake && matchAdType;
  });
  const totalPages = Math.ceil(allFiltered.length / ITEMS_PER_PAGE);
  const filtered = allFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const handlePageChange = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const filtersContent = (
          <div className="bg-card rounded-xl p-4 text-sm">
              <button className="flex items-center justify-center w-full bg-primary text-white rounded-lg px-4 py-2.5 hover:bg-primary/90 transition-colors mb-4 font-semibold">
                Search
              </button>

              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-foreground">Filters</span>
                <button onClick={handleReset} className="text-xs text-primary hover:underline">Reset All</button>
              </div>

              <button className="flex items-center gap-2 w-full border border-border rounded-lg px-4 py-2.5 hover:bg-secondary transition-colors mb-3 text-muted-foreground">
                <Search className="w-4 h-4" /> View your saved searches
              </button>

              <FilterSection title="Location">
                <div className="flex flex-col gap-2">
                  <Sel value={county} onChange={setCounty} options={counties} />
                  <Sel value={radius} onChange={setRadius} options={radii} />
                </div>
              </FilterSection>

              <FilterSection title="Make / Model" defaultOpen={false}>
                <div className="flex flex-col gap-2">
                  <MakeSelector value={make} onChange={(val) => { setMake(val); setModel(''); }} />
                  <ModelSelector make={make} value={model} onChange={setModel} />
                </div>
              </FilterSection>

              <FilterSection title="Year" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-2">
                  <Sel value={yearFrom} onChange={setYearFrom} options={years} placeholder="From" />
                  <Sel value={yearTo} onChange={setYearTo} options={years} placeholder="To" />
                </div>
              </FilterSection>

              <FilterSection title="Price" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} placeholder="From €" className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 w-full" />
                  <input type="number" value={priceTo} onChange={(e) => setPriceTo(e.target.value)} placeholder="To €" className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 w-full" />
                </div>
              </FilterSection>

              <FilterSection title="Seller type" defaultOpen={false}>
                <div className="flex flex-col gap-1.5">
                  {[['Dealership', '8,420'], ['Private seller', '4,790']].map(([label, count]) =>
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={sellerTypes.includes(label)} onChange={() => toggleArr(setSellerTypes)(label)} className="w-3.5 h-3.5 accent-primary" />
                      <span className="text-sm text-foreground">{label} <span className="text-muted-foreground">({count})</span></span>
                    </label>
                  )}
                </div>
              </FilterSection>

              <FilterSection title="Mileage" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={mileageFrom} onChange={(e) => setMileageFrom(e.target.value)} placeholder="From km" className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 w-full" />
                  <input type="number" value={mileageTo} onChange={(e) => setMileageTo(e.target.value)} placeholder="To km" className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 w-full" />
                </div>
              </FilterSection>

              <FilterSection title="Fuel type" defaultOpen={false}>
                <div className="flex flex-col gap-1.5">
                  {fuelTypes.map((f) =>
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={fuelSelected.includes(f)} onChange={() => toggleArr(setFuelSelected)(f)} className="w-3.5 h-3.5 accent-primary" />
                      <span className="text-sm text-foreground">{f}</span>
                    </label>
                  )}
                </div>
              </FilterSection>

              <FilterSection title="Transmission" defaultOpen={false}>
                <div className="flex flex-wrap gap-2">
                  {transmissions.map((t) =>
                  <button key={t} onClick={() => toggleArr(setTransSelected)(t)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${transSelected.includes(t) ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}>
                      {t}
                    </button>
                  )}
                </div>
              </FilterSection>

              <FilterSection title="Body type" defaultOpen={false}>
                <div className="flex flex-col gap-1.5">
                  {bodyTypes.map((b) =>
                  <label key={b} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={bodySelected.includes(b)} onChange={() => toggleArr(setBodySelected)(b)} className="w-3.5 h-3.5 accent-primary" />
                      <span className="text-sm text-foreground">{b}</span>
                    </label>
                  )}
                </div>
              </FilterSection>

              <FilterSection title="Colour" defaultOpen={false}>
                <div className="flex flex-wrap gap-2">
                  {colours.map((c) =>
                  <button key={c} onClick={() => setColour(c)}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${colour === c ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}>
                      {c}
                    </button>
                  )}
                </div>
              </FilterSection>

              <FilterSection title="Current country of reg." defaultOpen={false}>
                <Sel value={regCountry} onChange={setRegCountry} options={regCountries} />
              </FilterSection>

              <FilterSection title="Reserve online" defaultOpen={false}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={reserveOnline} onChange={(e) => setReserveOnline(e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
                  <span className="text-sm text-foreground">Reserve online only</span>
                </label>
              </FilterSection>

              <FilterSection title="Ad type" defaultOpen={false}>
                <div className="flex flex-col gap-1.5">
                  {adTypes.map((t) =>
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="commercialAdType" checked={adType === t} onChange={() => setAdType(t)} className="w-3.5 h-3.5 accent-primary" />
                      <span className="text-sm text-foreground">{t}</span>
                    </label>
                  )}
                </div>
              </FilterSection>

              <button className="flex items-center justify-center w-full bg-primary text-white rounded-lg px-4 py-2.5 hover:bg-primary/90 transition-colors mt-4 font-semibold">
                Search
              </button>
            </div>
        );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PullToRefresh onRefresh={async () => { await queryClientInstance.invalidateQueries(); }}>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Commercials</span>
        </div>

        {/* Header row */}
        <div className="mb-5">
          <div className="flex items-center gap-8 mb-3">
            <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">Commercials</h1>
          </div>
        </div>

        <div className="mb-6 rounded-xl overflow-hidden border border-border h-36 sm:h-44 bg-card">
          <img src="/img/37b29cbc7_generated_image.jpg" alt="Commercials Banner" className="w-full h-full object-cover" />
        </div>

        {/* Mobile: search + help text + filters */}
        <MobileCategoryFilters search={search} onSearchChange={(e) => setSearch(e.target.value)} placeholder="Search Commercials">
          {filtersContent}
        </MobileCategoryFilters>

        {/* Desktop: search + help text */}
        <div className="hidden lg:flex items-center gap-8 mb-5">
          <div className="relative flex-1 max-w-[35%]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Commercials"
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-foreground outline-none" />
          </div>
          <p className="text-foreground text-base flex-1 text-right">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0 self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            {filtersContent}
          </aside>

          {/* Listings */}
          <div className="flex-1 min-w-0 min-h-[calc(100vh+4rem)]">
            {/* Results bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{allFiltered.length.toLocaleString()}</span> ads for <span className="font-semibold text-foreground">Commercials in Ireland</span>
              </p>

            </div>

            <div className="flex flex-col gap-4">
              {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground"><p className="text-lg font-medium">No commercials found</p><p className="text-sm mt-1">Try adjusting your search or filters</p></div>}
              {filtered.map((listing) =>
              <ListingCard
                key={listing.id}
                item={listing.isUserAd ? listing : {
                  ...listing,
                  sellerType: listing.dealerType || listing.sellerType,
                  sellerRating: listing.dealerRating || listing.sellerRating,
                  timeAgo: listing.daysAgo
                }}
                saved={savedIds.includes(listing.id)}
                onToggleSave={toggleSaved}
                viewMode="list" />

              )}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>
      </PullToRefresh>

      <Footer />
    </div>);

}