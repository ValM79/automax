import React, { useState, useEffect, useMemo } from 'react';
import { sellerTypeOf, isBusinessType, accountLabel } from '@/lib/accountType';
import { DAY_KEYS, hasTimes } from '@/lib/openingHours';
import { waysOf, whatsappLink } from '@/lib/contactWays';
import MessageModal from '../components/automarket/MessageModal';
import MobileSelect from '../components/automarket/MobileSelect';
import MakeSelector from '../components/automarket/MakeSelector';
import ModelSelector from '../components/automarket/ModelSelector';
import BodyTypeSelector from '../components/automarket/BodyTypeSelector';
import { priceOptions } from '@/lib/priceOptions';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Phone, Clock, Building2, MessageSquare, MessageCircle, Mail, Plus } from 'lucide-react';
import BackButton from '../components/automarket/BackButton';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ListingCard from '../components/automarket/ListingCard';
import AvatarBadge from '../components/automarket/AvatarBadge';
import { useFavorites } from '../hooks/useFavorites';
import { api } from '@/api/apiClient';

const BANNER = '/img/b29eb1163_generated_image.jpg'; // used behind the dealer's name when they have not added a photo
const DAY_MS = 24 * 60 * 60 * 1000;


// /seller-ads/example: a made-up dealer page that the Example card in Dealers Garage opens, so a dealer can see what
// their own page will look like. Nothing here is real, and it never touches the server.
const EXAMPLE_STATS = {
  seller_type: 'dealer', business_name: 'Your Dealership Name', avatar_url: null, cover_url: '/img/927787060_generated_image.jpg',
  contact_ways: { message: true, phone: true, whatsapp: true, email: true },
  county: 'Dublin', area: 'Swords', business_address: 'Your business address', business_address_2: 'Address line 2', eircode: 'A65 F4E2', about: 'A few lines about your dealership: what you sell, how long you have been trading and what buyers can expect.', opening_hours: '',
  opening_times: { mon: '09:00 - 18:00', tue: '09:00 - 18:00', wed: '09:00 - 18:00', thu: '09:00 - 18:00', fri: '09:00 - 18:00', sat: '10:00 - 16:00', sun: 'Closed', bank: 'Closed' },
  phone: '', trusted: true,
};
const exampleAd = (i, title, price, section, image) => ({
  id: `example-${i}`, title, price: `€${price}`, priceNum: price, mileage: '65,000 km', location: 'Swords, Dublin', viewCount: null,
  year: '2021', engine: 'Diesel', image, images: [image], photos: 1, sellerType: 'Dealer', isTrader: true, sellerId: 'example',
  created_date: new Date(Date.now() - i * 86400000).toISOString(), section,
});
const EXAMPLE_ADS = [
  exampleAd(1, 'Example: 2022 Saloon', 38900, 'Cars', '/img/927787060_generated_image.jpg'),
  exampleAd(2, 'Example: 2021 Panel Van', 24500, 'Commercials', '/img/37b29cbc7_generated_image.jpg'),
  exampleAd(3, 'Example: 2019 Camper', 52000, 'Campers', '/img/2106e76f6_generated_image.jpg'),
];

const SORTS = [
  ['newest', 'Newest'],
  ['oldest', 'Oldest'],
  ['price-high', 'Highest price'],
  ['price-low', 'Lowest price'],
];

const TABS = [
  { id: 'stock', label: 'Our Stock' },
  { id: 'contact', label: 'Contact Us' },
  { id: 'reviews', label: 'Reviews' },
];


// Opening hours are typed as one line ("Mon-Fri 9:00-18:00, Sat 10:00-16:00"). They are shown as a column, one row per
// part, with the days on the left and the times on the right. If the dealer lists days but never mentions Sunday,
// a "Sun  Closed" row is added.
function hoursRows(text) {
  const parts = String(text || '').split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  const rows = parts.map((p) => {
    const m = /^(.+?)\s+(\d.*|closed.*)$/i.exec(p);
    return m ? [m[1], m[2]] : [p, ''];
  });
  const listsDays = rows.some(([d]) => /^(mon|tue|wed|thu|fri|sat|sun)/i.test(d));
  if (listsDays && !parts.some((p) => /sun/i.test(p))) rows.push(['Sun', 'Closed']);
  return rows;
}

function OpeningHours({ times, text }) {
  if (hasTimes(times)) {
    return (
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-foreground">
        {DAY_KEYS.filter(([key]) => times[key]).map(([key, label]) => (
          <React.Fragment key={key}><dt className="font-medium">{label}</dt><dd>{times[key]}</dd></React.Fragment>
        ))}
      </dl>
    );
  }
  return (
    <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-foreground">
      {hoursRows(text).map(([days, times], i) => (times
        ? <React.Fragment key={i}><dt className="font-medium">{days}</dt><dd>{times}</dd></React.Fragment>
        : <dd key={i} className="col-span-2">{days}</dd>))}
    </dl>
  );
}

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
  const isExample = sellerId === 'example';
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMessage, setShowMessage] = useState(false);
  const [ads, setAds] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('stock');
  const EMPTY_VEHICLE = { make: '', model: '', bodyType: '' };
  const [vehicles, setVehicles] = useState([EMPTY_VEHICLE]); // up to 3 make / model / body type choices, like the Cars For Sale filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [phoneShown, setPhoneShown] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false); // on a phone the filters start folded so the ads are not pushed down

  useEffect(() => {
    if (!sellerId) return;
    let alive = true;
    setLoading(true);
    setTab('stock'); setVehicles([EMPTY_VEHICLE]); setMinPrice(''); setMaxPrice(''); setSort('newest'); setPhoneShown(false);
    if (sellerId === 'example') {
      setAds(EXAMPLE_ADS);
      setStats(EXAMPLE_STATS);
      setLoading(false);
      return undefined;
    }
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
            sellerType: sellerTypeOf(ad),
            isTrader: ad.isTrader === true,
            spotlight: ad.spotlight,
            description: ad.description,
            fullName: ad.fullName,
            businessName: ad.businessName,
            email: ad.email,
            phone: ad.phone,
            sellerId: ad.created_by_id,
            created_date: ad.created_date,
            vehicleMake: ad.vehicleMake,
            vehicleModel: ad.vehicleModel,
            bodyType: ad.bodyType,
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

  // Only a Dealer account has the full dealer page (banner, tabs). Everyone else gets the plain page with their ads.
  const isBusiness = stats ? stats.seller_type === 'dealer' : ads.some((a) => a.sellerType === 'Dealer');
  const businessSeller = isBusinessType(stats?.seller_type) || ads.some((a) => a.isTrader);
  const name = isBusiness
    ? (stats?.business_name || ads.find((a) => a.businessName)?.businessName || 'Dealership')
    : businessSeller
      ? (stats?.business_name || ads.find((a) => a.businessName)?.businessName || ads.find((a) => a.fullName)?.fullName || 'Seller')
      : (ads.find((a) => a.fullName)?.fullName || 'Private Seller');
  const place = [stats?.county, stats?.area].filter(Boolean).join(', ');

  const shown = useMemo(() => {
    const toNumber = (v) => (v ? Number(String(v).replace(/[€,]/g, '')) : null); // the price boxes hold text like '€5,000'
    const min = toNumber(minPrice);
    const max = toNumber(maxPrice);
    const picked = vehicles.filter((v) => v.make || v.model || v.bodyType);
    const lower = (x) => String(x || '').toLowerCase();
    // same idea as Cars For Sale: the make / model is looked for in the ad title (and in the make / model the dealer entered)
    const matchesVehicle = (a, v) => (
      (!v.make || lower(a.title).includes(lower(v.make)) || lower(a.vehicleMake).includes(lower(v.make))) &&
      (!v.model || lower(a.title).includes(lower(v.model)) || lower(a.vehicleModel).includes(lower(v.model))) &&
      (!v.bodyType || lower(a.bodyType).includes(lower(v.bodyType)))
    );
    const list = ads.filter((a) => (
      (picked.length === 0 || picked.some((v) => matchesVehicle(a, v))) &&
      (min === null || a.priceNum >= min) &&
      (max === null || a.priceNum <= max)
    ));
    const when = (a) => new Date(a.created_date || 0).getTime();
    if (sort === 'price-low') list.sort((a, b) => a.priceNum - b.priceNum);
    else if (sort === 'price-high') list.sort((a, b) => b.priceNum - a.priceNum);
    else if (sort === 'oldest') list.sort((a, b) => when(a) - when(b));
    else list.sort((a, b) => when(b) - when(a)); // newest first
    return list;
  }, [ads, vehicles, minPrice, maxPrice, sort]);

  const filtersOn = !!(vehicles.some((v) => v.make || v.model || v.bodyType) || minPrice || maxPrice || sort !== 'newest');
  const resetFilters = () => { setVehicles([EMPTY_VEHICLE]); setMinPrice(''); setMaxPrice(''); setSort('newest'); };
  const setVehicle = (i, patch) => setVehicles((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  // The ways a buyer can contact this dealer (the dealer picks them on their Profile).
  const ways = waysOf(stats?.contact_ways);
  const waLink = whatsappLink(stats?.whatsapp_number || stats?.phone, name ? `Hello ${name}, I found you on AutoMax.` : '');
  const sendDealerMessage = async (text) => {
    await api.functions.invoke('contactSeller', { seller_id: sellerId, message: text });
  };
  const openMessage = () => {
    if (isExample) return;
    if (!user) { navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; }
    setShowMessage(true);
  };
  const waysButtonClass = 'w-full h-11 border border-primary text-primary bg-card rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors';
  const contactButtons = (
    <div className="flex flex-col gap-2.5">
      {ways.message && (
        <button type="button" onClick={openMessage} className={waysButtonClass}><MessageSquare className="w-4 h-4" /> Message</button>
      )}
      {ways.whatsapp && (waLink || isExample) && (
        isExample
          ? <span className={waysButtonClass}><MessageCircle className="w-4 h-4" /> WhatsApp</span>
          : <a href={waLink} target="_blank" rel="noopener noreferrer" className={waysButtonClass}><MessageCircle className="w-4 h-4" /> WhatsApp</a>
      )}
      {ways.email && (stats?.contact_email || isExample) && (
        isExample
          ? <span className={waysButtonClass}><Mail className="w-4 h-4" /> Email</span>
          : <a href={`mailto:${stats.contact_email}`} className={waysButtonClass}><Mail className="w-4 h-4" /> Email</a>
      )}
    </div>
  );

  const phone = isExample ? 'Your phone number' : (stats?.phone || ads.find((a) => a.phone)?.phone || '');
  const phoneButton = !ways.phone ? null : (
    <button
      type="button"
      onClick={() => setPhoneShown(true)}
      disabled={!phone}
      className="w-full h-11 border border-primary text-primary bg-card rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
      <Phone className="w-4 h-4" /> {phone ? (phoneShown ? phone : 'Show phone number') : 'No phone number'}
    </button>
  );

  const adList = (list) => (
    <div className={`space-y-4 ${isExample ? 'pointer-events-none select-none' : ''}`}>
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
            <AvatarBadge url={stats?.avatar_url} isTrader={businessSeller} className="w-16 h-16" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{name}</h1>
              <p className="text-sm text-muted-foreground">{businessSeller ? (isBusinessType(stats?.seller_type) ? accountLabel(stats.seller_type) : 'Trader') : 'Private seller'} · {ads.length} {ads.length === 1 ? 'ad' : 'ads'}</p>
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

      {isExample && (
        <div className="bg-secondary text-center text-sm text-foreground px-4 py-2.5">
          <span className="font-semibold">Example page.</span> This is how a dealership page looks. Dealers add their own photo, logo, ads and details.
        </div>
      )}

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
            <Link to="/dealers-garage" className="hover:text-white transition-colors">Dealers Garages</Link>
            <span>›</span>
            <span className="text-white">{name}</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-5">
            {(stats?.avatar_url || isExample) && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                {stats?.avatar_url
                  ? <img src={stats.avatar_url} alt="" className="w-full h-full object-contain" />
                  : <Building2 className="w-1/2 h-1/2 text-muted-foreground" strokeWidth={1.5} />}
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
              <p className="text-sm text-muted-foreground mt-5 mb-2">Make, Model, Body type</p>
              <div className="flex flex-col gap-3">
                {vehicles.map((v, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    {i > 0 && <div className="border-t border-border pt-2" />}
                    <MakeSelector value={v.make} onChange={(val) => setVehicle(i, { make: val, model: '' })} />
                    <ModelSelector make={v.make} value={v.model} onChange={(val) => setVehicle(i, { model: val })} />
                    <BodyTypeSelector value={v.bodyType} onChange={(val) => setVehicle(i, { bodyType: val })} />
                  </div>
                ))}
                {vehicles.length < 3 && (
                  <button type="button" onClick={() => setVehicles((prev) => [...prev, EMPTY_VEHICLE])} className="flex items-center gap-2 text-primary text-sm font-medium hover:underline">
                    <Plus className="w-4 h-4" /> Add another vehicle
                  </button>
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-6 mb-1">Price</p>
              <p className="text-xs text-muted-foreground mb-2">€ EUR</p>
              <div className="grid grid-cols-2 gap-2">
                <MobileSelect value={minPrice} onChange={setMinPrice} options={priceOptions} placeholder="From" />
                <MobileSelect value={maxPrice} onChange={setMaxPrice} options={priceOptions} placeholder="To" />
              </div>

              <p className="text-sm text-muted-foreground mt-6 mb-2">Sort by</p>
              <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Sort by">
                {SORTS.map(([value, label]) => {
                  const active = sort === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSort(value)}
                      className={`flex items-center h-11 px-4 rounded-lg text-sm text-left transition-colors ${active ? 'border-2 border-foreground font-semibold text-foreground' : 'border border-transparent text-foreground hover:bg-secondary'}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
              </div>

              <div className="border-t border-border mt-6 pt-5 space-y-4 text-sm">
                {(hasTimes(stats?.opening_times) || stats?.opening_hours) && (
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-4 h-4" /> Opening hours</p>
                    <OpeningHours times={stats.opening_times} text={stats.opening_hours} />
                  </div>
                )}
                {place && (
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Location</p>
                    <p className="text-foreground mt-1">{place}</p>
                  </div>
                )}
                {(ways.message || phoneButton) && (
                  <div className="space-y-2.5">
                    {phoneButton}
                    {ways.message && <button type="button" onClick={openMessage} className={waysButtonClass}><MessageSquare className="w-4 h-4" /> Message</button>}
                  </div>
                )}
              </div>
            </aside>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-sm text-foreground">
                  <span className="font-bold">{shown.length}</span> {shown.length === 1 ? 'ad' : 'ads'} from <span className="font-bold">{name}</span>{stats?.county ? <> in <span className="font-bold">{stats.county}</span></> : null}
                </p>
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
            {stats?.about && <p className="text-sm text-foreground whitespace-pre-line mb-6">{stats.about}</p>}
            <dl className="space-y-5 text-sm">
              <div>
                <dt className="text-muted-foreground flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Address</dt>
                <dd className="text-foreground mt-1 whitespace-pre-line">{[stats?.business_address, stats?.business_address_2, (stats?.business_address || stats?.business_address_2) ? place : '', stats?.eircode].filter(Boolean).join('\n') || place || 'Not added yet'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-4 h-4" /> Opening hours</dt>
                <dd className="text-foreground mt-1">{(hasTimes(stats?.opening_times) || stats?.opening_hours) ? <OpeningHours times={stats.opening_times} text={stats.opening_hours} /> : 'Not added yet'}</dd>
              </div>
            </dl>
            <div className="mt-6 space-y-2.5">
              {phoneButton}
              {contactButtons}
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-8 text-center">
            <p className="text-lg font-semibold text-foreground mb-1">No reviews yet</p>
            <p className="text-sm text-muted-foreground">Reviews from buyers will appear here.</p>
          </div>
        )}
      </div>

      <MessageModal
        open={showMessage}
        onClose={() => setShowMessage(false)}
        sellerName={name}
        adTitle="your dealership"
        onSend={sendDealerMessage} />

      <Footer />
    </div>
  );
}
