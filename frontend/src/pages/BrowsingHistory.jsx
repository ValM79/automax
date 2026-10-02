import React, { useState, useEffect } from 'react';
import BackButton from '../components/automarket/BackButton';
import { ArrowLeft, Camera, History, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';

const HISTORY_KEY = 'automax_browsing_history';

export default function BrowsingHistory() {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    setHistory(stored);
  }, []);

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    setConfirmClear(false);
  };

  const handleCardClick = (item) => {
    navigate(`/vehicle/${item.id}`, { state: { car: item } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Browsing History</span>
        </div>

        {history.length > 0 && (
          <div className="flex justify-end mb-4 items-center gap-3">
            {confirmClear ? (
              <>
                <span className="text-sm text-muted-foreground">Are you sure?</span>
                <button onClick={handleClear} className="text-sm text-destructive font-semibold hover:underline transition-colors">
                  Yes, clear
                </button>
                <button onClick={() => setConfirmClear(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="inline-flex items-center gap-2 bg-card border border-border text-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-secondary transition-colors">
                <Trash2 className="w-4 h-4" />
                Clear browsing history
              </button>
            )}
          </div>
        )}

        {history.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">No browsing history</p>
                <p className="text-sm text-muted-foreground">Vehicles you view will appear here</p>
                <Link to="/cars-for-sale" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Browse cars →</Link>
              </div>
            ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div
                key={`${item.id}-${item.viewedAt}`}
                onClick={() => handleCardClick(item)}
                className="bg-card rounded-xl border border-border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                <div className="relative h-44">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">No photo</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                    <Camera className="w-3 h-3" /> {item.photos || 1}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{item.viewedAt} · {item.location}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="text-base font-bold text-foreground">
                        {typeof item.price === 'number' ? `€${item.price.toLocaleString()}` : item.price}
                      </p>
                    </div>
                    <span className="text-xl" style={{ transform: 'scaleX(-1)', display: 'inline-block', opacity: 0.3 }}>👍</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-auto"><Footer /></div>
    </div>
  );
}