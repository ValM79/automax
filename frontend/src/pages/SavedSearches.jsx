import React, { useState, useEffect } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, Clock, Trash2, Search } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { getSavedSearches, removeSavedSearch } from '@/lib/savedSearches';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { queryClientInstance } from '@/lib/query-client';

const STORAGE_KEY = 'automax_favorites';

export default function SavedSearches() {
  const [savedItems, setSavedItems] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [activeTab, setActiveTab] = useState('searches');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'liked') {
      setActiveTab('liked');
    } else {
      setActiveTab('searches');
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      setSavedItems(saved);
    } catch { setSavedItems([]); }
    setSavedSearches(getSavedSearches());
  }, []);

  const removeSaved = (id) => {
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleRemoveSearch = (id) => {
    removeSavedSearch(id);
    setSavedSearches(getSavedSearches());
  };

  const handleCardClick = (item) => {
    navigate(`/vehicle/${item.id}`, { state: { car: item } });
  };

  const handleSearchClick = (search) => {
    navigate(search.url || '/cars-for-sale', { state: { savedSearchFilters: search.filters } });
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <Navbar />
      <PullToRefresh onRefresh={async () => { await queryClientInstance.invalidateQueries(); }}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Saved Searches</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-border mb-6">
          <button
            onClick={() => setActiveTab('searches')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'searches' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            Saved Searches ({savedSearches.length})
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'liked' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            Liked Ads ({savedItems.length})
          </button>
        </div>

        {/* Saved Searches Tab */}
        {activeTab === 'searches' && (
          <>
            {savedSearches.length > 0 && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => { savedSearches.forEach(s => removeSavedSearch(s.id)); setSavedSearches([]); }}
                  className="text-sm text-foreground underline font-medium hover:text-primary transition-colors">
                  Clear all searches
                </button>
              </div>
            )}
            {savedSearches.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-lg font-medium text-foreground mb-2">No saved searches yet</p>
                <p className="text-sm text-muted-foreground mb-6">Use the "Save this search" button in the filters to save your search criteria</p>
                <Link to="/cars-for-sale" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                  Browse Listings
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedSearches.map(search => (
                  <div
                    key={search.id}
                    onClick={() => handleSearchClick(search)}
                    className="bg-card rounded-xl border border-border shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-primary">
                        <Search className="w-4 h-4" />
                        <span className="text-xs text-muted-foreground">{formatDate(search.savedAt)}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveSearch(search.id); }}
                        className="text-muted-foreground hover:text-destructive transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm leading-snug">{search.name}</h3>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Liked Ads Tab */}
        {activeTab === 'liked' && (
          <>
            {savedItems.length > 0 && (
              <div className="flex justify-end mb-4">
                <button onClick={() => { setSavedItems([]); localStorage.removeItem(STORAGE_KEY); }} className="text-sm text-foreground underline font-medium hover:text-primary transition-colors">
                  Clear liked ads
                </button>
              </div>
            )}
            {savedItems.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
                <span className="text-5xl opacity-20 block mb-4">👍</span>
                <p className="text-lg font-medium text-foreground mb-2">No liked ads yet</p>
                <p className="text-sm text-muted-foreground mb-6">Tap the 👍 icon on any listing to save it here</p>
                <Link to="/" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                  Browse Listings
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item)}
                    className="bg-card rounded-xl border border-border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    <div className="relative h-44">
                      {item.image ? (
                        <>
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                            <Camera className="w-3 h-3" /> {item.photos || 1}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">No photo</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-2">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{item.location}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="text-base font-bold text-foreground">
                            {typeof item.price === 'number' ? `€${item.price.toLocaleString()}` : item.price}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeSaved(item.id); }}
                          className="p-1 transition-transform hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center">
                          <span className="text-xl inline-block" style={{ transform: 'scaleX(-1)' }}>👍</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      </PullToRefresh>
      <div className="mt-auto"><Footer /></div>
    </div>
  );
}