import React from 'react';
import { X } from 'lucide-react';
import MobileSelect from './MobileSelect';
import OtherSelect from './OtherSelect';
import { categoryVehicles } from './categoryVehicles';

const inputCls = 'w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

// Make / Model / Model type / Body type for the categories that have their own lists (Quads, Boats & Jet Skis, ...).
// Writes the same form fields the car block does: vehicleMake, vehicleModel, vehicleTrim and bodyType.
export default function CategoryVehicleFields({ form, setForm, category }) {
  const cv = categoryVehicles(category);
  if (!cv) return null;

  const make = form.vehicleMake === '__other__' ? '' : form.vehicleMake;
  const makeKey = make && Object.keys(cv.models).find((k) => k.toLowerCase() === make.toLowerCase());
  const models = makeKey ? cv.models[makeKey].map((m) => m.name) : null;
  const customMake = form.vehicleMake === '__other__' || (form.vehicleMake !== '' && !makeKey);
  const customModel = form.vehicleModel === '__other__' || (form.vehicleModel !== '' && models && !models.includes(form.vehicleModel));
  const model = form.vehicleModel === '__other__' ? '' : form.vehicleModel;
  const types = cv.types[`${make}|${model}`.toLowerCase()] || [];

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Make</label>
        {customMake ? (
          <div className="relative">
            <input type="text" value={make} autoFocus placeholder="Enter make..."
              onChange={(e) => setForm((f) => ({ ...f, vehicleMake: e.target.value || '__other__', vehicleModel: '' }))}
              className={`${inputCls} pr-9`} />
            <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => setForm((f) => ({ ...f, vehicleMake: '', vehicleModel: '' }))} />
          </div>
        ) : (
          <MobileSelect value={form.vehicleMake} placeholder="Select make..." options={[...cv.makes, 'Other']}
            onChange={(val) => setForm((f) => ({ ...f, vehicleMake: val === 'Other' ? '__other__' : val, vehicleModel: '', vehicleTrim: '' }))} />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Model</label>
        {!models || customModel ? (
          <div className="relative">
            <input type="text" value={model} placeholder="Enter model..." autoFocus={!!customModel}
              onChange={(e) => setForm((f) => ({ ...f, vehicleModel: e.target.value || '__other__' }))}
              className={`${inputCls} pr-9`} />
            <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => setForm((f) => ({ ...f, vehicleModel: '' }))} />
          </div>
        ) : (
          <MobileSelect value={form.vehicleModel} placeholder="Select model..." options={[...models, 'Other']}
            onChange={(val) => setForm((f) => ({ ...f, vehicleModel: val === 'Other' ? '__other__' : val, vehicleTrim: '' }))} />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Model type <span className="text-muted-foreground font-normal">(optional)</span></label>
        <input type="text" value={form.vehicleTrim || ''} maxLength={40} list="category-trim-suggestions" placeholder="Model type"
          onChange={(e) => setForm((f) => ({ ...f, vehicleTrim: e.target.value }))} className={inputCls} />
        <datalist id="category-trim-suggestions">
          {types.map((t) => <option key={t} value={t} />)}
        </datalist>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Body type</label>
        <OtherSelect value={form.bodyType} options={cv.bodyTypes} placeholder="Select..." enterLabel="Enter body type..."
          onChange={(val) => setForm((f) => ({ ...f, bodyType: val }))} />
      </div>
    </div>
  );
}
