import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { api } from '@/api/apiClient';
import { FREQUENCY_LABELS, criteriaChips, defaultName } from '@/lib/savedSearchTarget';

// "Save your search": the target taken from the ad (category, make and model, year and price range, county), a name, and how often
// to email. The year, price and county can be taken off to widen the search.
const REMOVABLE = { year: ['yearFrom', 'yearTo'], price: ['priceFrom', 'priceTo'], county: ['county'] };

export default function SaveSearchModal({ criteria, onClose, onSaved }) {
  const [target, setTarget] = useState(criteria);
  const [name, setName] = useState(() => defaultName(criteria));
  const [frequency, setFrequency] = useState('instant');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const chips = criteriaChips(target);
  const takeOff = (key) => setTarget((t) => ({ ...t, ...Object.fromEntries(REMOVABLE[key].map((f) => [f, ''])) }));

  const save = async () => {
    setBusy(true); setError('');
    try {
      const res = await api.functions.invoke('searchAlerts', { action: 'create', name: name.trim(), frequency, ...target });
      const alert = res?.data?.alert;
      if (!alert) throw new Error(res?.data?.error || 'Could not save the search.');
      onSaved(alert);
    } catch (e) {
      setError(e?.message || 'Could not save the search. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6" role="dialog" aria-modal="true" aria-label="Save your search" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Star className="w-5 h-5" /> Save your search</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Set up alerts and be the first to know when a new ad is listed.</p>

        <label htmlFor="saved-search-name" className="block text-sm text-muted-foreground mb-1.5">Name your saved search</label>
        <input id="saved-search-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />

        <div className="flex flex-wrap gap-2 mt-4 mb-5">
          {chips.map((c) => (
            <span key={c.key} className="inline-flex items-center gap-1 bg-secondary text-foreground text-xs font-medium rounded px-2 py-1.5">
              {c.label}
              {REMOVABLE[c.key] && (
                <button type="button" onClick={() => takeOff(c.key)} aria-label={`Take off ${c.label}`} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
              )}
            </span>
          ))}
        </div>

        <p className="text-sm font-semibold text-foreground mb-3">How often should we notify you?</p>
        <div className="flex flex-col gap-3 mb-5">
          {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="saved-search-frequency" checked={frequency === key} onChange={() => setFrequency(key)} className="w-5 h-5 accent-primary" />
              <span className={`text-base ${frequency === key ? 'font-semibold' : ''} text-foreground`}>{label}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button type="button" onClick={save} disabled={busy}
          className="w-full bg-primary text-primary-foreground font-semibold rounded-lg py-3 hover:bg-primary/90 transition-colors disabled:opacity-60">
          {busy ? 'Saving…' : 'Save search'}
        </button>
      </div>
    </div>
  );
}
