// Says whether each ad in a visitor's Saved Ads is still live, was sold, has expired or is gone, for the strip under each saved ad.
//
// Public (saved ads live in the visitor's browser, and a signed-out visitor can save too). It returns only a one-word status
// for the ids it is asked about, never anything else about the ad: that is why this is a function of its own instead of letting
// everyone read sold ads through the ad API.
//   live      active and inside its paid listing period
//   sold      the seller marked it sold
//   expired   its listing period has ended (or it was already marked expired)
//   removed   not found (deleted), or never went live
import { BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json } from '../_lib/common.mjs';

const MAX_IDS = 100;
const AD_ID = /^[A-Za-z0-9_-]{8,64}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function statusOf(ad, now = Date.now()) {
  if (!ad) return 'removed';
  if (ad.status === 'sold') return 'sold';
  if (ad.status === 'expired') return 'expired';
  if (ad.status === 'active') {
    const endsAt = ad.listingDays && ad.created_date ? Date.parse(ad.created_date) + Number(ad.listingDays) * DAY_MS : null;
    return endsAt != null && Number.isFinite(endsAt) && endsAt < now ? 'expired' : 'live';
  }
  return 'removed'; // pending: never paid for, so it was never live
}

export const handler = async (event) => {
  try {
    const { ids } = JSON.parse(event.body || '{}');
    if (!Array.isArray(ids)) return json(400, { error: 'ids must be a list' });
    // ids that cannot be one of our ads are left out of the answer (the site then shows no status for them)
    const wanted = [...new Set(ids.filter((id) => typeof id === 'string' && AD_ID.test(id)))].slice(0, MAX_IDS);
    const found = new Map();
    let keys = wanted.map((id) => ({ id }));
    for (let attempt = 0; keys.length && attempt < 3; attempt += 1) {
      const res = await ddb.send(new BatchGetCommand({
        RequestItems: { [TABLES.UserAd]: { Keys: keys, ProjectionExpression: 'id, #s, listingDays, created_date', ExpressionAttributeNames: { '#s': 'status' } } },
      }));
      for (const ad of res.Responses?.[TABLES.UserAd] || []) found.set(ad.id, ad);
      keys = res.UnprocessedKeys?.[TABLES.UserAd]?.Keys || [];
    }
    const now = Date.now();
    const statuses = {};
    for (const id of wanted) statuses[id] = statusOf(found.get(id), now);
    return json(200, { statuses });
  } catch (error) {
    console.error('getAdStatuses error:', error);
    return json(500, { error: 'Could not check the ads' });
  }
};
