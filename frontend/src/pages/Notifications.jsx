import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, BellRing, ChevronDown, Check } from 'lucide-react';
import BackButton from '../components/automarket/BackButton';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import { FREQUENCY_LABELS, criteriaLine } from '@/lib/savedSearchTarget';

// My Account > Notifications: the searches you saved, each a target (what to look for), not an ad. Each one has how often we email
// you about new matching ads (instant, daily or none) and a Remove button.
const FREQUENCY_ICONS = { instant: BellRing, daily: Bell, off: BellOff };

function FrequencyMenu({ value, disabled, onChange }) {
  const [open, setOpen] = useState(false);
  const Icon = FREQUENCY_ICONS[value] || Bell;
  return (
    <div className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline disabled:opacity-60">
        <Icon className="w-5 h-5" /> {FREQUENCY_LABELS[value] || FREQUENCY_LABELS.daily} <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <ul role="listbox" className="absolute right-0 bottom-full mb-2 z-20 w-52 bg-card border border-border rounded-lg shadow-lg py-2">
            {Object.entries(FREQUENCY_LABELS).map(([key, label]) => {
              const ItemIcon = FREQUENCY_ICONS[key];
              return (
                <li key={key}>
                  <button type="button" role="option" aria-selected={value === key} onClick={() => { setOpen(false); if (key !== value) onChange(key); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary">
                    <ItemIcon className="w-5 h-5 text-primary" /> <span className="flex-1 text-left">{label}</span>
                    {value === key && <Check className="w-4 h-4 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default function Notifications() {
  const { user, isLoadingAuth } = useAuth();
  const [searches, setSearches] = useState(null); // null while loading
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    if (isLoadingAuth || !user) { setSearches(null); return undefined; }
    let alive = true;
    api.functions.invoke('searchAlerts', { action: 'list' })
      .then((res) => { if (alive) setSearches(res?.data?.alerts || []); })
      .catch((e) => { if (alive) { setSearches([]); setError(e?.message || 'Could not load your saved searches.'); } });
    return () => { alive = false; };
  }, [isLoadingAuth, user?.id]);

  const changeFrequency = async (id, frequency) => {
    setBusyId(id); setError('');
    try {
      const res = await api.functions.invoke('searchAlerts', { action: 'update', id, frequency });
      const next = res?.data?.alert;
      setSearches((prev) => (prev || []).map((s) => (s.id === id ? { ...s, ...(next || { frequency }) } : s)));
    } catch (e) {
      setError(e?.message || 'Could not change the alerts. Please try again.');
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id) => {
    setBusyId(id); setError('');
    try {
      await api.functions.invoke('searchAlerts', { action: 'delete', id });
      setSearches((prev) => (prev || []).filter((s) => s.id !== id));
    } catch (e) {
      setError(e?.message || 'Could not remove the saved search. Please try again.');
    } finally {
      setBusyId('');
    }
  };

  const removeAll = async () => {
    if (!window.confirm('Are you sure you want to remove all your saved searches?')) return;
    setBusyId('all'); setError('');
    const left = [];
    for (const s of searches || []) {
      try { await api.functions.invoke('searchAlerts', { action: 'delete', id: s.id }); } catch { left.push(s); }
    }
    setSearches(left);
    if (left.length) setError('Some saved searches could not be removed. Please try again.');
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

        <h1 className="text-xl font-bold text-foreground mb-1">Saved searches</h1>
        <p className="text-sm text-muted-foreground mb-5">We email you when a new ad matches one of your saved searches. Choose how often for each one, or remove it.</p>

        {!isLoadingAuth && !user ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
            <Bell className="w-14 h-14 text-muted-foreground opacity-30 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-lg font-medium text-foreground mb-4">Sign in to see your saved searches</p>
            <Link to="/login?next=%2Fnotifications" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">Sign in</Link>
          </div>
        ) : searches === null ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin" /></div>
        ) : searches.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
            <Bell className="w-14 h-14 text-muted-foreground opacity-30 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-lg font-medium text-foreground mb-2">No saved searches yet</p>
            <p className="text-sm text-muted-foreground">Open an ad and press <span className="font-semibold">Save search</span> at the bottom to hear about similar ads.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-sm text-foreground font-medium">{searches.length} saved search{searches.length === 1 ? '' : 'es'}</p>
              <button type="button" onClick={removeAll} disabled={busyId === 'all'}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-60">
                Remove all
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {searches.map((s) => (
                <div key={s.id} className="bg-card rounded-xl border border-border shadow-sm">
                  <div className="px-5 pt-4 pb-3">
                    <p className="font-bold text-foreground">{s.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{criteriaLine(s)}</p>
                  </div>
                  <div className="flex items-stretch border-t border-border">
                    <div className="flex-1 flex items-center justify-end px-5 py-3">
                      <button type="button" onClick={() => remove(s.id)} disabled={busyId === s.id || busyId === 'all'}
                        className="text-sm font-semibold text-primary hover:underline disabled:opacity-60">Remove</button>
                    </div>
                    <div className="border-l border-border px-5 py-3 flex items-center min-w-[11rem] justify-center">
                      <FrequencyMenu value={s.frequency} disabled={busyId === s.id || busyId === 'all'} onChange={(f) => changeFrequency(s.id, f)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      </div>
      <Footer />
    </div>
  );
}
