import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export default function MobileSelect({ value, onChange, options, placeholder, className = '', disabled = false, sizeClass = 'text-sm' }) {
  const [open, setOpen] = useState(false);
  const displayValue = value || placeholder || 'Select...';

  // While the list is open, stop the page behind it from scrolling (overflow only: no position:fixed trick, which made the
  // page jump to the top in the Android app) and let Escape close it.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <>
      {/* Desktop: native select */}
      <div className={`relative hidden md:block ${className}`}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full h-11 appearance-none border border-border rounded-md px-3 ${sizeClass} bg-card hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary/40 pr-8 text-foreground transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-card`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Mobile: button that opens bottom drawer */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={`md:hidden w-full h-11 flex items-center justify-between border border-border rounded-md px-3 ${sizeClass} bg-card text-foreground transition-colors ${className} ${disabled ? 'cursor-not-allowed text-muted-foreground' : ''}`}
      >
        <span className={value ? '' : 'text-muted-foreground'}>{displayValue}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>

      {open && createPortal(
        <div className="md:hidden fixed inset-0 z-[90]" role="dialog" aria-modal="true">
          {/* Dim background: tap to close */}
          <div className="absolute inset-0 bg-black/60 animate-in fade-in-0 duration-150" onClick={() => setOpen(false)} />
          {/* Sheet sits above the bottom tab bar (z-70), so the whole list stays visible */}
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-[10px] border bg-background animate-in slide-in-from-bottom duration-200"
            style={{ maxHeight: '75dvh' }}
          >
            <button type="button" className="flex flex-col items-center gap-0.5 pt-3 pb-2 text-base font-semibold text-foreground" onClick={() => setOpen(false)}>
              Close
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="overflow-y-auto overscroll-contain px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
              {placeholder && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors mb-1 ${!value ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-secondary text-foreground'}`}
                >
                  {placeholder}
                </button>
              )}
              {options.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => { onChange(o); setOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base transition-colors flex items-center justify-between mb-1 ${value === o ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-secondary text-foreground'}`}
                >
                  {o}
                  {value === o && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}