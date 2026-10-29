import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/api/apiClient';
import { IRISH_COUNTIES } from '@/lib/counties';
import { priceOptions } from '@/lib/priceOptions';
import { mileageOptions } from '@/lib/mileageOptions';
import { FREQUENCY_LABELS, defaultName } from '@/lib/savedSearchTarget';
import MobileSelect from './MobileSelect';
import MakeSelector from './MakeSelector';
import ModelSelector from './ModelSelector';
import ModelTypeSelector, { trimsFor } from './ModelTypeSelector';
import { categoryVehicles } from './categoryVehicles';

// "Create search" on the Notifications page: the person picks what to look for (section, make, model, year and price range,
// county) instead of saving it from an ad. It is stored as the same card as a search saved from an ad.
const SECTIONS = ['Cars', 'Electric & Hybrid Cars', 'Motorbikes', 'Quads', 'Scooters', 'Vintage Bikes', 'Commercials', 'Trucks', 'Coaches & Buses', 'Campers', 'Caravans', 'Trailers', 'Plant Machinery', 'Boats & Jet Skis'];
const years = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => String(2026 - i));
const euros = (v) => (v ? Number(String(v).replace(/[^0-9]/g, '')) : '');
// '0 km' is the same as no lower limit
const kms = (v) => euros(v) || '';

export default function NewSavedSearchForm({ onClose, onSaved }) {
  const [subsection, setSubsection] = useState('Cars');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trims, setTrims] = useState([]);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [mileageFrom, setMileageFrom] = useState('');
  const [mileageTo, setMileageTo] = useState('');
  const [county, setCounty] = useState('');
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('instant');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const cv = categoryVehicles(subsection); // Quads, Boats ... have their own makes and models; cars use the car lists
  const target = { subsection, make, model: make ? model : '', trims: make && model ? trims : [] };
  const shownName = name || defaultName(target);

  const changeSection = (v) => { setSubsection(v); setMake(''); setModel(''); setTrims([]); };
  const changeMake = (v) => { setMake(v); setModel(''); setTrims([]); };
  const changeModel = (v) => { setModel(v); setTrims([]); };

  const save = async () => {
    if (!subsection && !make) { setError('Choose a section or a make.'); return; }
    setBusy(true); setError('');
    try {
      const res = await api.functions.invoke('searchAlerts', {
        action: 'create', name: shownName, frequency, ...target,
        yearFrom: yearFrom || '', yearTo: yearTo || '', priceFrom: euros(priceFrom), priceTo: euros(priceTo), mileageFrom: kms(mileageFrom), mileageTo: kms(mileageTo), county,
      });
      const alert = res?.data?.alert;
      if (!alert) throw new Error(res?.data?.error || 'Could not save the search.');
      onSaved(alert);
    } catch (e) {
      setError(e?.message || 'Could not save the search. Please try again.');
      setBusy(false);
    }
  };

  const label = 'block text-sm font-medium text-foreground mb-1.5';
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-5 mb-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-foreground">Create new search</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Choose what you are looking for. We email you when a new ad matches.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={label}>Section</label>
          <MobileSelect value={subsection} onChange={changeSection} options={SECTIONS} placeholder="Any section" sizeClass="text-base" />
        </div>
        <div>
          <label className={label}>Make</label>
          <MakeSelector key={subsection} makes={cv ? cv.makes : undefined} value={make} onChange={changeMake} />
        </div>
        <div>
          <label className={label}>Model</label>
          <ModelSelector key={subsection} modelsMap={cv ? cv.models : undefined} make={make} value={model} onChange={changeModel} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Model types</label>
          <ModelTypeSelector make={make} model={model} options={trimsFor([], make, model, cv ? cv.typesFor(make, model) : undefined)} value={trims} onChange={setTrims} showCounts={false} />
        </div>
        <div>
          <label className={label}>Year</label>
          <div className="grid grid-cols-2 gap-2">
            <MobileSelect value={yearFrom} onChange={setYearFrom} options={years} placeholder="From" />
            <MobileSelect value={yearTo} onChange={setYearTo} options={years} placeholder="To" />
          </div>
        </div>
        <div>
          <label className={label}>Price (€)</label>
          <div className="grid grid-cols-2 gap-2">
            <MobileSelect value={priceFrom} onChange={setPriceFrom} options={priceOptions} placeholder="From" />
            <MobileSelect value={priceTo} onChange={setPriceTo} options={priceOptions} placeholder="To" />
          </div>
        </div>
        <div>
          <label className={label}>Mileage (km)</label>
          <div className="grid grid-cols-2 gap-2">
            <MobileSelect value={mileageFrom} onChange={setMileageFrom} options={mileageOptions} placeholder="From" />
            <MobileSelect value={mileageTo} onChange={setMileageTo} options={mileageOptions} placeholder="To" />
          </div>
        </div>
        <div>
          <label className={label}>Location</label>
          <MobileSelect value={county} onChange={setCounty} options={IRISH_COUNTIES} placeholder="All Ireland" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="new-search-name" className={label}>Name your saved search <span className="text-muted-foreground font-normal">(optional)</span></label>
          <input id="new-search-name" value={name} maxLength={80} placeholder={shownName} onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-lg px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
      </div>

      <p className="text-sm font-semibold text-foreground mt-5 mb-3">How often should we notify you?</p>
      <div className="flex flex-wrap gap-x-6 gap-y-3 mb-5">
        {Object.entries(FREQUENCY_LABELS).map(([key, text]) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="new-search-frequency" checked={frequency === key} onChange={() => setFrequency(key)} className="w-5 h-5 accent-primary" />
            <span className={`text-base text-foreground ${frequency === key ? 'font-semibold' : ''}`}>{text}</span>
          </label>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={save} disabled={busy}
          className="bg-primary text-primary-foreground font-semibold rounded-lg px-6 py-3 hover:bg-primary/90 transition-colors disabled:opacity-60">{busy ? 'Saving…' : 'Save search'}</button>
        <button type="button" onClick={onClose} className="border border-border rounded-lg px-6 py-3 font-medium text-foreground hover:bg-secondary transition-colors">Cancel</button>
      </div>
    </div>
  );
}
