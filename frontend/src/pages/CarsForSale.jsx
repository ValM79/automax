import React, { useState, useEffect, useMemo } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link, useLocation } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { getSavedSearches, removeSavedSearch } from '@/lib/savedSearches';
import PromoBanner from '../components/automarket/PromoBanner';
import { Search, ChevronDown, ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import ListingCard from '../components/automarket/ListingCard';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import FiltersSidebar from '../components/automarket/FiltersSidebar';
import Pagination from '../components/automarket/Pagination';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useUserAds, userAdToListingItem } from '../hooks/useUserAds';

const ITEMS_PER_PAGE = 12;

const carListings = [];




// Subsections that map to the Cars for Sale page
const CARS_SUBSECTIONS = ['Cars', 'New Cars', 'Cars from Dealerships', 'Vintage Cars', 'Modified Cars', 'Rally Cars', 'Breaking & Repairables', 'Electric & Hybrid Cars'];

const parseEngineSizeValue = (str) => {
  if (!str) return null;
  const m = String(str).match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
};
const parseEngineSizeRange = (opt) => {
  if (!opt || opt === 'Any') return null;
  if (opt === 'Under 1.0L') return [0, 0.999];
  if (opt === '3.0L+') return [3.0, Infinity];
  const m = opt.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
};
const parseEnginePowerValue = (str) => {
  if (!str) return null;
  const m = String(str).match(/([\d.]+)/);
  return m ? parseInt(m[1], 10) : null;
};
const parseEnginePowerRange = (opt) => {
  if (!opt || opt === 'Any') return null;
  if (opt === 'Under 75hp') return [0, 74];
  if (opt === '300hp+') return [300, Infinity];
  const m = opt.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null;
};
const parseRoadTaxValue = (str) => {
  if (!str) return null;
  const m = String(str).match(/([\d.]+)/);
  return m ? parseInt(m[1], 10) : null;
};
const parseRoadTaxRange = (opt) => {
  if (!opt || opt === 'Any') return null;
  if (opt === 'Under €200') return [0, 199];
  if (opt === '€600+') return [600, Infinity];
  const m = opt.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null;
};

export default function CarsForSale() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({ vehicles: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('q') || '');
    setCurrentPage(1);
  }, [location.search]);

  // Apply saved search filters when arriving from a saved search click
  useEffect(() => {
    if (location.state?.savedSearchFilters) {
      setActiveFilters(location.state.savedSearchFilters);
      setCurrentPage(1);
    }
  }, [location.state]);

  const heroFilters = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      make: params.get('make') || '',
      model: params.get('model') || '',
      minYear: params.get('minYear') || '',
      maxYear: params.get('maxYear') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      bodyType: params.get('bodyType') || '',
    };
  }, [location.search]);
  const { isFavorite, toggleFavorite } = useFavorites();
  const userAds = useUserAds(CARS_SUBSECTIONS, refetchKey);

  const activeVehicles = (activeFilters.vehicles || []).filter((v) => v.make);

  // Parse price string like "€14,900" -> 14900
  const parsePrice = (str) => str ? parseInt(str.replace(/[€,]/g, ''), 10) : null;
  // Parse mileage string like "88,500 km" -> 88500
  const parseMileage = (str) => str ? parseInt(str.replace(/[, km]/g, ''), 10) : null;

  // Normalize user ads into the same shape as carListings for unified filtering/pagination
  const normalizedUserAds = userAds.map((ad) => ({
    id: ad.id,
    isUserAd: true,
    title: ad.title,
    year: parseInt(ad.vehicleYear) || null,
    fuel: ad.vehicleFuel,
    mileage: ad.mileage,
    location: ad.location,
    price: parseFloat(ad.price?.replace(/[^0-9.]/g, '')) || 0,
    monthly: null,
    photos: ad.photos ? ad.photos.length : 1,
    images: ad.photos || [],
    image: (ad.photos && ad.photos.length > 0) ? ad.photos[0] : null,
    trusted: false,
    currency: ad.currency || '€',
    fullName: ad.fullName,
    email: ad.email,
    phone: ad.phone,
    sellerId: ad.created_by_id,
    spotlight: ad.spotlight,
    sellerType: ad.isTrader ? 'Trader' : 'Private Seller',
    adType: ad.adType,
    description: ad.description,
    bodyType: ad.bodyType,
    transmission: ad.vehicleTransmission,
    engineSize: ad.engineSize,
    enginePower: ad.enginePower,
    batteryRange: ad.batteryRange,
    numberOfSeats: ad.numberOfSeats,
    numberOfDoors: ad.numberOfDoors,
    colour: ad.colour,
    previousOwners: ad.previousOwners,
    fullServiceHistory: ad.fullServiceHistory,
    noAccidents: ad.noAccidents,
    roadTax: ad.roadTax,
    nctExpiry: ad.nctExpiry,
    taxExpiry: ad.taxExpiry,
    _raw: ad,
  }));

  const allListings = [...normalizedUserAds];

  const matchesSearch = (c) => !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.location || '').toLowerCase().includes(search.toLowerCase());

  const matchesFilters = (c) => {
    const { yearFrom, yearTo, priceFrom, priceTo, mileageFrom, mileageTo, fuelSelected, county, transSelected, bodySelected, sellerTypes, engineSize, enginePowerFrom, enginePowerTo, batteryFrom, seatsSelected, doorsSelected, coloursSelected, ownership, roadTaxFrom, roadTaxTo, nctFrom, nctTo, adType } = activeFilters;
    // Sidebar filters
    if (yearFrom && c.year < parseInt(yearFrom)) return false;
    if (yearTo && c.year > parseInt(yearTo)) return false;
    const cPrice = c.price;
    if (priceFrom && cPrice < parsePrice(priceFrom)) return false;
    if (priceTo && cPrice > parsePrice(priceTo)) return false;
    const cMileage = parseMileage(c.mileage);
    if (mileageFrom && cMileage < parseMileage(mileageFrom)) return false;
    if (mileageTo && cMileage > parseMileage(mileageTo)) return false;
    if (fuelSelected && fuelSelected.length > 0) {
      const fuel = (c.fuel || '').toLowerCase();
      if (!fuelSelected.some(f => fuel.includes(f.toLowerCase()))) return false;
    }
    if (county && county !== 'All Ireland') {
      const loc = (c.location || '').toLowerCase();
      if (!loc.includes(county.replace('Co. ', '').toLowerCase())) return false;
    }
    // Transmission
    if (transSelected && transSelected.length > 0) {
      const trans = c.transmission || c._raw?.vehicleTransmission;
      if (!trans || !transSelected.some(t => t.toLowerCase() === trans.toLowerCase())) return false;
    }
    // Body type (from Body type section)
    if (bodySelected && bodySelected.length > 0) {
      const bt = (c.bodyType || c._raw?.bodyType || '').toLowerCase();
      if (!bt || !bodySelected.some(b => b.toLowerCase() === bt)) return false;
    }
    // Seller type
    if (sellerTypes && sellerTypes.length > 0) {
      const st = (c.sellerType || '').toLowerCase();
      const sellerMatch = sellerTypes.some(s => {
        if (s === 'Dealership') return st.includes('dealer') || st.includes('trader') || st.includes('trusted');
        if (s === 'Private seller') return st.includes('private');
        return false;
      });
      if (!sellerMatch) return false;
    }
    // Engine size
    if (engineSize) {
      const adEngine = parseEngineSizeValue(c.engineSize || c._raw?.engineSize);
      if (adEngine === null) return false;
      const r = parseEngineSizeRange(engineSize);
      if (r && (adEngine < r[0] || adEngine > r[1])) return false;
    }
    // Engine power
    if (enginePowerFrom || enginePowerTo) {
      const adPower = parseEnginePowerValue(c.enginePower || c._raw?.enginePower);
      if (adPower === null) return false;
      if (enginePowerFrom) { const r = parseEnginePowerRange(enginePowerFrom); if (r && adPower < r[0]) return false; }
      if (enginePowerTo) { const r = parseEnginePowerRange(enginePowerTo); if (r && adPower > r[1]) return false; }
    }
    // Battery range
    if (batteryFrom) {
      const adBattery = c.batteryRange || c._raw?.batteryRange;
      if (!adBattery || adBattery !== batteryFrom) return false;
    }
    // Seats
    if (seatsSelected && seatsSelected.length > 0) {
      const seats = String(c.numberOfSeats || c._raw?.numberOfSeats || '');
      if (!seats || !seatsSelected.includes(seats)) return false;
    }
    // Doors
    if (doorsSelected && doorsSelected.length > 0) {
      const doors = String(c.numberOfDoors || c._raw?.numberOfDoors || '');
      if (!doors || !doorsSelected.includes(doors)) return false;
    }
    // Colour
    if (coloursSelected && coloursSelected.length > 0) {
      const colour = (c.colour || c._raw?.colour || '').toLowerCase();
      if (!colour || !coloursSelected.some(col => col.toLowerCase() === colour)) return false;
    }
    // Ownership & History
    if (ownership && ownership.length > 0) {
      const owners = c.previousOwners || c._raw?.previousOwners || '';
      const hasFSH = c.fullServiceHistory || c._raw?.fullServiceHistory;
      const noAcc = c.noAccidents || c._raw?.noAccidents;
      const ownerMatch = ownership.some(o => {
        if (o === '1 owner') return owners === '1';
        if (o === '2 owners') return owners === '2';
        if (o === '3+ owners') return owners === '3+';
        if (o === 'Full service history') return hasFSH;
        if (o === 'No accidents') return noAcc;
        return false;
      });
      if (!ownerMatch) return false;
    }
    // Road TAX
    if (roadTaxFrom || roadTaxTo) {
      const adTax = parseRoadTaxValue(c.roadTax || c._raw?.roadTax);
      if (adTax === null) return false;
      if (roadTaxFrom && adTax < parseInt(roadTaxFrom, 10)) return false;
      if (roadTaxTo && adTax > parseInt(roadTaxTo, 10)) return false;
    }
    // NCT/CVRT
    if (nctFrom || nctTo) {
      const nctExpiry = c.nctExpiry || c._raw?.nctExpiry || '';
      if (!nctExpiry) return false;
      const [m, y] = nctExpiry.split('/');
      if (!m || !y) return false;
      const adDate = new Date(parseInt(y), parseInt(m) - 1);
      if (nctFrom) {
        const [fm, fy] = nctFrom.split('/');
        if (fm && fy && adDate < new Date(parseInt(fy), parseInt(fm) - 1)) return false;
      }
      if (nctTo) {
        const [tm, ty] = nctTo.split('/');
        if (tm && ty && adDate > new Date(parseInt(ty), parseInt(tm) - 1)) return false;
      }
    }
    // Ad type
    if (adType && adType !== 'All') {
      const normalize = (v) => String(v).toLowerCase().replace(/[\s-]+/g, '_');
      const adAdType = (c.adType || c._raw?.adType) || 'for_sale';
      if (normalize(adAdType) !== normalize(adType)) return false;
    }
    // Hero search filters
    if (heroFilters.make && !c.title.toLowerCase().includes(heroFilters.make.toLowerCase())) return false;
    if (heroFilters.model && !c.title.toLowerCase().includes(heroFilters.model.toLowerCase())) return false;
    if (heroFilters.minYear && c.year && c.year < parseInt(heroFilters.minYear)) return false;
    if (heroFilters.maxYear && c.year && c.year > parseInt(heroFilters.maxYear)) return false;
    if (heroFilters.minPrice) {
      const min = parsePrice(heroFilters.minPrice);
      if (min && cPrice !== null && cPrice < min) return false;
    }
    if (heroFilters.maxPrice) {
      const max = parsePrice(heroFilters.maxPrice);
      if (max && cPrice !== null && cPrice > max) return false;
    }
    if (heroFilters.bodyType) {
      const bt = heroFilters.bodyType.toLowerCase();
      const cBodyType = (c.bodyType || c._raw?.bodyType || '').toLowerCase();
      if (cBodyType && cBodyType !== bt) return false;
    }
    return true;
  };

  const matchesVehicle = (c, v) => {
    const makeMatch = !v.make || c.title.toLowerCase().includes(v.make.toLowerCase());
    const modelMatch = !v.model || c.title.toLowerCase().includes(v.model.toLowerCase());
    const bodyMatch = !v.bodyType || (c.bodyType || '').toLowerCase().includes(v.bodyType.toLowerCase());
    return makeMatch && modelMatch && bodyMatch;
  };

  const allFiltered = activeVehicles.length > 0 ?
  allListings.filter((c) => matchesSearch(c) && matchesFilters(c) && activeVehicles.some((v) => matchesVehicle(c, v))) :
  allListings.filter((c) => matchesSearch(c) && matchesFilters(c));

  const totalPages = Math.ceil(allFiltered.length / ITEMS_PER_PAGE);
  const paginated = allFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page) => {setCurrentPage(page);window.scrollTo({ top: 0, behavior: 'smooth' });};
  const handleRefresh = async () => { setRefetchKey(k => k + 1); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-7xl mx-auto px-4 py-4 relative z-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">All Cars</span>
        </div>

        {/* Mobile: title */}
        <h1 className="lg:hidden text-xl font-bold text-foreground mb-3">All Cars For Sale</h1>

        {/* Desktop: title */}
        <div className="hidden lg:flex items-center gap-8 mb-3">
          <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">All Cars For Sale</h1>
        </div>

        {/* Hero filter chips */}
        {Object.values(heroFilters).some(v => v) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {heroFilters.make && <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">Make: {heroFilters.make}</span>}
            {heroFilters.model && <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">Model: {heroFilters.model}</span>}
            {(heroFilters.minYear || heroFilters.maxYear) && <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">Year: {heroFilters.minYear || '—'} – {heroFilters.maxYear || '—'}</span>}
            {(heroFilters.minPrice || heroFilters.maxPrice) && <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">Price: {heroFilters.minPrice || '—'} – {heroFilters.maxPrice || '—'}</span>}
            {heroFilters.bodyType && <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">Body: {heroFilters.bodyType}</span>}
          </div>
        )}

        {/* Banner */}
        <div className="mb-6 rounded-xl overflow-hidden border border-border h-36 sm:h-44 bg-card z-0 relative">
          <img src="/img/99b14da02_generated_image.jpg" alt="All Cars For Sale Banner" className="w-full h-full object-cover" />
        </div>

        {/* Mobile: search + help text + filters below banner */}
        <div className="lg:hidden mb-5">
          <div className="relative mt-3 mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Cars"
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-border" />
          </div>
          <p className="text-foreground text-base text-center mb-3">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <button onClick={() => setMobileFiltersOpen(true)} className="flex items-center gap-2 bg-primary text-white rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0 min-h-[44px]">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        {/* Desktop: search + help text below banner */}
        <div className="hidden lg:flex items-center gap-8 mb-5">
          <div className="relative flex-1 max-w-[35%]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Cars"
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-foreground outline-none" />
          </div>
          <p className="text-foreground text-base flex-1 text-right">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
        </div>

        {/* Mobile filters drawer */}
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-0 [&>button]:hidden">
            <div className="sticky top-0 z-10 bg-background" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
              <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3 space-y-0">
                <SheetTitle className="text-base font-bold">Filters</SheetTitle>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-1.5 text-foreground hover:bg-secondary rounded-md transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </SheetHeader>
            </div>
            <div className="p-4">
              <FiltersSidebar onFilterChange={(f) => { setActiveFilters(f); setCurrentPage(1); }} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0 self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <FiltersSidebar onFilterChange={(f) => { setActiveFilters(f); setCurrentPage(1); }} />
          </aside>

          {/* Listings */}
          <div className="flex-1 min-w-0 min-h-[calc(100vh+4rem)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{allFiltered.length.toLocaleString()}</span> cars in Ireland
              </p>
            </div>

            {allFiltered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">No cars found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
            <div className="flex flex-col gap-4">
              {paginated.map(({ monthly: _monthly, sellerRating: _sr, trusted: _t, sellerType: _st, ...car }) => {
                const listingItem = { ...car, dealer: car.dealerName, price: `€${car.price.toLocaleString()}` };
                return (
                  <ListingCard
                    key={car.id}
                    item={listingItem}
                    saved={isFavorite(car.id)}
                    onToggleSave={() => toggleFavorite(listingItem)}
                    viewMode="list" />
                );
              })}
            </div>
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>
      </PullToRefresh>

      <Footer />
    </div>);

}