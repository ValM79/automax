import React, { useState, useEffect, useMemo } from 'react';
import { Camera, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGE_STYLES = {
  'Newly Listed': 'bg-blue-100 text-blue-700 border-blue-200',
  'Price Reduced': 'bg-orange-100 text-orange-700 border-orange-200',
  'Hot Deal': 'bg-red-100 text-red-700 border-red-200',
  'Just In': 'bg-green-100 text-green-700 border-green-200',
  'Almost Gone': 'bg-yellow-100 text-yellow-700 border-yellow-200'
};

/**
 * Shared listing card matching the Cars Ireland reference layout.
 */
export default function ListingCard({ item, saved, onToggleSave, viewMode = 'list' }) {
  const isGrid = viewMode === 'grid';
  const navigate = useNavigate();

  // Optimistic local state so the thumb icon responds instantly on tap,
  // before the parent re-render propagates the new `saved` prop.
  const [optimisticSaved, setOptimisticSaved] = useState(saved);

  useEffect(() => {
    setOptimisticSaved(saved);
  }, [saved]);

  const handleCardClick = () => {
    navigate(`/vehicle/${item.id}`, { state: { car: item } });
  };

  const handleToggleSave = (e) => {
    e.stopPropagation();
    setOptimisticSaved(prev => !prev);
    onToggleSave(item.id);
  };

  const isTrusted = item.trusted || item.sellerType && item.sellerType.toLowerCase().includes('trusted');

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = useMemo(() => {
    let timestamp = item.created_date || item.firstSeen;
    if (!timestamp) {
      const key = `automax_first_seen_${item.id}`;
      let ts = localStorage.getItem(key);
      if (!ts) { ts = Date.now().toString(); localStorage.setItem(key, ts); }
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
  }, [item.id, item.created_date, now]);

  const viewCount = useMemo(() => {
    const key = `automax_views_${item.id}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
  }, [item.id]);

  const meta = [item.year, item.engine || item.fuel, item.mileage, timeAgo, viewCount > 0 ? `${viewCount} view${viewCount !== 1 ? 's' : ''}` : null, item.location].filter(Boolean).join(' · ');

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={handleCardClick}>

      {/* Dealer header row */}
      {item.dealer &&
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border">
          {item.dealerLogo ?
        <img src={item.dealerLogo} alt={item.dealer} className="w-8 h-8 rounded object-contain border border-border bg-card p-0.5" /> :

        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border">
              <span className="text-xs font-bold text-muted-foreground">{item.dealer.charAt(0)}</span>
            </div>
        }
          <span className="text-sm font-semibold text-foreground">{item.dealer}</span>
        </div>
      }

      <div className={isGrid ? 'flex flex-col' : 'flex flex-col sm:flex-row'}>

        {/* Image section -- sized/shaped to match DoneDeal's reference card
            (measured live: 360x270, a 4:3 ratio) instead of the old 192x192
            square, which made photos look cramped next to the info panel. */}
        <div className={`flex-shrink-0 w-full ${isGrid ? '' : 'sm:w-80'}`}>
          <div className="relative aspect-[4/3]">
            {/* Spotlight badge on image */}
            {item.spotlight &&
            <span className="absolute top-2 left-0 bg-secondary text-white text-xs font-semibold px-2.5 py-1 z-10" style={{ borderRadius: '0 4px 4px 0' }}>
                Spotlight
              </span>
            }

            {item.image ?
            <>
              {/* Same blurred-backdrop + contain treatment as the vehicle detail
                  gallery (see ImageGallery.jsx) -- a plain object-cover here crops
                  portrait/ultra-wide phone photos just as badly, just at a smaller
                  size. Same src reused for the backdrop, so no extra request. */}
              <img src={item.image} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-50" />
              <img src={item.image} alt={item.title} className="relative w-full h-full object-contain" />
            </> :
            <div className="w-full h-full bg-secondary flex items-center justify-center"><span className="text-muted-foreground text-sm">No photo</span></div>
            }
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
              <Camera className="w-3 h-3" /> {item.photos}
            </div>
          </div>

        </div>

        {/* Info panel */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            {/* Seller type + rating row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isTrusted ?
              <span className="flex items-center gap-1 text-xs text-green-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  {item.sellerType || 'Trusted Dealer'}
                </span> :
              item.sellerType ?
              <span className="text-xs font-semibold text-muted-foreground">{item.sellerType}</span> :
              null}
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-foreground mb-1 line-clamp-2">
              {item.title}
            </h3>

            {/* Specs row: year · engine · mileage · town */}
            {meta && <p className="text-sm text-muted-foreground mb-2">{meta}</p>}

            {/* Badge (e.g. warranty) */}
            {item.badge &&
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded mt-1">
                {item.badge}
              </span>
            }
          </div>

          {/* Price + save */}
          <div className="flex items-end justify-between mt-4">
            <div>
              {item.originalPrice && <p className="text-xs text-muted-foreground line-through">{item.originalPrice}</p>}
              <div className="flex items-center gap-2">
                <p className="text-xl font-normal text-foreground">{item.price}</p>
                {item.priceNote &&
                <span className={`text-xs font-semibold ${item.priceNoteColor || 'text-green-600'}`}>● {item.priceNote}</span>
                }
              </div>
              {item.monthly && <p className="text-xs text-muted-foreground">From €{item.monthly}/mo</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                 onClick={handleToggleSave}
                 className="transition-transform hover:scale-110 flex-shrink-0 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center leading-none">
                 <span
                   className={`text-xl inline-block ${optimisticSaved ? '' : 'grayscale opacity-60'}`}
                   style={{ transform: 'scaleX(-1)' }}>
                   👍
                 </span>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>);

}