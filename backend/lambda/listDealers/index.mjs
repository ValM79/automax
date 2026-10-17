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
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json } from '../_lib/common.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_MS = 60 * 1000;
const MAX_DEALERS = 300;
let cache = null;

// every kind of car section is shown as one "Cars" tag, like DoneDeal's dealer cards
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

async function buildDealers() {
  const [sellers, profiles] = await Promise.all([liveAdsBySeller(), dealerProfiles()]);
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
    });
  }
  dealers.sort((x, y) => Number(y.trusted) - Number(x.trusted) || y.stock - x.stock || x.name.localeCompare(y.name));
  return dealers.slice(0, MAX_DEALERS);
}

export const handler = async () => {
  try {
    if (cache && Date.now() - cache.at < CACHE_MS) return json(200, cache.body);
    const body = { dealers: await buildDealers() };
    cache = { at: Date.now(), body };
    return json(200, body);
  } catch (error) {
    console.error('listDealers error:', error);
    return json(500, { error: 'Could not load dealerships' });
  }
};
