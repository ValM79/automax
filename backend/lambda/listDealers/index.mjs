// Public dealer directory ("Dealers Garage" / Find a dealer): every Dealer account, from the day it is created (the stock
// count and the sections come from its live ads, and are 0 / empty until it has some).
//
// It builds the list from real data, so nobody has to add dealers by hand:
//   - live ads come from the ad table (status active and not past their listing period),
//   - who the seller is (a Dealer account or not, business name, logo, county/area, "trusted" mark) comes from their profile.
// It is public because anyone can browse dealers. It returns only what a dealer chooses to show on their ads
// anyway: business name, logo, county/area, number of live ads and the sections they sell in. Never an email,
// phone number, street address or VAT number. "trusted" can only be switched on by the site owner directly in the
// database (it is not one of the fields a user may edit on their own profile).
import { QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json } from '../_lib/common.mjs';
import { openingTimes } from '../_lib/openingTimes.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_MS = 60 * 1000;
const MAX_DEALERS = 300;
// Only the slow part (counting every live ad) is kept for a minute. The dealer profiles (name, logo, photo, location) are
// read fresh on every call, so a change saved on the Profile page shows on the card straight away. (The whole answer
// used to be kept for a minute in each warm copy of this function, so a removed photo kept showing for a while.)
let adsCache = null;

// every kind of car section is shown as one "Cars" tag on a dealer's card
const CAR_SUBSECTIONS = new Set([
  'Cars', 'New Cars', 'Dealers Garage', 'Dealership Cars', 'Cars from Dealerships', 'Electric & Hybrid Cars',
  'Vintage Cars', 'Modified Cars', 'Rally Cars', 'Breaking & Repairables',
]);
const sectionOf = (subsection) => (CAR_SUBSECTIONS.has(subsection) ? 'Cars' : subsection);

async function liveAdsBySeller() {
  const sellers = new Map();
  const now = Date.now();
  let key;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.UserAd,
      IndexName: 'byStatusSubsection',
      KeyConditionExpression: '#s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':active': 'active' },
      ProjectionExpression: 'created_by_id, subsection, businessName, listingDays, created_date',
      ExclusiveStartKey: key,
    }));
    for (const ad of res.Items || []) {
      if (!ad.created_by_id) continue;
      const lapsed = ad.listingDays && ad.created_date && now > Date.parse(ad.created_date) + Number(ad.listingDays) * DAY_MS;
      if (lapsed) continue;
      const s = sellers.get(ad.created_by_id) || { stock: 0, sections: new Set(), adName: '' };
      s.stock += 1;
      if (ad.subsection) s.sections.add(sectionOf(ad.subsection));
      if (!s.adName && ad.businessName) s.adName = String(ad.businessName);
      sellers.set(ad.created_by_id, s);
    }
    key = res.LastEvaluatedKey;
  } while (key);
  return sellers;
}

// Every Dealer account, whether or not it has a live ad yet: the card and the page exist from the day the account is created.
async function dealerProfiles() {
  const out = [];
  let key;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.User,
      IndexName: 'bySellerType',
      KeyConditionExpression: 'seller_type = :d',
      ExpressionAttributeValues: { ':d': 'dealer' },
      ExclusiveStartKey: key,
    }));
    out.push(...(res.Items || []));
    key = res.LastEvaluatedKey;
  } while (key && out.length < 2000);
  return out;
}

// The opening hours are not in the bySellerType index (an index's columns cannot be changed afterwards), so they are read
// from the profiles directly, 100 at a time. They are used for the "Open now" line on each card.
async function openingTimesById(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    let keys = ids.slice(i, i + 100).map((id) => ({ id }));
    for (let attempt = 0; keys.length && attempt < 3; attempt += 1) {
      const res = await ddb.send(new BatchGetCommand({
        RequestItems: { [TABLES.User]: { Keys: keys, ProjectionExpression: 'id, opening_times' } },
      }));
      for (const item of res.Responses?.[TABLES.User] || []) out.set(item.id, item.opening_times);
      keys = res.UnprocessedKeys?.[TABLES.User]?.Keys || [];
    }
  }
  return out;
}

async function cachedLiveAds() {
  if (adsCache && Date.now() - adsCache.at < CACHE_MS) return adsCache.sellers;
  const sellers = await liveAdsBySeller();
  adsCache = { at: Date.now(), sellers };
  return sellers;
}

async function buildDealers() {
  const [sellers, profiles] = await Promise.all([cachedLiveAds(), dealerProfiles()]);
  const hours = await openingTimesById(profiles.map((p) => p.id)).catch((e) => { console.log('Could not read opening hours:', e.message); return new Map(); });
  const cdn = `https://${process.env.PHOTOS_CDN_DOMAIN}/`;
  const dealers = [];
  for (const p of profiles) {
    const s = sellers.get(p.id) || { stock: 0, sections: new Set(), adName: '' };
    const name = String(p.business_name || s.adName || '').trim();
    if (!name) continue;
    dealers.push({
      id: p.id,
      name: name.slice(0, 80),
      avatar_url: typeof p.avatar_url === 'string' && p.avatar_url.startsWith(cdn) ? p.avatar_url : null,
      cover_url: typeof p.cover_url === 'string' && p.cover_url.startsWith(cdn) ? p.cover_url : null,
      county: p.county ? String(p.county).slice(0, 40) : '',
      area: p.area ? String(p.area).slice(0, 60) : '',
      stock: s.stock,
      sections: [...s.sections].sort((x, y) => (x === 'Cars' ? -1 : y === 'Cars' ? 1 : x.localeCompare(y))),
      trusted: p.trusted_dealer === true,
      opening_times: openingTimes(hours.get(p.id)),
    });
  }
  dealers.sort((x, y) => Number(y.trusted) - Number(x.trusted) || y.stock - x.stock || x.name.localeCompare(y.name));
  return dealers.slice(0, MAX_DEALERS);
}

export const handler = async () => {
  try {
    return json(200, { dealers: await buildDealers() });
  } catch (error) {
    console.error('listDealers error:', error);
    return json(500, { error: 'Could not load dealerships' });
  }
};
