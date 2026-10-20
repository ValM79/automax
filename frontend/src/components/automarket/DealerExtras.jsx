import React from 'react';
import { ShieldCheck, ClipboardCheck, Truck } from 'lucide-react';

// Extras a Dealer can tick on an ad: Warranty, History and Delivery, each with an optional short detail
// ("12 months parts and labour", "Cartell history check available", "Free delivery within 50 km").
// Saved on the ad as dealerExtras = { warranty: { detail }, history: { detail }, delivery: { detail } }: only the ticked ones.
export const EXTRAS = [
  ['warranty', 'Warranty', 'e.g. 12 months parts and labour', ShieldCheck],
  ['history', 'History', 'e.g. Cartell history check available', ClipboardCheck],
  ['delivery', 'Delivery', 'e.g. Free delivery within 50 km', Truck],
];
export const EXTRA_DETAIL_MAX = 80;

export const emptyExtras = () => ({
  warranty: { on: false, detail: '' },
  history: { on: false, detail: '' },
  delivery: { on: false, detail: '' },
});

// the saved ad -> the form state
export function extrasFromAd(saved) {
  const out = emptyExtras();
  if (saved && typeof saved === 'object') {
    for (const [key] of EXTRAS) {
      if (saved[key]) out[key] = { on: true, detail: String(saved[key].detail || '') };
    }
  }
  return out;
}

// the form state -> what is saved on the ad (only the ticked extras)
export function extrasForSave(state) {
  const out = {};
  for (const [key] of EXTRAS) {
    if (state?.[key]?.on) out[key] = { detail: String(state[key].detail || '').replace(/\s+/g, ' ').trim().slice(0, EXTRA_DETAIL_MAX) };
  }
  return out;
}

// The tick boxes in the Place Ad / Edit Ad form (Dealer accounts only).
export function DealerExtrasFields({ value, onChange }) {
  const set = (key, patch) => onChange({ ...value, [key]: { ...value[key], ...patch } });
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">Tick what you offer with this vehicle. It is shown on your ad.</p>
      {EXTRAS.map(([key, label, placeholder, Icon]) => (
        <div key={key} className="flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={value[key].on} onChange={(e) => set(key, { on: e.target.checked })} className="w-4 h-4 accent-primary" />
            <Icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </label>
          {value[key].on && (
            <input
              type="text"
              value={value[key].detail}
              onChange={(e) => set(key, { detail: e.target.value })}
              maxLength={EXTRA_DETAIL_MAX}
              placeholder={`${placeholder} (optional)`}
              aria-label={`${label} details (optional)`}
              className="ml-7 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          )}
        </div>
      ))}
    </div>
  );
}

// What buyers see on the ad page: one line for each ticked extra.
export function DealerExtrasList({ extras }) {
  const ticked = EXTRAS.filter(([key]) => extras && extras[key]);
  if (!ticked.length) return null;
  return (
    <ul className="mt-4 flex flex-col gap-2" aria-label="Offered by the dealer">
      {ticked.map(([key, label, , Icon]) => (
        <li key={key} className="flex items-start gap-2.5 text-sm">
          <Icon className="w-4 h-4 mt-0.5 text-primary shrink-0" />
          <span><span className="font-medium text-foreground">{label}</span>{extras[key].detail ? <span className="text-muted-foreground">: {extras[key].detail}</span> : null}</span>
        </li>
      ))}
    </ul>
  );
}
