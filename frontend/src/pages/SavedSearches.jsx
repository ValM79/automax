import React, { useState, useEffect } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Trash2, Search, Heart, Bell } from 'lucide-react';
import ListingCard from '../components/automarket/ListingCard';
import { useFavorites } from '../hooks/useFavorites';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { getSavedSearches, removeSavedSearch } from '@/lib/savedSearches';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { queryClientInstance } from '@/lib/query-client';

// what the strip under a saved ad says about the ad
const AD_STATE = {
  live: { label: 'Live', live: true },
  sold: { label: 'Already sold', live: false },
  expired: { label: 'Expired', live: false },
  removed: { label: 'No longer available', live: false },
};

export default function SavedSearches() {
  const { favorites: savedItems, removeFavorite } = useFavorites();
  const [savedSearches, setSavedSearches] = useState([]);
  const [activeTab, setActiveTab] = useState('searches');
  const navigate = useNavigate();
  const { user } = useAuth();
  // email alerts ("Notify me" on an ad page)
  const [alerts, setAlerts] = useState(null);
  useEffect(() => {
    if (!user) { setAlerts(null); return undefined; }
    let alive = true;
    api.functions.invoke('searchAlerts', { action: 'list' })
      .then((res) => { if (alive) setAlerts(res?.data?.alerts || []); })
      .catch(() => { if (alive) setAlerts([]); });
    return () => { alive = false; };
  }, [user?.id]);
  const turnOffAlert = async (id) => {
    try {
      await api.functions.invoke('searchAlerts', { action: 'delete', id });
      setAlerts((prev) => (prev || []).filter((a) => a.id !== id));
    } catch { window.alert('Could not turn the alert off. Please try again.'); }
  };
  // live / sold / expired / removed for each saved ad (asked from the server, as the saved copy is only a snapshot)
  const [adStatuses, setAdStatuses] = useState({});
  const savedIds = savedItems.map((i) => i.id).join(',');
  useEffect(() => {
    if (!savedIds) { setAdStatuses({}); return undefined; }
    let alive = true;
    api.functions.invoke('getAdStatuses', { ids: savedIds.split(',') })
      .then((res) => { if (alive && res?.data?.statuses) setAdStatuses(res.data.statuses); })
      .catch(() => {});
    return () => { alive = false; };
  }, [savedIds]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'liked') {
      setActiveTab('liked');
    } else if (tab === 'alerts') {
      setActiveTab('alerts');
    } else {
      setActiveTab('searches');
    }
    setSavedSearches(getSavedSearches());
  }, []);

  const handleDeleteAll = () => {
    if (!window.confirm('Are you sure you want to delete all saved ads?')) return;
    savedItems.forEach((item) => removeFavorite(item.id));
  };

  const handleRemoveSearch = (id) => {
    removeSavedSearch(id);
    setSavedSearches(getSavedSearches());
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
          <span className="text-foreground font-medium">{activeTab === 'liked' ? 'Saved Ads' : activeTab === 'alerts' ? 'Email Alerts' : 'Saved Searches'}</span>
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
            Saved Ads ({savedItems.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'alerts' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            Email Alerts{alerts ? ` (${alerts.length})` : ''}
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

        {/* Email Alerts Tab: the "Notify me" alerts */}
        {activeTab === 'alerts' && (
          <>
            {!user ? (
              <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
                <Bell className="w-14 h-14 text-muted-foreground opacity-30 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-lg font-medium text-foreground mb-2">Sign in to see your email alerts</p>
                <Link to="/login?next=%2Fsaved-searches%3Ftab%3Dalerts" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">Sign in</Link>
              </div>
            ) : alerts && alerts.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
                <Bell className="w-14 h-14 text-muted-foreground opacity-30 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-lg font-medium text-foreground mb-2">No email alerts yet</p>
                <p className="text-sm text-muted-foreground">Open an ad and press <span className="font-semibold">Notify me</span> to get an email when similar ads are placed.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">We email you once a day when new ads match one of these.</p>
                {(alerts || []).map((a) => (
                  <div key={a.id} className="bg-card rounded-xl border border-border shadow-sm px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.make ? 'New ads of this make' + (a.model ? ' and model' : '') : 'New ads in this category'}{a.created_date ? ` · set up ${formatDate(a.created_date)}` : ''}</p>
                    </div>
                    <button type="button" onClick={() => turnOffAlert(a.id)} className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline">
                      <Trash2 className="w-4 h-4" /> Turn off
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Saved Ads Tab */}
        {activeTab === 'liked' && (
          <>
            {savedItems.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
                <Heart className="w-14 h-14 text-muted-foreground opacity-30 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-lg font-medium text-foreground mb-2">No saved ads yet</p>
                <p className="text-sm text-muted-foreground mb-6">Tap the heart on any listing to save it here</p>
                <Link to="/" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                  Browse Listings
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-sm text-foreground font-medium">{savedItems.length} saved ad{savedItems.length === 1 ? '' : 's'}</p>
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete all saved ads
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {savedItems.map((item) => {
                    const state = AD_STATE[adStatuses[item.id]];
                    const gone = adStatuses[item.id] === 'removed';
                    return (
                      <div key={item.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className={state && !state.live ? 'opacity-60' : ''}>
                          <div className={gone ? 'pointer-events-none' : ''}>
                            <ListingCard item={item} saved onToggleSave={removeFavorite} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-sm">
                          <span className="text-foreground"><span className="font-semibold">Saved</span>{state ? <span className={state.live ? 'text-green-700' : 'text-muted-foreground'}> ({state.label})</span> : null}</span>
                          <button
                            type="button"
                            onClick={() => removeFavorite(item.id)}
                            className="inline-flex items-center gap-1.5 font-medium text-foreground hover:underline">
                            <Trash2 className="w-4 h-4" /> Remove from saved
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
      </PullToRefresh>
      <div className="mt-auto"><Footer /></div>
    </div>
  );
}