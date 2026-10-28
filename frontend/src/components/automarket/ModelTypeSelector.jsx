import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// "Model types": the trims / versions (Life, Pro Plus, Style ...) of the make and model picked above it, as a search box with a
// tick list. `options` is [{ name, count }] taken from the ads that are for sale now; `value` is the list of ticked names.
export default function ModelTypeSelector({ make, model, options = [], value = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef(null);
  const disabled = !make || !model;

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); };
  }, [open]);

  const shown = options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (name) => onChange(value.includes(name) ? value.filter((x) => x !== name) : [...value, name]);
  const summary = value.length === 0 ? '' : value.join(', ');

  return (
    <div className="relative" ref={boxRef}>
      <div
        className={`w-full h-11 flex items-center gap-2 border border-border rounded-md px-3 text-base ${disabled ? 'bg-card text-muted-foreground cursor-not-allowed' : 'bg-card hover:bg-secondary focus-within:ring-1 focus-within:ring-primary/40'}`}
      >
        <input
          type="text"
          disabled={disabled}
          value={open ? query : summary}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Model types"
          aria-label="Model types"
          className="flex-1 min-w-0 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        />
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>

      {open && !disabled && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg max-h-72 overflow-y-auto py-1">
          {options.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No model types are listed for this model yet.</p>
          ) : (
            <>
              <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-secondary">
                <input type="checkbox" checked={value.length === 0} onChange={() => onChange([])} className="w-5 h-5 accent-primary" />
                <span className="text-base text-foreground font-medium">All trims</span>
              </label>
              {shown.map((o) => (
                <label key={o.name} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-secondary">
                  <input type="checkbox" checked={value.includes(o.name)} onChange={() => toggle(o.name)} className="w-5 h-5 accent-primary" />
                  <span className="text-base text-foreground flex-1">{o.name}</span>
                  <span className="text-sm text-muted-foreground">{o.count}</span>
                </label>
              ))}
              {shown.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">Nothing matches "{query}".</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// the trims found on a list of ads for one make and model, most common first: [{ name, count }]
export function trimsFor(ads, make, model) {
  const low = (x) => String(x || '').trim().toLowerCase();
  const found = new Map();
  (ads || []).forEach((a) => {
    const t = String(a.vehicleTrim || '').trim();
    if (!t || low(a.vehicleMake) !== low(make) || low(a.vehicleModel) !== low(model)) return;
    const k = low(t);
    const cur = found.get(k);
    if (cur) cur.count += 1; else found.set(k, { name: t, count: 1 });
  });
  return [...found.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
