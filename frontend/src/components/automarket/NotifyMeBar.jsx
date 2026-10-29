import React, { useState, useEffect } from 'react';
import { Bell, BellPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import { criteriaFromAd, sameTarget, FREQUENCY_LABELS } from '@/lib/savedSearchTarget';
import SaveSearchModal from './SaveSearchModal';

// "Save search" at the bottom of an ad: opens the Save your search window, with the target (category, make and model, year and price
// range, county) taken from the ad. The search is kept in My Account > Notifications, where its alerts can be changed or removed.
export default function NotifyMeBar({ ad }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState(() => criteriaFromAd(ad));
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);

  // a card opened from a list may not carry the make / model / year / price: read the ad itself then
  useEffect(() => {
    const c = criteriaFromAd(ad);
    setCriteria(c);
    if (ad?._raw || !ad?.id) return undefined;
    let alive = true;
    api.entities.UserAd.get(ad.id).then((full) => { if (alive && full) setCriteria(criteriaFromAd(full)); }).catch(() => {});
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

  const mine = alerts.find((a) => sameTarget(a, criteria));

  const start = () => {
    if (!user) { navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`); return; }
    setOpen(true);
  };

  return (
    <div className="rounded-xl bg-secondary/60 px-4 sm:px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        {mine ? (
          <>
            <p className="text-sm text-foreground">
              Saved as <span className="font-semibold">{mine.name}</span> · {FREQUENCY_LABELS[mine.frequency] || 'Daily alerts'}
            </p>
            <Link to="/notifications" className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline">
              Manage <Bell className="w-5 h-5" />
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-foreground">Get an alert when new ads like this are listed.</p>
            <button type="button" onClick={start} className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline">
              Save search <BellPlus className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
      {!mine && !user && <p className="text-xs text-muted-foreground mt-1">You will be asked to sign in so we know where to send the emails.</p>}
      {open && (
        <SaveSearchModal
          criteria={criteria}
          onClose={() => setOpen(false)}
          onSaved={(saved) => { setAlerts((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]); setOpen(false); }} />
      )}
    </div>
  );
}
