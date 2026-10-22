import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff } from 'lucide-react';
import BackButton from '../components/automarket/BackButton';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ListingCard from '../components/automarket/ListingCard';
import { userAdToListingItem } from '../hooks/useUserAds';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import { AD_STATE } from '@/lib/adStates';

// My Account > Notifications: every "Notify me" alert in one place, each with a Switch off button (which removes it from the list).
const formatDate = (iso) => {
  try { return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; }
};

// the card of the ad an alert was set up from (a copy kept with the alert, so it is still here once the ad is sold or gone)
const cardItem = (snap) => ({
  ...userAdToListingItem({
    id: snap.id, title: snap.title, price: snap.price, currency: snap.currency, photos: snap.image ? [snap.image] : [],
    vehicleYear: snap.vehicleYear, vehicleFuel: snap.vehicleFuel, mileage: snap.mileage, location: snap.location, created_date: snap.created_date,
  }),
  photos: snap.photo_count || 1,
});

export default function Notifications() {
  const { user, isLoadingAuth } = useAuth();
  const [alerts, setAlerts] = useState(null); // null while loading
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [adStatuses, setAdStatuses] = useState({}); // live / sold / expired / removed for the ads on the cards

  useEffect(() => {
    if (isLoadingAuth || !user) { setAlerts(null); return undefined; }
    let alive = true;
    api.functions.invoke('searchAlerts', { action: 'list' })
      .then((res) => { if (alive) setAlerts(res?.data?.alerts || []); })
      .catch((e) => { if (alive) { setAlerts([]); setError(e?.message || 'Could not load your notifications.'); } });
    return () => { alive = false; };
  }, [isLoadingAuth, user?.id]);

  const adIds = (alerts || []).map((a) => a.ad?.id).filter(Boolean).join(',');
  useEffect(() => {
    if (!adIds) { setAdStatuses({}); return undefined; }
    let alive = true;
    api.functions.invoke('getAdStatuses', { ids: adIds.split(',') })
      .then((res) => { if (alive && res?.data?.statuses) setAdStatuses(res.data.statuses); })
      .catch(() => {});
    return () => { alive = false; };
  }, [adIds]);

  const switchOff = async (id) => {
    setBusyId(id); setError('');
    try {
      await api.functions.invoke('searchAlerts', { action: 'delete', id });
      setAlerts((prev) => (prev || []).filter((a) => a.id !== id));
    } catch (e) {
      setError(e?.message || 'Could not switch the notification off. Please try again.');
    } finally {
      setBusyId('');
    }
  };

  const switchOffAll = async () => {
    if (!window.confirm('Are you sure you want to switch off all notifications?')) return;
    setBusyId('all'); setError('');
    const left = [];
    for (const a of alerts || []) {
      try { await api.functions.invoke('searchAlerts', { action: 'delete', id: a.id }); } catch { left.push(a); }
    }
    setAlerts(left);
    if (left.length) setError('Some notifications could not be switched off. Please try again.');
    setBusyId('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <Navbar />
      <div className="max-w-4xl w-full mx-auto px-4 py-4 flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Notifications</span>
        </div>

        <h1 className="text-xl font-bold text-foreground mb-1">Notifications</h1>
        <p className="text-sm text-muted-foreground mb-5">We email you once a day when a new ad matches one of these. Switch one off and it is removed from the list.</p>

        {!isLoadingAuth && !user ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
            <Bell className="w-14 h-14 text-muted-foreground opacity-30 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-lg font-medium text-foreground mb-4">Sign in to see your notifications</p>
            <Link to="/login?next=%2Fnotifications" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">Sign in</Link>
          </div>
        ) : alerts === null ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin" /></div>
        ) : alerts.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
            <Bell className="w-14 h-14 text-muted-foreground opacity-30 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-lg font-medium text-foreground mb-2">No notifications yet</p>
            <p className="text-sm text-muted-foreground">Open an ad and press <span className="font-semibold">Notify me</span> at the bottom to hear about similar ads.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-sm text-foreground font-medium">{alerts.length} notification{alerts.length === 1 ? '' : 's'}</p>
              <button
                type="button"
                onClick={switchOffAll}
                disabled={busyId === 'all'}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-60">
                <BellOff className="w-4 h-4" /> Switch off all
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {alerts.map((a) => {
                const state = a.ad ? AD_STATE[adStatuses[a.ad.id]] : null;
                const what = a.make ? `new ads of this make${a.model ? ' and model' : ''}` : 'new ads in this category';
                return (
                  <div key={a.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    {a.ad && (
                      <div className={state && !state.live ? 'opacity-60' : ''}>
                        <ListingCard item={cardItem(a.ad)} saved={false} onToggleSave={() => {}} hideSave />
                      </div>
                    )}
                    <div className={`flex items-center gap-3 px-4 py-3 ${a.ad ? 'border-t border-border' : ''}`}>
                      <span className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center shrink-0"><Bell className="w-4 h-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          We email you about {what}{a.created_date ? ` · since ${formatDate(a.created_date)}` : ''}
                          {state ? <span className={state.live ? 'text-green-700' : ''}> · The ad above: {state.label.toLowerCase()}</span> : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchOff(a.id)}
                        disabled={busyId === a.id || busyId === 'all'}
                        className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline disabled:opacity-60">
                        <BellOff className="w-4 h-4" /> Switch off
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      </div>
      <Footer />
    </div>
  );
}
