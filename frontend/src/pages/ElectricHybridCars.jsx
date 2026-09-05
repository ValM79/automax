import React, { useState, useEffect, useMemo } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link, useLocation } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import PromoBanner from '../components/automarket/PromoBanner';
import { Search, ArrowLeft } from 'lucide-react';
import ListingCard from '../components/automarket/ListingCard';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import FiltersSidebar from '../components/automarket/FiltersSidebar';
import Pagination from '../components/automarket/Pagination';
import MobileCategoryFilters from '../components/automarket/MobileCategoryFilters';
import { useUserAds, userAdToListingItem } from '../hooks/useUserAds';
const carListings = [];

const ITEMS_PER_PAGE = 12;

// Subsections that may contain electric / hybrid cars
const CARS_SUBSECTIONS = ['Cars', 'New Cars', 'Cars from Dealerships', 'Vintage Cars', 'Modified Cars', 'Rally Cars', 'Breaking & Repairables', 'Electric & Hybrid Cars'];

const isElectricOrHybrid = (fuel) => {
  if (!fuel) return false;
  const f = fuel.toLowerCase();
  return f.includes('electric') || f.includes('hybrid');
};

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

export default function ElectricHybridCars() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({ vehicles: [] });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('q') || '');
    setCurrentPage(1);
  }, [location.search]);

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
  const userAds = useUserAds(CARS_SUBSECTIONS);

  const activeVehicles = (activeFilters.vehicles || []).filter((v) => v.make);

  const parsePrice = (str) => str ? parseInt(str.replace(/[€,]/g, ''), 10) : null;
  const parseMileage = (str) => str ? parseInt(str.replace(/[, km]/g, ''), 10) : null;

  // Normalize user ads — only electric / hybrid fuel types — no rating, trusted or dealer info
  const normalizedUserAds = userAds
    .filter((ad) => isElectricOrHybrid(ad.vehicleFuel))
    .map((ad) => ({
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
      image: (ad.photos && ad.photos[0]) || 'https://images.unsplash.com/photo-1560958089-b8a63019b834?w=600&q=80',
      spotlight: ad.spotlight,
      sellerType: ad.isTrader ? 'Trader' : 'Private Seller',
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

  const allListings = [...normalizedUserAds, ...carListings];

  const matchesSearch = (c) => !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.location || '').toLowerCase().includes(search.toLowerCase());

  const matchesFilters = (c) => {
    const { yearFrom, yearTo, priceFrom, priceTo, mileageFrom, mileageTo, fuelSelected, county, transSelected, bodySelected, sellerTypes, engineSize, enginePowerFrom, enginePowerTo, batteryFrom, batteryTo, batteryRangeFrom, batteryRangeTo, seatsSelected, doorsSelected, coloursSelected, ownership, roadTaxFrom, roadTaxTo, nctFrom, nctTo } = activeFilters;
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
    if (transSelected && transSelected.length > 0) {
      const trans = c.transmission || c._raw?.vehicleTransmission;
      if (!trans || !transSelected.some(t => t.toLowerCase() === trans.toLowerCase())) return false;
    }
    if (bodySelected && bodySelected.length > 0) {
      const bt = (c.bodyType || c._raw?.bodyType || '').toLowerCase();
      if (!bt || !bodySelected.some(b => b.toLowerCase() === bt)) return false;
    }
    if (sellerTypes && sellerTypes.length > 0) {
      const st = (c.sellerType || '').toLowerCase();
      const sellerMatch = sellerTypes.some(s => {
        if (s === 'Dealership') return st.includes('dealer') || st.includes('trader');
        if (s === 'Private seller') return st.includes('private');
        return false;
      });
      if (!sellerMatch) return false;
    }
    if (engineSize) {
      const adEngine = parseEngineSizeValue(c.engineSize || c._raw?.engineSize);
      if (adEngine === null) return false;
      const r = parseEngineSizeRange(engineSize);
      if (r && (adEngine < r[0] || adEngine > r[1])) return false;
    }
    if (enginePowerFrom || enginePowerTo) {
      const adPower = parseEnginePowerValue(c.enginePower || c._raw?.enginePower);
      if (adPower === null) return false;
      if (enginePowerFrom) { const r = parseEnginePowerRange(enginePowerFrom); if (r && adPower < r[0]) return false; }
      if (enginePowerTo) { const r = parseEnginePowerRange(enginePowerTo); if (r && adPower > r[1]) return false; }
    }
    if (batteryRangeFrom || batteryRangeTo) {
      const adRange = parseInt(String(c.batteryRange || c._raw?.batteryRange || '').match(/(\d+)/)?.[1] || '0', 10);
      if (adRange === 0) return false;
      if (batteryRangeFrom) {
        const r = parseInt(batteryRangeFrom.match(/(\d+)/)?.[1] || '0', 10);
        if (r && adRange < r) return false;
      }
      if (batteryRangeTo) {
        if (batteryRangeTo.includes('+')) { /* no upper bound */ }
        else { const r = parseInt(batteryRangeTo.match(/(\d+)/)?.[1] || '0', 10); if (r && adRange > r) return false; }
      }
    }
    if (batteryFrom || batteryTo) {
      const adSize = parseInt(String(c.engineSize || c._raw?.engineSize || '').match(/(\d+)/)?.[1] || '0', 10);
      if (adSize === 0) return false;
      if (batteryFrom) {
        if (batteryFrom.includes('+')) { const r = parseInt(batteryFrom.match(/(\d+)/)?.[1] || '0', 10); if (adSize < r) return false; }
        else { const r = parseInt(batteryFrom.match(/(\d+)/)?.[1] || '0', 10); if (adSize < r) return false; }
      }
      if (batteryTo) {
        if (batteryTo.includes('+')) { /* no upper bound */ }
        else { const r = parseInt(batteryTo.match(/(\d+)/)?.[1] || '0', 10); if (adSize > r) return false; }
      }
    }
    if (seatsSelected && seatsSelected.length > 0) {
      const seats = String(c.numberOfSeats || c._raw?.numberOfSeats || '');
      if (!seats || !seatsSelected.includes(seats)) return false;
    }
    if (doorsSelected && doorsSelected.length > 0) {
      const doors = String(c.numberOfDoors || c._raw?.numberOfDoors || '');
      if (!doors || !doorsSelected.includes(doors)) return false;
    }
    if (coloursSelected && coloursSelected.length > 0) {
      const colour = (c.colour || c._raw?.colour || '').toLowerCase();
      if (!colour || !coloursSelected.some(col => col.toLowerCase() === colour)) return false;
    }
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
    if (roadTaxFrom || roadTaxTo) {
      const adTax = parseRoadTaxValue(c.roadTax || c._raw?.roadTax);
      if (adTax === null) return false;
      if (roadTaxFrom && adTax < parseInt(roadTaxFrom, 10)) return false;
      if (roadTaxTo && adTax > parseInt(roadTaxTo, 10)) return false;
    }
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
    if (activeFilters.adType && activeFilters.adType !== 'All') { const _n = (v) => String(v || '').toLowerCase().replace(/[\s-]+/g, '_'); if (_n(c.adType || (c._raw && c._raw.adType) || 'for_sale') !== _n(activeFilters.adType)) return false; }
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

  const handlePageChange = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-4 relative z-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Electric & Hybrid Cars</span>
        </div>

        {/* Title + Search */}
        <div className="mb-5">
          <div className="flex items-center gap-8 mb-3">
            <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">Electric & Hybrid Cars</h1>
          </div>
          {Object.values(heroFilters).some(v => v) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {heroFilters.make && <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">Make: {heroFilters.make}</span>}
              {heroFilters.model && <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">Model: {heroFilters.model}</span>}
              {(heroFilters.minYear || heroFilters.maxYear) && <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">Year: {heroFilters.minYear || '—'} – {heroFilters.maxYear || '—'}</span>}
              {(heroFilters.minPrice || heroFilters.maxPrice) && <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">Price: {heroFilters.minPrice || '—'} – {heroFilters.maxPrice || '—'}</span>}
              {heroFilters.bodyType && <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">Body: {heroFilters.bodyType}</span>}
            </div>
          )}
        </div>

        <div className="z-0 relative">
          <PromoBanner image="/img/4a947c627_generated_image.jpg" />
        </div>

        {/* Mobile: search + help text + filters */}
        <MobileCategoryFilters search={search} onSearchChange={(e) => setSearch(e.target.value)} placeholder="Search Green Cars">
          <FiltersSidebar onFilterChange={setActiveFilters} hideFuelType hideTransmission />
        </MobileCategoryFilters>

        {/* Desktop: search + help text */}
        <div className="hidden lg:flex items-center gap-8 mb-5">
          <div className="relative flex-1 max-w-[35%]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Green Cars"
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-foreground outline-none" />
          </div>
          <p className="text-foreground text-base flex-1 text-right">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0 self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <FiltersSidebar onFilterChange={setActiveFilters} hideFuelType hideTransmission />
          </aside>

          {/* Listings */}
          <div className="flex-1 min-w-0 min-h-[calc(100vh+4rem)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{allFiltered.length.toLocaleString()}</span> cars in Ireland
              </p>
            </div>

            {allFiltered.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">No listings found. Try adjusting your search or filters.</p>
            )}

            <div className="flex flex-col gap-4">
              {paginated.map((car) => {
                if (car.isUserAd) {
                  const item = userAdToListingItem(car._raw);
                  // Strip rating, trusted and dealer info
                  const cleanItem = { ...item, sellerRating: undefined, trusted: undefined, dealer: undefined, dealerName: undefined, dealerLogo: undefined, dealerType: undefined };
                  return (
                    <ListingCard
                      key={`user-${car.id}`}
                      item={cleanItem}
                      saved={isFavorite(car.id)}
                      onToggleSave={() => toggleFavorite(cleanItem)}
                      viewMode="list" />
                  );
                }
                const listingItem = { ...car, price: `€${car.price.toLocaleString()}` };
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
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>

      <Footer />
    </div>);
}