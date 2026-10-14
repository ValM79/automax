import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowRight, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HISTORY_KEY = 'automax_search_history';
const MAX_HISTORY = 8;

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

function saveToHistory(entry) {
  const prev = getHistory().filter(h => h.label !== entry.label);
  const updated = [entry, ...prev].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

// Site pages / categories that can be matched by keyword
const SITE_PAGES = [
  { label: 'Cars for Sale', route: '/cars-for-sale', keywords: ['car', 'cars', 'saloon', 'sedan', 'hatchback', 'coupe', 'suv', 'auto', 'vehicle'] },
  { label: 'Used Cars', route: '/used-cars', keywords: ['used', 'second hand', 'secondhand', 'pre-owned'] },
  { label: 'Dealers Garage', route: '/dealers-garage', keywords: ['dealer', 'dealers', 'garage', 'dealers garage', 'new car', 'brand new', '2024', '2025', '2026'] },
  { label: 'Electric & Hybrid Cars', route: '/electric-hybrid-cars', keywords: ['electric', 'hybrid', 'ev', 'tesla', 'plug-in', 'green', 'eco'] },
  { label: 'Dealership Cars', route: '/dealership-cars', keywords: ['dealer', 'dealership', 'garage'] },
  { label: 'Motorbikes', route: '/motorbikes', keywords: ['motorbike', 'motorcycle', 'bike', 'moped', 'harley', 'honda cb', 'yamaha', 'kawasaki', 'ducati'] },
  { label: 'Kids Bikes & Bicycles', route: '/bikes-bicycles', keywords: ['kids bike', 'bicycle', 'cycling', 'cycle', 'mountain bike', 'bmx', 'push bike', 'kids bicycle', 'childrens bike', 'children bike'] },
  { label: 'Scooters', route: '/scooters', keywords: ['scooter', 'vespa', '50cc', '125cc'] },
  { label: 'Quads', route: '/quads', keywords: ['quad', 'atv', 'quad bike', 'four wheeler'] },
  { label: 'Vintage Cars', route: '/vintage-cars', keywords: ['vintage', 'classic', 'retro', 'antique', 'oldtimer', 'old car'] },
  { label: 'Vintage Bikes', route: '/vintage-bikes', keywords: ['vintage bike', 'classic bike', 'classic motorbike'] },
  { label: 'Modified Cars', route: '/modified-cars', keywords: ['modified', 'custom', 'tuned', 'turbo', 'stance'] },
  { label: 'Trucks', route: '/trucks', keywords: ['truck', 'lorry', 'pickup', 'hgv', 'tipper'] },
  { label: 'Vans & Commercials', route: '/commercials', keywords: ['van', 'commercial', 'transit', 'sprinter', 'minibus', 'panel van'] },
  { label: 'Campers', route: '/campers', keywords: ['camper', 'motorhome', 'rv', 'campervan', 'motor home'] },
  { label: 'Caravans', route: '/caravans', keywords: ['caravan', 'trailer home', 'static caravan'] },
  { label: 'Trailers', route: '/trailers', keywords: ['trailer', 'box trailer', 'horse box', 'horsebox', 'flatbed'] },
  { label: 'Boats', route: '/boats', keywords: ['boat', 'yacht', 'sailing', 'motorboat', 'speedboat', 'dinghy', 'jet ski'] },
  { label: 'Boat Extras', route: '/boat-extras', keywords: ['boat parts', 'marine', 'anchor', 'outboard'] },
  { label: 'Car Parts', route: '/car-parts', keywords: ['parts', 'spares', 'engine', 'gearbox', 'tyres', 'tires', 'wheels', 'exhaust', 'bumper'] },
  { label: 'Car Extras', route: '/car-extras', keywords: ['car extras', 'accessories', 'roof rack', 'tow bar', 'dash cam'] },
  { label: 'Motorbike Extras', route: '/motorbike-extras', keywords: ['helmet', 'leathers', 'bike gear', 'motorbike parts'] },
  { label: 'Rally Cars', route: '/rally-cars', keywords: ['rally', 'race car', 'track', 'motorsport', 'racing'] },
  { label: 'Breaking & Repairables', route: '/breaking-repairables', keywords: ['breaking', 'repairable', 'salvage', 'damaged', 'write off', 'spares or repairs'] },
  { label: 'Plant & Machinery', route: '/plant-machinery', keywords: ['plant', 'machinery', 'digger', 'jcb', 'tractor', 'forklift', 'excavator'] },
  { label: 'Coaches & Buses', route: '/coaches-buses', keywords: ['bus', 'coach', 'minibus', 'school bus'] },
  { label: 'Car Rent', route: '/car-rent', keywords: ['rent', 'hire', 'rental', 'lease'] },
  { label: 'Car Insurance', route: '/car-insurance', keywords: ['insurance', 'insure', 'cover', 'policy'] },
  { label: 'History Check', route: '/history-checks', keywords: ['history check', 'car check', 'vehicle history', 'vin', 'hpi'] },
  { label: 'Find a Dealer', route: '/dealers', keywords: ['dealer', 'find dealer', 'showroom', 'car dealer'] },
];

function scorePage(page, query) {
  const q = query.toLowerCase().trim();
  const label = page.label.toLowerCase();
  if (label.includes(q)) return 3;
  if (page.keywords.some(k => k.includes(q) || q.includes(k))) return 2;
  if (page.keywords.some(k => k.split(' ').some(word => word.startsWith(q)))) return 1;
  return 0;
}

export default function SearchDropdown({ onClose }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState(getHistory);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const scored = SITE_PAGES
      .map(p => ({ ...p, score: scorePage(p, query) }))
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    setSuggestions(scored);
  }, [query]);

  const handleGo = (route, label, searchQuery) => {
    if (label) saveToHistory({ label, route });
    const destination = searchQuery ? `${route}?q=${encodeURIComponent(searchQuery)}` : route;
    navigate(destination);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveToHistory({ label: query.trim(), route: `/cars-for-sale` });
      navigate(`/cars-for-sale?q=${encodeURIComponent(query.trim())}`);
      onClose();
    } else if (suggestions.length > 0) {
      handleGo(suggestions[0].route, suggestions[0].label);
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleRemoveHistoryItem = (label) => {
    const updated = getHistory().filter(h => h.label !== label);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Start typing to search"
          className="flex-1 text-sm outline-none text-foreground placeholder:text-muted-foreground bg-transparent"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground transition-colors mr-1 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        )}
        <button type="submit" className="text-foreground hover:text-primary transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Results */}
      {(suggestions.length > 0 || query.trim() || history.length > 0) && <div className="border-t border-border" />}
      {suggestions.length > 0 ? (
        <ul className="py-1">
          {suggestions.map(page => (
            <li key={page.route}>
              <button
              onClick={() => handleGo(page.route, page.label, query)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary transition-colors text-left group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground font-medium">{page.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </li>
          ))}
        </ul>
      ) : query.trim() ? (
        <div className="px-4 py-4 text-sm text-muted-foreground text-center">
          No results for <span className="font-semibold text-foreground">"{query}"</span>
          <br />
          <button
            onClick={() => { navigate(`/cars-for-sale`); onClose(); }}
            className="text-primary hover:underline mt-1 block mx-auto"
          >
            Browse all listings →
          </button>
        </div>
      ) : history.length > 0 ? (
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Recent Searches</p>
            <button onClick={handleClearHistory} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
              <Trash2 className="w-3 h-3" /> Clear all
            </button>
          </div>
          <ul>
            {history.map(h => (
              <li key={h.label} className="group flex items-center justify-between hover:bg-secondary rounded-lg px-1 transition-colors">
                <button
                  onClick={() => handleGo(h.route, h.label)}
                  className="flex items-center gap-2 flex-1 py-2 text-sm text-foreground text-left"
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  {h.label}
                </button>
                <button
                  onClick={() => handleRemoveHistoryItem(h.label)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}