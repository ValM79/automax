import React, { useState } from 'react';
import BackButton from '../components/automarket/BackButton';
import { useUserAds, userAdToListingItem } from '../hooks/useUserAds';
import { useFavorites } from '../hooks/useFavorites';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ArrowLeft } from 'lucide-react';
import ListingCard from '../components/automarket/ListingCard';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import SimpleFiltersSidebar from '../components/automarket/SimpleFiltersSidebar';
import Pagination from '../components/automarket/Pagination';
import MobileCategoryFilters from '../components/automarket/MobileCategoryFilters';

const ITEMS_PER_PAGE = 12;

const listings = [];


export default function BikesBicycles() {
  const [search, setSearch] = useState('');
  const { isFavorite, toggleFavorite } = useFavorites();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState({});
  const userAds = useUserAds(['Bikes & Bicycles']);

  const normalizedUserAds = userAds.map(ad => ({ ...userAdToListingItem(ad), isUserAd: true }));
  const allListings = [...normalizedUserAds, ...listings];

  const parsePrice = (str) => str ? parseInt(str.replace(/[€,]/g, ''), 10) : null;
  const allFiltered = allListings.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !(item.location || '').toLowerCase().includes(search.toLowerCase())) return false;
    const { county, priceFrom, priceTo, yearFrom, yearTo, sellerTypes } = activeFilters;
    if (county && county !== 'All Ireland' && !(item.location || '').toLowerCase().includes(county.replace('Co. ', '').toLowerCase())) return false;
    const itemPrice = parsePrice(typeof item.price === 'string' ? item.price : String(item.price || ''));
    if (priceFrom && itemPrice && itemPrice < parsePrice(priceFrom)) return false;
    if (priceTo && itemPrice && itemPrice > parsePrice(priceTo)) return false;
    if (yearFrom && item.year && parseInt(item.year) < parseInt(yearFrom)) return false;
    if (yearTo && item.year && parseInt(item.year) > parseInt(yearTo)) return false;
    if (sellerTypes && sellerTypes.length > 0 && !sellerTypes.some(s => (item.sellerType || '').toLowerCase().includes(s.toLowerCase()))) return false;
    if (activeFilters.adType && activeFilters.adType !== 'All') { const _n = (v) => String(v || '').toLowerCase().replace(/[\s-]+/g, '_'); if (_n(item.adType || (item._raw && item._raw.adType) || 'for_sale') !== _n(activeFilters.adType)) return false; }
    return true;
  });
  const totalPages = Math.ceil(allFiltered.length / ITEMS_PER_PAGE);
  const filtered = allFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const handlePageChange = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Bikes & Bicycles</span>
        </div>
        <div className="mb-5">
          <div className="flex items-center gap-8 mb-3">
            <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">Bikes & Bicycles</h1>
          </div>
        </div>
        <div className="mb-6 rounded-xl overflow-hidden border border-border h-36 sm:h-44 bg-card">
          <img src="/img/8ded1f6ff_generated_image.jpg" alt="Bikes & Bicycles Banner" className="w-full h-full object-cover" />
        </div>
        {/* Mobile: search + help text + filters */}
        <MobileCategoryFilters search={search} onSearchChange={(e) => setSearch(e.target.value)} placeholder="Search Bikes & Bicycles">
          <SimpleFiltersSidebar dealerLabel="Trader" hideYear alwaysOpen onFilterChange={(f) => { setActiveFilters(f); setCurrentPage(1); }} />
        </MobileCategoryFilters>

        {/* Desktop: search + help text */}
        <div className="hidden lg:flex items-center gap-8 mb-5">
          <div className="relative flex-1 max-w-[35%]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Bikes & Bicycles"
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-foreground outline-none" />
          </div>
          <p className="text-foreground text-base flex-1 text-right">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
        </div>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-80 flex-shrink-0 self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <SimpleFiltersSidebar dealerLabel="Trader" hideYear alwaysOpen onFilterChange={(f) => { setActiveFilters(f); setCurrentPage(1); }} />
          </aside>
          <div className="flex-1 min-w-0 min-h-[calc(100vh+4rem)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{allFiltered.length.toLocaleString()}</span> ads for Bikes & Bicycles in Ireland</p>

            </div>
            <div className="flex flex-col gap-4">
              {filtered.map((item) =>
              <ListingCard key={item.id} item={item} saved={isFavorite(item.id)} onToggleSave={() => toggleFavorite(item)} viewMode="list" />
              )}
              {filtered.length === 0 && <div className="text-center py-16 text-muted-foreground"><p className="text-lg font-medium">No bikes found</p><p className="text-sm mt-1">Try adjusting your search</p></div>}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>
      <Footer />
    </div>);

}