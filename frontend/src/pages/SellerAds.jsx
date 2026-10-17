import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Phone, Clock, Building2 } from 'lucide-react';
import BackButton from '../components/automarket/BackButton';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ListingCard from '../components/automarket/ListingCard';
import AvatarBadge from '../components/automarket/AvatarBadge';
import { useFavorites } from '../hooks/useFavorites';
import { api } from '@/api/apiClient';

const BANNER = '/img/b29eb1163_generated_image.jpg'; // used behind the dealer's name when they have not added a photo
const DAY_MS = 24 * 60 * 60 * 1000;

// Every kind of car section is one "Cars" section, the same grouping the Dealers Garage cards use.
const CAR_SUBSECTIONS = new Set([
  'Cars', 'New Cars', 'Dealers Garage', 'Dealership Cars', 'Cars from Dealerships', 'Electric & Hybrid Cars',
  'Vintage Cars', 'Modified Cars', 'Rally Cars', 'Breaking & Repairables',
]);
const sectionOf = (subsection) => (CAR_SUBSECTIONS.has(subsection) ? 'Cars' : (subsection || 'Other'));

const TABS = [
  { id: 'stock', label: 'Our Stock' },
  { id: 'contact', label: 'Contact Us' },
  { id: 'reviews', label: 'Reviews' },
];

const inputClass = 'w-full h-11 px-3 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin" />
    </div>
  );
}

// A seller's page: a dealer or trader gets a banner (their photo, logo, name, location) with Our Stock / Contact Us /
// Reviews tabs; a private seller gets a plain page with their live ads.
export default function SellerAds() {
  const { sellerId } = useParams();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [ads, setAds] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stock');
  const [section, setSection] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [phoneShown, setPhoneShown] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false); // on a phone the filters start folded so the ads are not pushed down

  useEffect(() => {
    if (!sellerId) return;
    let alive = true;
    setLoading(true);
    setTab('stock'); setSection(''); setMinPrice(''); setMaxPrice(''); setSort('newest'); setPhoneShown(false);
    const loadAds = api.entities.UserAd.filter({ created_by_id: sellerId, status: 'active' }, '-created_date', 200)
      .then((records) => {
        const now = Date.now();
        return records
          .filter((ad) => !(ad.listingDays && ad.created_date && now > new Date(ad.created_date).getTime() + Number(ad.listingDays) * DAY_MS))
          .map((ad) => ({
            id: ad.id,
            title: ad.title,
            price: `€${ad.price}`,
            priceNum: Number(String(ad.price ?? '').replace(/[^0-9.]/g, '')) || 0,
            mileage: ad.mileage,
            location: ad.location,
            viewCount: ad.view_count ?? null,
            year: ad.vehicleYear,
            engine: ad.vehicleFuel,
            image: (ad.photos && ad.photos[0]) || null,
            images: ad.photos || [],
            photos: ad.photos ? ad.photos.length : 1,
            sellerType: ad.isTrader ? (ad.sellerKind === 'dealer' ? 'Dealer' : 'Trader') : 'Private Seller',
            isTrader: ad.isTrader === true,
            spotlight: ad.spotlight,
            description: ad.description,
            fullName: ad.fullName,
            businessName: ad.businessName,
            email: ad.email,
            phone: ad.phone,
            sellerId: ad.created_by_id,
            created_date: ad.created_date,
            section: sectionOf(ad.subsection),
          }));
      })
      .catch(() => []);
    const loadStats = api.functions.invoke('getSellerStats', { seller_id: sellerId })
      .then((res) => res?.data || null)
      .catch(() => null);
    Promise.all([loadAds, loadStats]).then(([a, s]) => {
      if (!alive) return;
      setAds(a);
      setStats(s && !s.error ? s : null);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [sellerId]);

  const isBusiness = ['trader', 'dealer'].includes(stats?.seller_type) || ads.some((a) => a.isTrader);
  const name = isBusiness
    ? (stats?.business_name || ads.find((a) => a.businessName)?.businessName || 'Dealership')
    : (ads.find((a) => a.fullName)?.fullName || 'Private Seller');
  const place = [stats?.county, stats?.area].filter(Boolean).join(', ');

  const sections = useMemo(() => {
    const counts = new Map();
    ads.forEach((a) => counts.set(a.section, (counts.get(a.section) || 0) + 1));
    return [...counts.entries()].sort((a, b) => (a[0] === 'Cars' ? -1 : b[0] === 'Cars' ? 1 : a[0].localeCompare(b[0])));
  }, [ads]);

  const shown = useMemo(() => {
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);
    const list = ads.filter((a) => (
      (!section || a.section === section) &&
      (min === null || a.priceNum >= min) &&
      (max === null || a.priceNum <= max)
    ));
    if (sort === 'price-low') list.sort((a, b) => a.priceNum - b.priceNum);
    else if (sort === 'price-high') list.sort((a, b) => b.priceNum - a.priceNum);
    return list; // newest first is the order the ads arrive in
  }, [ads, section, minPrice, maxPrice, sort]);

  const filtersOn = !!(section || minPrice || maxPrice);
  const resetFilters = () => { setSection(''); setMinPrice(''); setMaxPrice(''); };

  const phone = stats?.phone || ads.find((a) => a.phone)?.phone || '';
  const phoneButton = (
    <button
      type="button"
      onClick={() => setPhoneShown(true)}
      disabled={!phone}
      className="w-full h-11 border border-primary text-primary bg-card rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
      <Phone className="w-4 h-4" /> {phone ? (phoneShown ? phone : 'Show phone number') : 'No phone number'}
    </button>
  );

  const adList = (list) => (
    <div className="space-y-4">
      {list.map((ad) => (
        <ListingCard key={ad.id} item={ad} saved={isFavorite(ad.id)} onToggleSave={() => toggleFavorite(ad)} />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1"><Spinner /></div>
        <Footer />
      </div>
    );
  }

  // A private seller: the plain page.
  if (!isBusiness) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
            <BackButton />
            <span>›</span>
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>›</span>
            <span className="text-foreground font-medium">Seller Ads</span>
          </div>
          <div className="flex items-center gap-4 mb-6">
            <AvatarBadge url={stats?.avatar_url} isTrader={false} className="w-16 h-16" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{name}</h1>
              <p className="text-sm text-muted-foreground">Private seller · {ads.length} {ads.length === 1 ? 'ad' : 'ads'}</p>
            </div>
          </div>
          {ads.length === 0
            ? <p className="text-muted-foreground text-center py-20">No ads found from this seller.</p>
            : adList(ads)}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Banner: the dealer's own photo (or our default picture) with their logo, name and location */}
      <div className="relative">
        <img src={stats?.cover_url || BANNER} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative w-full max-w-6xl mx-auto px-4 pt-4 pb-8 sm:pb-10 text-white">
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/85 mb-6 sm:mb-10">
            <BackButton fallback="/dealers-garage" className="flex items-center gap-1 hover:text-white transition-colors" />
            <span>›</span>
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <Link to="/dealers-garage" className="hover:text-white transition-colors">Dealers Garage</Link>
            <span>›</span>
            <span className="text-white">{name}</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-5">
            {stats?.avatar_url && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                <img src={stats.avatar_url} alt="" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold break-words">{name}</h1>
              <p className="mt-1.5 text-sm sm:text-base text-white/90 flex flex-wrap items-center gap-x-4 gap-y-1">
                {place && <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {place}</span>}
                {stats?.trusted && <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Verified Dealer</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="w-full max-w-6xl mx-auto px-4 flex justify-center gap-8 sm:gap-14" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`py-4 text-base sm:text-lg border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-foreground text-foreground font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        {tab === 'stock' && (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            <aside>
              <div className="flex items-baseline justify-between pb-3 border-b border-border">
                <h2 className="text-2xl font-bold text-foreground">Filters</h2>
                <span className="flex items-baseline gap-4">
                  {filtersOn && <button type="button" onClick={resetFilters} className="text-sm text-primary font-medium hover:underline">Reset All</button>}
                  <button type="button" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} className="lg:hidden text-sm text-primary font-medium hover:underline">{filtersOpen ? 'Hide' : 'Show'}</button>
                </span>
              </div>

              <div className={`${filtersOpen ? '' : 'hidden'} lg:block`}>
              <p className="text-sm text-muted-foreground mt-5 mb-2">Section</p>
              <div className="flex flex-col gap-1.5">
                {[['', ads.length], ...sections].map(([label, count]) => {
                  const active = section === label;
                  return (
                    <button
                      key={label || 'all'}
                      type="button"
                      onClick={() => setSection(label)}
                      className={`flex items-center justify-between h-11 px-4 rounded-lg text-sm text-left transition-colors ${active ? 'border-2 border-foreground font-semibold text-foreground' : 'border border-transparent text-foreground hover:bg-secondary'}`}>
                      <span>{label || 'All Sections'}</span>
                      <span className="text-muted-foreground font-normal">{count}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-sm text-muted-foreground mt-6 mb-2">Price (€)</p>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" inputMode="numeric" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min Price" className={inputClass} aria-label="Minimum price" />
                <input type="number" inputMode="numeric" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max Price" className={inputClass} aria-label="Maximum price" />
              </div>
              </div>

              <div className="border-t border-border mt-6 pt-5 space-y-4 text-sm">
                {stats?.opening_hours && (
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-4 h-4" /> Opening hours</p>
                    <p className="text-foreground mt-1">{stats.opening_hours}</p>
                  </div>
                )}
                {place && (
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Location</p>
                    <p className="text-foreground mt-1">{place}</p>
                  </div>
                )}
                {phoneButton}
              </div>
            </aside>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-sm text-foreground">
                  <span className="font-bold">{shown.length}</span> {shown.length === 1 ? 'ad' : 'ads'} from <span className="font-bold">{name}</span>{stats?.county ? <> in <span className="font-bold">{stats.county}</span></> : null}
                </p>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Sort by:
                  <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-lg border border-border bg-card text-foreground px-2 text-sm">
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                  </select>
                </label>
              </div>
              {ads.length === 0 ? (
                <p className="text-muted-foreground text-center py-16">This dealership has no live ads right now.</p>
              ) : shown.length === 0 ? (
                <p className="text-muted-foreground text-center py-16">No ads match these filters.</p>
              ) : adList(shown)}
            </section>
          </div>
        )}

        {tab === 'contact' && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-foreground mb-5">Contact {name}</h2>
            <dl className="space-y-5 text-sm">
              <div>
                <dt className="text-muted-foreground flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Address</dt>
                <dd className="text-foreground mt-1">{stats?.business_address || place || 'Not added yet'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-4 h-4" /> Opening hours</dt>
                <dd className="text-foreground mt-1">{stats?.opening_hours || 'Not added yet'}</dd>
              </div>
            </dl>
            <div className="mt-6">{phoneButton}</div>
            <p className="mt-4 text-xs text-muted-foreground">To message this dealership, open one of their ads and press Send message.</p>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-lg font-semibold text-foreground mb-1">No reviews yet</p>
            <p className="text-sm text-muted-foreground">Reviews from buyers will appear here.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
