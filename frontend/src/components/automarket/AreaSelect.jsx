import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

/**
 * Area / Town field. The customer can always type their own place straight into the box; the arrow
 * opens a list of towns in the chosen county as a help. "Other (type your own)" sits at the top of the
 * list and simply clears the box and puts the cursor in it. The list opens only from the arrow (or the Down
 * key), never just because the box was clicked or typed in.
 */
export default function AreaSelect({ value, onChange, options, listDisabled, placeholder }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // close the list when clicking elsewhere
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  const pick = (town) => {
    onChange(town);
    setOpen(false);
  };

  const typeOwn = () => {
    onChange('');
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !listDisabled) { e.preventDefault(); setOpen(true); }
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder={placeholder}
        maxLength={80}
        autoComplete="off"
        className="w-full h-10 pl-3 pr-10 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
      />
      <button
        type="button"
        aria-label="Show towns in this county"
        aria-expanded={open}
        disabled={listDisabled}
        onClick={() => setOpen((o) => !o)}
        className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul role="listbox" className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-border bg-card shadow-lg py-1">
          <li>
            <button type="button" onClick={typeOwn} className="w-full text-left px-3 py-2 text-sm font-medium text-primary hover:bg-secondary">
              Other (type your own)
            </button>
          </li>
          {options.map((town) => (
            <li key={town} role="option" aria-selected={town === value}>
              <button
                type="button"
                onClick={() => pick(town)}
                className="w-full flex items-center justify-between text-left px-3 py-2 text-sm text-foreground hover:bg-secondary">
                <span>{town}</span>
                {town === value && <Check className="w-4 h-4 text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
