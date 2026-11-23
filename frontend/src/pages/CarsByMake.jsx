import React, { useState } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link, useParams } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useUserAdsByMake, userAdToListingItem } from '../hooks/useUserAds';
import { Search, ChevronDown, ArrowLeft } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import FiltersSidebar from '../components/automarket/FiltersSidebar';
import ListingCard from '../components/automarket/ListingCard';
import Pagination from '../components/automarket/Pagination';
import MobileCategoryFilters from '../components/automarket/MobileCategoryFilters';
import { MAKES } from '../components/automarket/CarListings';

const ITEMS_PER_PAGE = 12;

const carsByMake = {};

export default function CarsByMake() {
  const { make } = useParams();
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const parsePrice = (str) => str ? parseInt(str.replace(/[€,]/g, ''), 10) : null;

  // Use the real make name from the Browse by Make list ("Mercedes-Benz", "Rolls-Royce"); fall back to the address text.
  const makeDisplay = MAKES.find(m => m.label.toLowerCase().replace(/\s+/g, '-') === make)?.label
    || make?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    || 'Cars';
  const staticListings = carsByMake[make] || [];

  const rawUserAds = useUserAdsByMake(make);
  const userAdListings = rawUserAds.map(ad => userAdToListingItem(ad));

  // Prepend user ads and matching electric/hybrid cars before static listings
  const listings = [
    ...userAdListings,
    ...staticListings,
  ];

  const { isFavorite, toggleFavorite } = useFavorites();

  const matchesFilters = (c) => {
    const { yearFrom, yearTo, priceFrom, priceTo, county, sellerTypes } = activeFilters;
    if (yearFrom && c.year < parseInt(yearFrom)) return false;
    if (yearTo && c.year > parseInt(yearTo)) return false;
    if (priceFrom && c.price < parsePrice(priceFrom)) return false;
    if (priceTo && c.price > parsePrice(priceTo)) return false;
    if (county && county !== 'All Ireland') {
      const loc = (c.location || '').toLowerCase();
      if (!loc.includes(county.replace('Co. ', '').toLowerCase())) return false;
    }
    if (sellerTypes && sellerTypes.length > 0) {
      const st = (c.sellerType || '').toLowerCase();
      const sellerMatch = sellerTypes.some(s => {
        if (s === 'Dealership') return st.includes('dealer') || st.includes('trader') || st.includes('trusted');
        if (s === 'Private seller') return st.includes('private');
        return false;
      });
      if (!sellerMatch) return false;
    }
    if (activeFilters.adType && activeFilters.adType !== 'All') { const _n = (v) => String(v || '').toLowerCase().replace(/[\s-]+/g, '_'); if (_n(c.adType || 'for_sale') !== _n(activeFilters.adType)) return false; }
    return true;
  };

  const allFiltered = listings.filter(c =>
    (!search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.location && c.location.toLowerCase().includes(search.toLowerCase()))) &&
    matchesFilters(c)
  );
  const totalPages = Math.ceil(allFiltered.length / ITEMS_PER_PAGE);
  const filtered = allFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const handlePageChange = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">{makeDisplay}</span>
        </div>

        {/* Mobile: title */}
        <h1 className="lg:hidden text-2xl font-bold text-foreground mb-3">{makeDisplay} Cars For Sale</h1>

        {/* Mobile: search + help text + filters */}
        <MobileCategoryFilters search={search} onSearchChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder={`Search ${makeDisplay}`}>
          <FiltersSidebar fixedMake={makeDisplay} onFilterChange={(f) => { setActiveFilters(f); setCurrentPage(1); }} />
        </MobileCategoryFilters>

        {/* Desktop: title + search + help text */}
        <div className="hidden lg:flex items-center gap-8 mb-5">
          <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">{makeDisplay} Cars For Sale</h1>
          <div className="relative flex-1 max-w-[35%]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder={`Search ${makeDisplay}`}
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-foreground outline-none"
            />
          </div>
          <p className="text-foreground text-base flex-1 text-right">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0 self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <FiltersSidebar fixedMake={makeDisplay} onFilterChange={(f) => { setActiveFilters(f); setCurrentPage(1); }} />
          </aside>

          {/* Listings */}
          <div className="flex-1 min-w-0 min-h-[calc(100vh+4rem)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{allFiltered.length.toLocaleString()}</span> {makeDisplay} cars in Ireland
              </p>

            </div>

            <div className="flex flex-col gap-4">
              {filtered.map(({ monthly: _monthly, sellerRating: _sr, trusted: _t, sellerType: _st, ...car }) => (
                <ListingCard
                  key={car.id}
                  item={{
                    ...car,
                    image: car.image,
                    images: car.images || [],
                    dealer: car.dealer || car.dealerName,
                    price: typeof car.price === 'number' ? `€${car.price.toLocaleString()}` : car.price,
                    engine: car.engine || car.fuel,
                  }}
                  saved={isFavorite(car.id)}
                  onToggleSave={() => toggleFavorite({ ...car, price: typeof car.price === 'number' ? `€${car.price.toLocaleString()}` : car.price })}
                  viewMode="list"
                />
              ))}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}