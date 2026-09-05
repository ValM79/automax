import React, { useState } from 'react';

import { api } from '@/api/apiClient';

const packages = [
{
  name: "Basic",
  price: '€1',
  priceId: 'price_1Tt1psLCaYSUWHrbcDdYqXfZ',
  listingDays: 60,
  maxPhotos: 12,
  bumps: 0,
  bumpIntervalWeeks: null,
  spotlightDays: 0,
  features: [
  '60 day listing',
  'Up to 12 photos']
},
{
  name: "Standard",
  price: '€3',
  priceId: 'price_1Tt1psLCaYSUWHrb387Sse6E',
  listingDays: 72,
  maxPhotos: 12,
  bumps: 2,
  bumpIntervalWeeks: 4,
  spotlightDays: 0,
  features: [
  '72 day listing',
  'Up to 12 photos',
  '2x bumps to the top',
  { text: '(1 every 4 weeks automatically)', note: true }]
},
{
  name: 'Premium',
  price: '€7',
  priceId: 'price_1Tt1psLCaYSUWHrbL4OVWgEl',
  listingDays: 90,
  maxPhotos: 12,
  bumps: 3,
  bumpIntervalWeeks: 3,
  spotlightDays: 5,
  features: [
  '90 day listing',
  'Up to 12 photos',
  '3x bumps to the top',
  { text: '(1 every 3 weeks automatically)', note: true },
  'Spotlight',
  { text: '(5 days in the top spot)', note: true }]
}];

const bikePackages = [
{
  name: "Basic",
  price: '€0.50',
  priceId: 'price_1Tt2C2LCaYSUWHrbr90lNcHP',
  listingDays: 30,
  maxPhotos: 12,
  bumps: 0,
  bumpIntervalWeeks: null,
  spotlightDays: 0,
  features: [
  '30 day listing',
  'Up to 12 photos']
},
{
  name: "Standard",
  price: '€1',
  priceId: 'price_1Tt1psLCaYSUWHrbnEu57cEf',
  listingDays: 60,
  maxPhotos: 12,
  bumps: 2,
  bumpIntervalWeeks: 4,
  spotlightDays: 0,
  features: [
  '60 day listing',
  'Up to 12 photos',
  '2x bumps to the top',
  { text: '(1 every 4 weeks automatically)', note: true }]
},
{
  name: 'Premium',
  price: '€3',
  priceId: 'price_1Tt1psLCaYSUWHrbZM6RqiAG',
  listingDays: 90,
  maxPhotos: 12,
  bumps: 3,
  bumpIntervalWeeks: 3,
  spotlightDays: 5,
  features: [
  '90 day listing',
  'Up to 12 photos',
  '3x bumps to the top',
  { text: '(1 every 3 weeks automatically)', note: true },
  'Spotlight',
  { text: '(5 days in the top spot)', note: true }]
}];





export { packages };

export default function AdPackageSelector({ selectedPackage, onPackageSelected, isBikeCategory }) {
  const activePackages = isBikeCategory ? bikePackages : packages;
  // isBikeCategory is true for: Bikes & Bicycles, Car Extras, Car Parts, Boat Extras, Other, Motorbike Extras
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground">Select your ad option</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {activePackages.map((pkg) => {
          const isSelected = selectedPackage?.name === pkg.name;
          return (
            <div
              key={pkg.name}
              onClick={() => onPackageSelected(pkg)}
              className={`relative border-2 rounded-xl flex flex-col overflow-hidden cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
              <div className="p-5 flex flex-col flex-1">
                <p className="text-sm text-foreground font-medium mb-1">{pkg.name}</p>
                <p className="text-3xl font-bold text-foreground mb-4">{pkg.price}</p>

                <ul className="flex flex-col gap-1.5 flex-1 mb-6">
                  {pkg.features.map((f, i) => {
                    if (typeof f === 'object' && f.note) {
                      return <li key={i} className="text-xs text-muted-foreground ml-5 -mt-1">{f.text}</li>;
                    }
                    return (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0 inline-block" />
                        {f}
                      </li>
                    );
                  })}
                </ul>

                <div className={`w-full text-center font-semibold py-2.5 rounded-lg text-sm transition-colors ${isSelected ? 'bg-primary text-white' : 'border border-foreground text-foreground'}`}>
                  {isSelected ? '✓ Selected' : 'Select'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {!selectedPackage && (
        <p className="text-xs text-muted-foreground text-center mt-3">Select a package above, then click "Sell Now" to proceed to payment.</p>
      )}
    </div>
  );
}