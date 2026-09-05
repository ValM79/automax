import React, { useState } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ArrowLeft } from 'lucide-react';
import ListingCard from '../components/automarket/ListingCard';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import FiltersSidebar from '../components/automarket/FiltersSidebar';
import Pagination from '../components/automarket/Pagination';
import MobileCategoryFilters from '../components/automarket/MobileCategoryFilters';
import { useUserAds, userAdToListingItem } from '../hooks/useUserAds';

const ITEMS_PER_PAGE = 12;

const dealerListings = [];




export default function DealershipCars() {
  const [search, setSearch] = useState('');
  const [savedIds, setSavedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState({});
  const userAds = useUserAds(['Dealership Cars', 'Cars from Dealerships']);

  const toggleSave = (id) => setSavedIds((prev) =>
  prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
  );

  const normalizedUserAds = userAds.map((ad) => ({ ...userAdToListingItem(ad), isUserAd: true, _raw: ad }));
  const allListings = [...normalizedUserAds, ...dealerListings];

  const allFiltered = allListings.filter((c) => {
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.dealerName || c.dealer || '').toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilters.adType && activeFilters.adType !== 'All') { const _n = (v) => String(v || '').toLowerCase().replace(/[\s-]+/g, '_'); if (_n(c.adType || (c._raw && c._raw.adType) || 'for_sale') !== _n(activeFilters.adType)) return false; }
    return true;
  });
  const totalPages = Math.ceil(allFiltered.length / ITEMS_PER_PAGE);
  const filtered = allFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const handlePageChange = (page) => {setCurrentPage(page);window.scrollTo({ top: 0, behavior: 'smooth' });};

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
          <span className="text-foreground font-medium">Dealership Cars</span>
        </div>

        {/* Title + Search */}
        <div className="mb-5">
          <div className="flex items-center gap-8 mb-3">
            <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">Dealership Cars</h1>
          </div>
        </div>

        <div className="mb-6 rounded-xl overflow-hidden h-36 sm:h-44 bg-card">
          <img src="/img/927787060_generated_image.jpg" alt="Dealership Cars Banner" className="w-full h-full object-cover" />
        </div>

        {/* Mobile: search + help text + filters */}
        <MobileCategoryFilters search={search} onSearchChange={(e) => setSearch(e.target.value)} placeholder="Search Cars">
          <FiltersSidebar onFilterChange={setActiveFilters} />
        </MobileCategoryFilters>

        {/* Desktop: search + help text */}
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

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0 self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <FiltersSidebar onFilterChange={setActiveFilters} />
          </aside>

          {/* Listings */}
          <div className="flex-1 min-w-0 min-h-[calc(100vh+4rem)]">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{allFiltered.length.toLocaleString()}</span> cars in Ireland
              </p>

            </div>

            <div className="flex flex-col gap-4">
              {filtered.map((car) =>
              <ListingCard
                key={car.id}
                item={car.isUserAd ? car : {
                  ...car,
                  dealer: car.dealerName,
                  sellerType: car.dealerType,
                  sellerRating: car.dealerRating,
                  trusted: (car.dealerType || '').includes('Trusted'),
                  price: typeof car.price === 'number' ? `€${car.price.toLocaleString()}` : car.price
                }}
                saved={savedIds.includes(car.id)}
                onToggleSave={toggleSave}
                viewMode="list" />

              )}
              {filtered.length === 0 &&
              <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg font-medium">No dealership cars found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              }
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>

      <Footer />
    </div>);

}