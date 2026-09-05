import React, { useState } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link } from 'react-router-dom';
import PromoBanner from '../components/automarket/PromoBanner';
import { Search, ChevronDown, ArrowLeft } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import FiltersSidebar from '../components/automarket/FiltersSidebar';
import ListingCard from '../components/automarket/ListingCard';
import Pagination from '../components/automarket/Pagination';
import MobileCategoryFilters from '../components/automarket/MobileCategoryFilters';
import { useUserAds, userAdToListingItem } from '../hooks/useUserAds';
import { useFavorites } from '../hooks/useFavorites';

const ITEMS_PER_PAGE = 12;


const listings = [];


export default function NewCarListings() {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({ vehicles: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const { isFavorite, toggleFavorite } = useFavorites();
  const userAds = useUserAds(['New Cars']);

  const activeVehicles = (activeFilters.vehicles || []).filter((v) => v.make);

  const matchesSearch = (l) => !search || l.title.toLowerCase().includes(search.toLowerCase());
  const matchesVehicle = (l, v) => {
    const makeMatch = !v.make || l.title.toLowerCase().includes(v.make.toLowerCase());
    const modelMatch = !v.model || l.title.toLowerCase().includes(v.model.toLowerCase());
    return makeMatch && modelMatch;
  };

  const _normAdType = (v) => String(v || '').toLowerCase().replace(/[\s-]+/g, '_');
  const matchesAdType = (l) => !activeFilters.adType || activeFilters.adType === 'All' || _normAdType(l.adType || (l._raw && l._raw.adType) || 'for_sale') === _normAdType(activeFilters.adType);

  // Normalize user ads and prepend them to static listings for unified pagination
  const normalizedUserAds = userAds.map(ad => ({
    ...userAdToListingItem(ad),
    isUserAd: true,
    _raw: ad,
    images: ad.photos || [],
    dealerType: ad.isTrader ? 'Trader' : 'Private Seller',
    dealerRating: null,
  }));

  const allListings = [...normalizedUserAds, ...listings];

  const allFiltered = activeVehicles.length > 0 ?
  allListings.filter((l) => matchesSearch(l) && matchesAdType(l) && activeVehicles.some((v) => matchesVehicle(l, v))) :
  allListings.filter((l) => matchesSearch(l) && matchesAdType(l));

  const totalPages = Math.ceil(allFiltered.length / ITEMS_PER_PAGE);
  const paginated = allFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

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
          <span className="text-foreground font-medium">New Cars</span>
        </div>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-8 mb-3">
            <h1 className="text-2xl font-bold text-foreground whitespace-nowrap">New Cars For Sale</h1>
          </div>
        </div>

        <PromoBanner image="/img/b29eb1163_generated_image.jpg" />

        {/* Mobile: search + help text + filters */}
        <MobileCategoryFilters search={search} onSearchChange={handleSearchChange} placeholder="Search Cars">
          <FiltersSidebar onFilterChange={setActiveFilters} />
        </MobileCategoryFilters>

        {/* Desktop: search + help text */}
        <div className="hidden lg:flex items-center gap-8 mb-5">
          <div className="relative flex-1 max-w-[35%]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search Cars"
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-foreground outline-none" />
          </div>
          <p className="text-foreground text-base flex-1 text-right">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0 self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <FiltersSidebar onFilterChange={setActiveFilters} />
          </aside>

          {/* Listings */}
          <div className="flex-1 min-w-0 min-h-[calc(100vh+4rem)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{allFiltered.length.toLocaleString()}</span> cars in Ireland
              </p>

            </div>

            {allFiltered.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">No listings found.</p>
            )}

            <div className="flex flex-col gap-4">
              {paginated.map((listing) => (
                <ListingCard
                  key={listing.id}
                  item={{
                    ...listing,
                    dealer: listing.dealer,
                    dealerLogo: listing.dealerLogo,
                    image: listing.isUserAd ? listing.image : listing.images?.[0],
                    images: [],
                    sellerType: listing.isUserAd ? listing.sellerType : listing.dealerType,
                    sellerRating: listing.isUserAd ? null : listing.dealerRating,
                  }}
                  saved={isFavorite(listing.id)}
                  onToggleSave={() => toggleFavorite({ ...listing, image: listing.isUserAd ? listing.image : listing.images?.[0] })}
                  viewMode="list" />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange} />
            
          </div>
        </div>
      </div>

      <Footer />
    </div>);

}