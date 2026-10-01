import React, { useState } from 'react';

import { api } from '@/api/apiClient';

// Car prices raised 2026-10-01 (0.99/2.99/6.99 -> 2.99/6.99/14.99); bike prices
// below are unaffected. This breaks the 2026-09-27 price parity with Apple's
// fixed IAP tiers (still 0.99/2.99/6.99 in App Store Connect) -- fine for now
// since iOS isn't live, but the IAP tiers need updating to match before iOS
// ships (see the matching note in backend/lambda/createCheckoutSession).
// Display copy only -- the server-side Price IDs in createCheckoutSession are
// what actually gets charged, but must stay in sync with these.
const packages = [
{
  name: "Basic",
  price: '€2.99',
  priceId: 'price_1ULfXLLCaYSUWHrbtm9T8gW7',
  iosProductId: 'ie.automax.app.listing.car.basic',
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
  price: '€6.99',
  priceId: 'price_1ULfYNLCaYSUWHrbA4GGQM6s',
  iosProductId: 'ie.automax.app.listing.car.standard',
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
  price: '€14.99',
  priceId: 'price_1ULfZfLCaYSUWHrbZmyMqnLh',
  iosProductId: 'ie.automax.app.listing.car.premium',
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
  price: '€0.99',
  priceId: 'price_1UKQ9ZLCaYSUWHrbiUuY0P4Y',
  iosProductId: 'ie.automax.app.listing.bike.basic',
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
  price: '€1.99',
  priceId: 'price_1UKQC5LCaYSUWHrbhECPK1QX',
  iosProductId: 'ie.automax.app.listing.bike.standard',
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
  price: '€2.99',
  priceId: 'price_1UKQF7LCaYSUWHrbYGpX8TJ5',
  iosProductId: 'ie.automax.app.listing.bike.premium',
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
