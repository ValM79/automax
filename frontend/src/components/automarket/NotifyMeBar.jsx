import React, { useState, useEffect } from 'react';
import { BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';

// "Don't miss the next one": an email alert for new listings of the same make and model as the ad you are looking at (or, when
// the ad has no make, of the same category). The emails are sent once a day by the server.
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
      setError(e?.message || 'Could not switch the alert off. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 sm:px-5 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BellRing className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{mine ? 'Your alert is on' : "Don't miss the next one"}</p>
            <p className="text-sm text-muted-foreground">
              {mine ? <>We will email you when a new <span className="font-medium text-foreground">{watch}</span> is listed.</> : <>Get an email when a new <span className="font-medium text-foreground">{watch}</span> is listed on AutoMax.</>}
            </p>
          </div>
        </div>
        {mine ? (
          <button type="button" onClick={turnOff} disabled={busy} className="shrink-0 h-10 px-4 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-60">
            Switch off
          </button>
        ) : (
          <button type="button" onClick={turnOn} disabled={busy} className="shrink-0 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60">
            Email me new listings
          </button>
        )}
      </div>
      {!mine && !user && <p className="text-xs text-muted-foreground mt-2 sm:pl-[3.25rem]">You will be asked to sign in so we know where to send the emails.</p>}
      {error && <p className="text-xs text-red-600 mt-2 sm:pl-[3.25rem]">{error}</p>}
    </div>
  );
}
