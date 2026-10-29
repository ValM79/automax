import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import MobileSelect from './MobileSelect';
import { priceOptions } from '@/lib/priceOptions';

const counties = ['All Ireland', 'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Mayo', 'Kerry', 'Clare', 'Tipperary', 'Roscommon', 'Westmeath', 'Wexford', 'Wicklow', 'Meath', 'Kildare', 'Other'];

const years = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => String(2026 - i));

function Section({ title, defaultOpen = true, children, alwaysOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (alwaysOpen) {
    return (
      <div className="border-b border-border py-4">
        <div className="text-base font-semibold text-foreground mb-4">{title}</div>
        {children}
      </div>);
  }
  return (
    <div className="border-b border-border py-4">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full text-base font-semibold text-foreground">
        {title}
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>);

}

function Sel({ value, onChange, options, placeholder }) {
  return <MobileSelect value={value} onChange={onChange} options={options} placeholder={placeholder} />;
}

export default function SimpleFiltersSidebar({ onFilterChange, onReset, hideYear = false, alwaysOpen = false, dealerLabel = 'Dealership' }) {
  const [county, setCounty] = useState('All Ireland');
  const [customLocation, setCustomLocation] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [sellerTypes, setSellerTypes] = useState([]);
  const [adType, setAdType] = useState('All');

  const effectiveCounty = county === 'Other' ? customLocation : county;
  const currentFilters = { county: effectiveCounty, priceFrom, priceTo, yearFrom, yearTo, sellerTypes, adType };

  const handleReset = () => {
    setCounty('All Ireland');
    setCustomLocation('');
    setPriceFrom('');
    setPriceTo('');
    setYearFrom('');
    setYearTo('');
    setSellerTypes([]);
    setAdType('All');
    if (onReset) onReset();
  };

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(currentFilters);
    }
  }, [county, customLocation, priceFrom, priceTo, yearFrom, yearTo, sellerTypes, adType]);

  return (
    <div className="text-base ml-1">
      {/* Top Search button */}
      <button className="flex items-center justify-center gap-2 w-full bg-primary text-white rounded-lg px-4 py-3 hover:bg-primary/90 transition-colors mb-5 font-semibold text-base">
        Search
      </button>

      {/* Filters header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-lg text-foreground">Filters</span>
        <button onClick={handleReset} className="text-sm text-primary hover:underline mx-3">Reset All</button>
      </div>

      {/* Ad type */}
      <Section title="Ad type" alwaysOpen={alwaysOpen}>
        <div className="flex flex-col gap-2.5">
          {['All', 'For Sale', 'Wanted'].map((label) =>
            <label key={label} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="adType" checked={adType === label} onChange={() => setAdType(label)} className="w-4 h-4 accent-primary" />
              <span className="text-base text-foreground">{label}</span>
            </label>
          )}
        </div>
      </Section>

      {/* Location */}
      <Section title="Location" alwaysOpen={alwaysOpen}>
        {county === 'Other' ? (
          <div className="relative">
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="Enter location..."
              className="w-full border border-border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-9" />
            <button
              type="button"
              onClick={() => { setCounty('All Ireland'); setCustomLocation(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Sel value={county} onChange={setCounty} options={counties} />
        )}
      </Section>

      {/* Year */}
      {!hideYear &&
      <Section title="Year" alwaysOpen={alwaysOpen}>
        <div className="grid grid-cols-2 gap-2">
          <Sel value={yearFrom} onChange={setYearFrom} options={years} placeholder="From" />
          <Sel value={yearTo} onChange={setYearTo} options={years} placeholder="To" />
        </div>
      </Section>
      }

      {/* Price */}
      <Section title="Price" alwaysOpen={alwaysOpen}>
        <p className="text-sm text-muted-foreground mb-2">€ EUR</p>
        <div className="grid grid-cols-2 gap-2">
          <Sel value={priceFrom} onChange={setPriceFrom} options={priceOptions} placeholder="From" />
          <Sel value={priceTo} onChange={setPriceTo} options={priceOptions} placeholder="To" />
        </div>
      </Section>

      {/* Seller type */}
      <Section title="Seller type" alwaysOpen={alwaysOpen}>
        <div className="grid grid-cols-2 gap-2">
          {[dealerLabel, 'Private seller', 'Both'].map((label) => {
            const selected = label === 'Both' ? sellerTypes.length === 0 : sellerTypes.includes(label);
            return (
              <button
                key={label}
                onClick={() => {
                  if (label === 'Both') { setSellerTypes([]); }
                  else { setSellerTypes(sellerTypes.includes(label) ? [] : [label]); }
                }}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium border transition-colors text-left ${selected ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold' : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300'}`}>
                {label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Bottom Search button */}
      <button className="flex items-center justify-center gap-2 w-full bg-primary text-white rounded-lg px-4 py-3 hover:bg-primary/90 transition-colors mt-5 font-semibold text-base">
        Search
      </button>
    </div>);

}