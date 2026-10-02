const DAY_MS = 24 * 60 * 60 * 1000;

// Whole days left in an ad's paid listing period (counted from created_date,
// which a renewal moves forward), or null when it has no paid period recorded.
export function adDaysLeft(ad) {
  if (!ad?.listingDays || !ad?.created_date) return null;
  const endsAt = new Date(ad.created_date).getTime() + ad.listingDays * DAY_MS;
  return Math.ceil((endsAt - Date.now()) / DAY_MS);
}
