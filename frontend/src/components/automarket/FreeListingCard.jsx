import React from 'react';
import { Check } from 'lucide-react';
import { freePackageFor, freeLimitText } from '@/lib/freeListings';

// Shown instead of the Basic / Standard / Premium choice while the free launch offer is on (lib/freeListings.js).
export default function FreeListingCard({ isBikeCategory, sellerType }) {
  const pkg = freePackageFor(isBikeCategory);
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Your ad is free</h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">Free launch offer</span>
      </div>
      <div className="border-2 border-primary bg-primary/5 rounded-xl p-5">
        <p className="text-3xl font-bold text-foreground mb-3">€0</p>
        <ul className="flex flex-col gap-1.5">
          {[`${pkg.listingDays} day listing`, `Up to ${pkg.maxPhotos} photos`].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-foreground"><Check className="w-4 h-4 text-primary shrink-0" /> {f}</li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        No payment needed. Each account can have up to {freeLimitText(sellerType)} free ads live at a time.
      </p>
    </div>
  );
}
