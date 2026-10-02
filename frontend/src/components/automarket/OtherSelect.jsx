import React from 'react';
import { X } from 'lucide-react';
import MobileSelect from './MobileSelect';

/**
 * Dropdown with an "Other" option at the bottom that switches to a free-text input.
 * Mirrors the behaviour of the "Make" field in PlaceAd.
 *
 * When "Other" is selected (or value is a custom string not in options),
 * a text input is rendered instead of the select.
 * The sentinel value '__other__' represents an empty custom input.
 */
export default function OtherSelect({ value, onChange, options, placeholder = 'Select...', enterLabel = 'Enter...' }) {
  const isCustom = value === '__other__' || (value !== '' && !options.includes(value));

  if (isCustom) {
    return (
      <div className="relative">
        <input
          type="text"
          value={value === '__other__' ? '' : value}
          onChange={(e) => onChange(e.target.value || '__other__')}
          placeholder={enterLabel}
          // Only focus when the user has just picked "Other" and has nothing typed yet;
          // an already-saved custom value (e.g. when editing an ad) must not steal
          // focus and scroll the page to this field on load.
          autoFocus={value === '__other__'}
          className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-9"
        />
        <X
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => onChange('')}
        />
      </div>
    );
  }

  return (
    <MobileSelect
      value={value}
      onChange={(val) => onChange(val === 'Other' ? '__other__' : val)}
      options={[...options, 'Other']}
      placeholder={placeholder}
    />
  );
}