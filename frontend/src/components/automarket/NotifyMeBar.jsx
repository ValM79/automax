import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';

// "Save this search to get notifications of similar ads - Notify me" on an ad page. It creates an email alert for new ads of the
// same make and model (or, when the ad has none, of the same category). The emails are sent once a day by the server.
const lower = (v) => String(v ?? '').trim().toLowerCase();

// the make / model / category of the ad (a saved copy of an ad can carry them in different places)
function criteriaOf(ad) {
  const raw = ad?._raw || ad || {};
  return {
    make: raw.vehicleMake || ad?.vehicleMake || '',
    model: raw.vehicleModel || ad?.vehicleModel || '',
    subsection: raw.subsection || ad?.subsection || '',
  };
}

export default function NotifyMeBar({ ad }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState(() => criteriaOf(ad));
  const [alerts, setAlerts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // a card opened from a list may not carry the make / model: read the ad itself then
  useEffect(() => {
    const c = criteriaOf(ad);
    setCriteria(c);
    if (c.make || c.subsection || !ad?.id) return undefined;
    let alive = true;
    api.entities.UserAd.get(ad.id).then((full) => { if (alive && full) setCriteria(criteriaOf(full)); }).catch(() => {});
    return () => { alive = false; };
  }, [ad?.id]);

  useEffect(() => {
    if (!user) { setAlerts([]); return undefined; }
    let alive = true;
    api.functions.invoke('searchAlerts', { action: 'list' })
      .then((res) => { if (alive) setAlerts(res?.data?.alerts || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [user?.id]);

  const ownerId = ad?.created_by_id || ad?._raw?.created_by_id;
  if (user && ownerId && ownerId === user.id) return null; // your own ad
  if (!criteria.make && !criteria.subsection) return null;

  const watch = criteria.make ? [criteria.make, criteria.model].filter(Boolean).join(' ') : criteria.subsection;
  const mine = alerts.find((a) => lower(a.make) === lower(criteria.make) && lower(a.model) === lower(criteria.make ? criteria.model : '') && lower(a.subsection) === lower(criteria.subsection));

  const turnOn = async () => {
    if (!user) { navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; }
    setBusy(true); setError('');
    try {
      const res = await api.functions.invoke('searchAlerts', { action: 'create', ...criteria });
      const created = res?.data?.alert;
      if (created) setAlerts((prev) => [created, ...prev.filter((a) => a.id !== created.id)]);
    } catch (e) {
      setError(e?.message || 'Could not set up the alert. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true); setError('');
    try {
      await api.functions.invoke('searchAlerts', { action: 'delete', id: mine.id });
      setAlerts((prev) => prev.filter((a) => a.id !== mine.id));
    } catch (e) {
      setError(e?.message || 'Could not turn the alert off. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl bg-secondary/60 px-4 sm:px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-foreground">
          {mine
            ? <>We will email you when new <span className="font-semibold">{watch}</span> ads are placed.</>
            : <>Save this search to get notifications of similar ads</>}
        </p>
        {mine ? (
          <button type="button" onClick={turnOff} disabled={busy} className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline disabled:opacity-60">
            <BellOff className="w-5 h-5" /> Turn off
          </button>
        ) : (
          <button type="button" onClick={turnOn} disabled={busy} className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline disabled:opacity-60">
            <Bell className="w-5 h-5" /> Notify me
          </button>
        )}
      </div>
      {!mine && !user && <p className="text-xs text-muted-foreground mt-1">You will be asked to sign in so we know where to send the emails.</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
