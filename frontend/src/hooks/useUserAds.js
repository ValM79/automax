import { useState, useEffect } from 'react';
import { sellerTypeOf } from '@/lib/accountType';
import { api } from '@/api/apiClient';

/**
 * Fetches active user ads whose title or vehicleMake matches the given make keyword.
 * e.g. make = 'bmw' will match ads with 'BMW' anywhere in title or vehicleMake.
 */
// Lower-case, drop accents (Citroën = Citroen) and treat any punctuation as a space, so the
// page address "mercedes-benz" matches an ad saved as "Mercedes-Benz" (before this the address
// became "mercedes benz" and never matched the hyphenated name, so those ads never showed).
export function normalizeForMatch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function useUserAdsByMake(make) {
  const [userAds, setUserAds] = useState([]);

  useEffect(() => {
    if (!make) return;
    const keyword = normalizeForMatch(make);
    api.entities.UserAd.filter({ status: 'active' }, '-created_date', 3000000)
      .then(ads => {
        const now = Date.now();
        const matched = ads.filter(ad => {
          if (ad.listingDays && ad.created_date) {
            const expiresAt = new Date(ad.created_date).getTime() + ad.listingDays * 24 * 60 * 60 * 1000;
            if (now > expiresAt) return false;
          }
          const titleMatch = ad.title && normalizeForMatch(ad.title).includes(keyword);
          const makeMatch = ad.vehicleMake && normalizeForMatch(ad.vehicleMake).includes(keyword);
          const modelMatch = ad.vehicleModel && normalizeForMatch(ad.vehicleModel).includes(keyword);
          return titleMatch || makeMatch || modelMatch;
        });
        setUserAds(matched);
      })
      .catch(() => setUserAds([]));
  }, [make]);

  return userAds;
}

/**
 * Fetches active user-placed ads for specified subsections,
 * sorted by newest first (to appear at the top of category pages).
 * Respects listingDays — ads older than their paid duration are excluded.
 */
export function useUserAds(subsections, refetchKey = 0) {
  const [userAds, setUserAds] = useState([]);

  useEffect(() => {
    api.entities.UserAd.filter({ status: 'active' }, '-created_date', 3000000)
      .then(ads => {
        const now = Date.now();
        const filtered = ads.filter(ad => {
          if (!subsections.includes(ad.subsection)) return false;
          // Check if listing has expired based on listingDays and created_date
          if (ad.listingDays && ad.created_date) {
            const createdAt = new Date(ad.created_date).getTime();
            const expiresAt = createdAt + ad.listingDays * 24 * 60 * 60 * 1000;
            if (now > expiresAt) return false;
          }
          return true;
        });
        setUserAds(filtered);
      })
      .catch(() => setUserAds([]));
  }, [subsections.join(','), refetchKey]);

  return userAds;
}

/**
 * Converts a UserAd entity record to a ListingCard-compatible item.
 */
export function userAdToListingItem(ad) {
  return {
    id: ad.id,
    created_date: ad.created_date,
    title: ad.title,
    price: `€${ad.price}`,
    mileage: ad.mileage,
    currency: ad.currency || '€',
    location: ad.location,
    viewCount: ad.view_count ?? null,
    year: ad.vehicleYear,
    fuel: ad.vehicleFuel,
    engine: ad.vehicleFuel,
    image: (ad.photos && ad.photos[0]) || null,
    images: ad.photos || [],
    photos: ad.photos ? ad.photos.length : 1,
    sellerType: sellerTypeOf(ad),
    spotlight: ad.spotlight,
    description: ad.description,
    fullName: ad.fullName,
    email: ad.email,
    phone: ad.phone,
    sellerId: ad.created_by_id,
    nctExpiry: ad.nctExpiry,
    taxExpiry: ad.taxExpiry,
    engineSize: ad.engineSize,
    bodyType: ad.bodyType,
    vehicleMake: ad.vehicleMake,
    vehicleModel: ad.vehicleModel,
    vehicleTrim: ad.vehicleTrim,
    colour: ad.colour,
    transmission: ad.vehicleTransmission,
    enginePower: ad.enginePower,
    batteryRange: ad.batteryRange,
    numberOfSeats: ad.numberOfSeats,
    numberOfDoors: ad.numberOfDoors,
    previousOwners: ad.previousOwners,
    fullServiceHistory: ad.fullServiceHistory,
    noAccidents: ad.noAccidents,
    roadTax: ad.roadTax,
    adType: ad.adType,
  };
}