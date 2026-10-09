import React from 'react';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OTHER_AREA } from '@/lib/irishTowns';

/**
 * Area / Town picker: a dropdown of the towns in the chosen county, plus "Other (enter your own)"
 * which turns the field into a text box. A saved value that is not in the list (a typed place, or an
 * older saved area) is shown as text, so nothing a user saved is lost or looks blank.
 *
 * value: the area text. OTHER_AREA means "Other was picked, nothing typed yet".
 */
export default function AreaSelect({ value, onChange, options, disabled, placeholder }) {
  const isCustom = value === OTHER_AREA || (!!value && !options.includes(value));

  if (isCustom) {
    return (
      <div className="relative">
        <input
          type="text"
          value={value === OTHER_AREA ? '' : value}
          onChange={(e) => onChange(e.target.value || OTHER_AREA)}
          placeholder="Enter your area or town"
          autoFocus={value === OTHER_AREA}
          maxLength={80}
          className="w-full h-10 px-3 pr-9 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
        />
        <button
          type="button"
          aria-label="Choose from the list instead"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-10 bg-card"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
        <SelectItem value={OTHER_AREA}>Other (enter your own)</SelectItem>
      </SelectContent>
    </Select>
  );
}
