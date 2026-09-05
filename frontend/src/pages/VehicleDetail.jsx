import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import ShareMenu from '../components/automarket/ShareMenu';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import ImageGallery from '../components/automarket/ImageGallery';
import Description from '../components/automarket/Description';
import SellerCard from '../components/automarket/SellerCard';
import MessageModal from '../components/automarket/MessageModal';
import { setSeoMeta } from '../components/SeoManager';

export default function VehicleDetail() {
  const { id } = useParams();
  const location = useLocation();
  const carFromState = location.state?.car;
  const [fetchedCar, setFetchedCar] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [sellerTenure, setSellerTenure] = useState(null);
  const [sellerName, setSellerName] = useState(null);

  // Normalize a UserAd entity into the car object shape used by this page
  const normalizeAd = (ad) => ({
    id: ad.id,
    isUserAd: true,
    title: ad.title,
    year: parseInt(ad.vehicleYear) || null,
    fuel: ad.vehicleFuel,
    mileage: ad.mileage,
    location: ad.location,
    price: parseFloat(String(ad.price || '').replace(/[^0-9.]/g, '')) || 0,
    currency: ad.currency || '€',
    photos: ad.photos,
    images: ad.photos || [],
    image: (ad.photos && ad.photos.length > 0) ? ad.photos[0] : null,
    fullName: ad.fullName,
    email: ad.email,
    phone: ad.phone,
    sellerId: ad.created_by_id,
    created_by_id: ad.created_by_id,
    created_date: ad.created_date,
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
  });

  const car = carFromState || fetchedCar;

  // Fetch vehicle by ID when arriving via direct link / reload (no location.state)
  useEffect(() => {
    if (carFromState || !id) return;
    setFetchError(false);
    api.entities.UserAd.get(id)
      .then((ad) => {
        if (ad) setFetchedCar(normalizeAd(ad));
        else setFetchError(true);
      })
      .catch(() => setFetchError(true));
  }, [id, carFromState]);

  const handleSendMessageClick = () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setShowMessageModal(true);
  };

  const handleSendMessage = async (messageText) => {
    await api.functions.invoke('contactSeller', {
      ad_id: car.id,
      message: messageText
    });
  };

  const handleViewAllAds = () => {
    const sellerId = car.sellerId || car.created_by_id;
    if (sellerId) {
      navigate(`/seller-ads/${sellerId}`);
    }
  };

  useEffect(() => {
    if (!car) return;
    const sellerId = car.sellerId || car.created_by_id;
    if (sellerId) {
      api.entities.User.get(sellerId).
      then((sellerUser) => {
        if (sellerUser?.display_name || sellerUser?.full_name) {
          setSellerName(sellerUser.display_name || sellerUser.full_name);
        }
        if (sellerUser?.created_date) {
          const diff = Date.now() - new Date(sellerUser.created_date).getTime();
          const days = Math.floor(diff / 86400000);
          const years = Math.floor(days / 365);
          const months = Math.floor(days % 365 / 30);
          if (years >= 1) {
            setSellerTenure(`${years} year${years > 1 ? 's' : ''}`);
          } else if (months >= 1) {
            setSellerTenure(`${months} month${months > 1 ? 's' : ''}`);
          } else {
            setSellerTenure(`${days} day${days > 1 ? 's' : ''}`);
          }
        } else {
          setSellerTenure('New seller');
        }
      }).
      catch(() => setSellerTenure('New seller'));
    } else {
      setSellerTenure('New seller');
    }
  }, [car?.id]);

  useEffect(() => {
    if (!car) return;
    const HISTORY_KEY = 'automax_browsing_history';
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const entry = {
      id: car.id,
      title: car.title,
      price: car.price,
      image: car.image,
      location: car.location,
      photos: car.photos,
      year: car.year,
      fuel: car.fuel,
      mileage: car.mileage,
      sellerType: car.sellerType,
      viewedAt: new Date().toLocaleString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    };
    const filtered = stored.filter((h) => h.id !== car.id);
    const updated = [entry, ...filtered].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }, [car?.id]);

  const [showShare, setShowShare] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const viewCount = useMemo(() => {
    if (!car) return 0;
    const key = `automax_views_${car.id}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    const newCount = current + 1;
    localStorage.setItem(key, newCount.toString());
    return newCount;
  }, [car?.id]);

  const timeAgo = useMemo(() => {
    if (!car) return '';
    let timestamp = car.created_date;
    if (!timestamp) {
      const key = `automax_first_seen_${car.id}`;
      let ts = localStorage.getItem(key);
      if (!ts) {ts = Date.now().toString();localStorage.setItem(key, ts);}
      timestamp = parseInt(ts, 10);
    }
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'Just now';
  }, [car, now]);

  const galleryImages = car && (() => {
    if (car.images && car.images.length > 0) return car.images;
    if (Array.isArray(car.photos) && car.photos.length > 0) return car.photos;
    if (car._raw?.photos && Array.isArray(car._raw.photos) && car._raw.photos.length > 0) return car._raw.photos;
    const count = typeof car.photos === 'number' ? car.photos : 1;
    return Array.from({ length: count }, () => car.image).filter(Boolean);
  })();

  // Dynamic SEO: per-vehicle title, meta description, canonical URL, OG image,
  // and schema.org Vehicle structured data for rich search results.
  useEffect(() => {
    if (!car) return;
    const title = `${car.title} | AutoMax`;
    const descParts = [
      car.year, car.title, 'for sale',
      car.location ? `in ${car.location}` : 'in Ireland',
      car.mileage ? `· ${car.mileage}` : '',
      car.fuel || car.engine ? `· ${car.fuel || car.engine}` : '',
    ].filter(Boolean).join(' ');
    const description = `${descParts}. View photos, full specs and contact the seller on AutoMax — Ireland's largest car marketplace.`;
    const image = galleryImages?.[0] || car.image;
    const url = window.location.origin + `/vehicle/${car.id}`;

    const cleanPrice = String(car.price || '').replace(/[€£,\s]/g, '');
    const priceNum = parseInt(cleanPrice, 10);
    const currency = (car.currency || '€') === '€' ? 'EUR' : 'GBP';

    const vehicleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Vehicle',
      name: car.title,
      image: galleryImages,
      brand: car.make || car.vehicleMake,
      model: car.model || car.vehicleModel,
      vehicleModelDate: car.year,
      fuelType: car.fuel || car.vehicleFuel,
      vehicleTransmission: car.transmission || car.vehicleTransmission,
      vehicleConfiguration: car.bodyType || car.bodyType,
      color: car.colour,
      mileageFromOdometer: car.mileage,
      vehicleEngine: car.engineSize,
      offers: !isNaN(priceNum) ? {
        '@type': 'Offer',
        price: priceNum,
        priceCurrency: currency,
        availability: 'https://schema.org/InStock',
        url: url,
      } : undefined,
    };

    setSeoMeta({ title, description, image, url, jsonLd: vehicleJsonLd });
  }, [car?.id]);

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          {fetchError ? (
            <>
              <p className="text-muted-foreground mb-4">Vehicle not found.</p>
              <Link to="/cars-for-sale" className="text-primary hover:underline">Back to listings</Link>
            </>
          ) : (
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto" />
          )}
        </div>
        <Footer />
      </div>);

  }

  const saved = isFavorite(car.id);

  const cleanPrice = String(car.price || '').replace(/[€£]/g, '').trim();
  const priceNum = parseInt(cleanPrice.replace(/,/g, ''), 10);
  const currencySymbol = car.currency || '€';
  const displayPrice = isNaN(priceNum) ? car.price : `${currencySymbol}${priceNum.toLocaleString()}`;

  const locationShort = car.location ? car.location.split(',').pop().trim() : null;
  const metaParts = [car.year, car.fuel || car.engine, car.mileage, timeAgo, `${viewCount} view${viewCount !== 1 ? 's' : ''}`, car.location].filter(Boolean);

  const specItems = [
    car.engineSize && { label: 'Engine', value: car.engineSize },
    car.enginePower && { label: 'Power', value: `${car.enginePower}hp` },
    car.transmission && { label: 'Transmission', value: car.transmission },
    car.bodyType && { label: 'Body Type', value: car.bodyType },
    car.colour && { label: 'Colour', value: car.colour },
    car.numberOfDoors && { label: 'Doors', value: car.numberOfDoors },
    car.numberOfSeats && { label: 'Seats', value: car.numberOfSeats },
    car.batteryRange && { label: 'Battery', value: car.batteryRange },
    car.roadTax && { label: 'Road Tax', value: `€${car.roadTax}` },
    car.nctExpiry && { label: 'NCT', value: car.nctExpiry },
    car.taxExpiry && { label: 'Tax', value: car.taxExpiry },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5 flex-wrap">
          <Link to="/cars-for-sale" className="flex items-center gap-1 hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to listings
          </Link>
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <Link to="/cars-for-sale" className="hover:text-primary transition-colors">All Cars</Link>
          <span>›</span>
          <span className="text-foreground font-medium">{car.title}</span>
        </div>

        <div className="flex flex-col gap-5">
            {/* Image Gallery */}
            <ImageGallery
            images={galleryImages}
            title={car.title} />
            

            {/* Title + price */}
            <div className="px-4 pt-4 pb-4 relative bg-[hsl(var(--secondary))]">
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-medium text-foreground capitalize text-lg">{car.title}</h1>
              </div>
              <p className="text-sm mt-1 text-[hsl(var(--foreground))]">{metaParts.join(' · ')}</p>
              {specItems.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {specItems.map((s) => (
                    <span key={s.label} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{s.label}:</span> {s.value}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-end gap-4 mt-3">
                <div className="relative">
                  <button
                  onClick={() => setShowShare((v) => !v)}
                  className="flex items-center gap-1.5 text-sm font-medium hover:text-foreground transition-colors text-[hsl(var(--foreground))]">
                    <Share2 className="w-4 h-4 text-[hsl(var(--foreground))]" /> Share
                  </button>
                  {showShare && <ShareMenu onClose={() => setShowShare(false)} title={car.title} />}
                </div>
                <button
                onClick={() => toggleFavorite(car)}
                className="flex items-center text-muted-foreground"
                title={saved ? 'Unlike' : 'Like'}>
                
                  <span
                  className={`text-xl inline-block ${saved ? '' : 'grayscale opacity-60'}`}
                  style={{ transform: 'scaleX(-1)' }}>
                  
                    👍
                  </span>
                </button>
              </div>
            </div>

            {/* Description */}
            <Description description={car.description || car.title} sellerName={car.fullName || car.sellerType || 'the seller'} />

            {/* Seller info */}
            <SellerCard
            seller={{
              name: sellerName || car.fullName || car.sellerType || 'Private Seller',
              location: locationShort,
              yearsOnPlatform: sellerTenure || 'New seller',
              phone: car.phone || ''
            }}
            onSendMessage={handleSendMessageClick}
            onViewAllAds={handleViewAllAds} />
          
          </div>

        {/* Some information & Report Ad */}
        <div className="bg-secondary max-w-5xl mx-auto px-4 pb-8">
          <hr className="border-border my-4" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Some information shown may come from third-party sources or be identified using AI. As a result, it may not always be accurate, complete, or up to date.{' '}
            <button
              onClick={() => setShowDisclaimer((v) => !v)}
              className="text-foreground font-bold underline inline-flex items-center gap-1">
              
              See More {showDisclaimer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </p>
          {showDisclaimer &&
          <p className="text-xs text-muted-foreground leading-relaxed mt-3">
              Images may have been digitally edited, enhanced, or generated using AI or similar technologies. AutoMax does not verify the accuracy or authenticity of this content. Buyers and sellers are responsible for independently verifying all information, including the condition and details of any item, before proceeding with a transaction.
            </p>
          }
          {showDisclaimer &&
          <p className="text-xs text-muted-foreground leading-relaxed mt-3">
              AutoMax accepts no responsibility or liability for any loss, damage, or dispute arising from the content of an advertisement, including reliance on images or information that have been modified, enhanced, generated, or otherwise produced using AI or related technologies.
            </p>
          }
          <hr className="border-border my-4" />
          <button
            onClick={() => {
              if (!user) {
                navigate(`/login?next=${encodeURIComponent(`/report-ad/${car.id}`)}`);
              } else {
                navigate(`/report-ad/${car.id}`);
              }
            }}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors text-[hsl(var(--foreground))] text-sm">
            
            <Flag className="w-3.5 h-3.5" /> Report Ad
          </button>
        </div>
      </div>

      <MessageModal
        open={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        sellerName={car.fullName || car.sellerType || 'Private Seller'}
        adTitle={car.title}
        onSend={handleSendMessage} />
      

      <Footer />
    </div>);

}