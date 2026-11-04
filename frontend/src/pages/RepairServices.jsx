import React, { useState } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ListingCard from '../components/automarket/ListingCard';
import { useUserAds, userAdToListingItem } from '../hooks/useUserAds';
import { useFavorites } from '../hooks/useFavorites';

// One page for both repair categories ("HGV Repair & Servicing" and "Auto Repair & Servicing"); App.jsx passes the category name.
// There is no way to place a listing in these categories yet, so for now the page only shows ads that carry the category name.
export default function RepairServices({ category }) {
  const [search, setSearch] = useState('');
  const { isFavorite, toggleFavorite } = useFavorites();
  const userAds = useUserAds([category]);
  const q = search.trim().toLowerCase();
  const items = userAds
    .map((ad) => ({ ...userAdToListingItem(ad), isUserAd: true, _raw: ad }))
    .filter((item) => !q || item.title.toLowerCase().includes(q) || (item.location || '').toLowerCase().includes(q));
  const placeholder = `Search ${category}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">{category}</span>
        </div>

        {/* Mobile: Title */}
        <h1 className="lg:hidden text-xl font-bold text-foreground mb-3">{category}</h1>

        {/* Desktop: Title */}
        <h1 className="hidden lg:block text-2xl font-bold text-foreground whitespace-nowrap mb-5">{category}</h1>

        {/* Mobile: Search + help text */}
        <div className="lg:hidden mb-5">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-border" />
          </div>
          <p className="text-foreground text-base text-center">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
        </div>

        {/* Desktop: Search + help text */}
        <div className="hidden lg:flex items-center gap-8 mb-5">
          <div className="relative flex-1 max-w-[35%]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-foreground outline-none" />
          </div>
          <p className="text-foreground text-base flex-1 text-right">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
        </div>

        {items.length > 0 ? (
          <div className="flex flex-col gap-4 mb-8">
            {items.map((item) => (
              <ListingCard key={item.id} item={item} saved={isFavorite(item.id)} onToggleSave={() => toggleFavorite(item)} viewMode="list" />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm mb-8">No listings yet.</p>
        )}
      </div>

      <Footer />
    </div>
  );
}
