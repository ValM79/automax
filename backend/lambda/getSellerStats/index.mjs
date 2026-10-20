// Public seller facts for the ad page, like DoneDeal's "time on DoneDeal / active ads / total ads":
// when the seller joined (month and year only), how many ads they have live now, and how many
// they have placed in total (live + expired; unpaid drafts are not counted).
//
// It is public because buyers (including logged-out visitors) see it. It returns counts and a
// month/year only, never the seller's email, phone or name. The user profile table has no
// created date, so the join date comes from the account system (Cognito).
import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { ddb, TABLES, json } from '../_lib/common.mjs';
import { normalizeWebsite } from '../_lib/website.mjs';
import { openingTimes } from '../_lib/openingTimes.mjs';

const cognito = new CognitoIdentityProviderClient({});
const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_MS = 60 * 1000;
const cache = new Map();

async function countAds(sellerId) {
  let active = 0;
  let total = 0;
  let key;
  const now = Date.now();
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.UserAd,
      IndexName: 'byOwner',
      KeyConditionExpression: 'created_by_id = :id',
      ExpressionAttributeValues: { ':id': sellerId },
      ProjectionExpression: '#s, created_date, listingDays',
      ExpressionAttributeNames: { '#s': 'status' },
      ExclusiveStartKey: key,
    }));
    for (const ad of res.Items || []) {
      if (ad.status !== 'active' && ad.status !== 'expired') continue;
      total += 1;
      const lapsed = ad.listingDays && ad.created_date && now > Date.parse(ad.created_date) + Number(ad.listingDays) * DAY_MS;
      if (ad.status === 'active' && !lapsed) active += 1;
    }
    key = res.LastEvaluatedKey;
  } while (key);
  return { active, total };
}

// What a buyer may see about the seller. Everyone gets the profile photo / logo (a link to our own photo storage).
// A business account (trader or dealer) also gets what its dealer page shows: business name, cover photo, county,
// area, address, opening hours, phone number and the "trusted" mark. These are the details a business chooses to
// show buyers anyway. Never an email, VAT number or personal name.
const FIELDS = ['avatar_url', 'cover_url', 'seller_type', 'business_name', 'county', 'area', 'business_address', 'opening_hours', 'opening_times', 'about', 'phone', 'trusted_dealer', 'contact_ways', 'whatsapp_number', 'contact_email', 'business_address_2', 'eircode', 'website', 'reviews_enabled'];

// Only the contact ways the dealer switched on are returned, and a WhatsApp number or email only when its way is on.
function contactWays(p) {
  const w = p.contact_ways && typeof p.contact_ways === 'object' ? p.contact_ways : {};
  const ways = { message: w.message !== false, phone: w.phone !== false, whatsapp: w.whatsapp === true, email: w.email === true };
  // WhatsApp uses its own number, or the phone number when none was given (the dealer chose WhatsApp, so that is fine).
  const waNumber = p.whatsapp_number || p.phone;
  return {
    contact_ways: ways,
    ...(ways.whatsapp && waNumber ? { whatsapp_number: String(waNumber).slice(0, 30) } : {}),
    ...(ways.email && p.contact_email ? { contact_email: String(p.contact_email).slice(0, 120) } : {}),
  };
}

async function sellerProfile(sellerId) {
  const empty = { avatar_url: null, seller_type: null };
  try {
    const res = await ddb.send(new GetCommand({
      TableName: TABLES.User,
      Key: { id: sellerId },
      ProjectionExpression: FIELDS.map((f) => `#${f}`).join(', '),
      ExpressionAttributeNames: Object.fromEntries(FIELDS.map((f) => [`#${f}`, f])),
    }));
    const p = res.Item;
    if (!p) return empty;
    const cdn = `https://${process.env.PHOTOS_CDN_DOMAIN}/`;
    const photo = (u) => (typeof u === 'string' && u.startsWith(cdn) ? u : null);
    const out = { avatar_url: photo(p.avatar_url), seller_type: ['trader', 'dealership', 'dealer'].includes(p.seller_type) ? p.seller_type : 'private' };
    if (out.seller_type !== 'private') {
      const text = (v, n) => (v ? String(v).slice(0, n) : '');
      Object.assign(out, {
        cover_url: photo(p.cover_url),
        business_name: text(p.business_name, 80),
        county: text(p.county, 40),
        area: text(p.area, 60),
        business_address: text(p.business_address, 200),
        business_address_2: text(p.business_address_2, 200),
        eircode: text(p.eircode, 8),
        website: normalizeWebsite(p.website) || '',
        reviews_enabled: p.reviews_enabled !== false,
        opening_hours: text(p.opening_hours, 200),
        opening_times: openingTimes(p.opening_times),
        about: text(p.about, 500),
        ...contactWays(p),
        // the phone number is shown only if the dealer left Phone ticked
        ...(p.contact_ways?.phone !== false ? { phone: text(p.phone, 30) } : { phone: '' }),
        trusted: p.trusted_dealer === true,
      });
    }
    return out;
  } catch (e) {
    console.log('Could not read the seller profile:', e.message);
    return empty;
  }
}

async function memberSince(sellerId) {
  try {
    const res = await cognito.send(new ListUsersCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Filter: `sub = "${sellerId}"`,
      Limit: 1,
    }));
    const created = res.Users?.[0]?.UserCreateDate;
    return created ? new Date(created).toISOString().slice(0, 7) : null; // "YYYY-MM"
  } catch (e) {
    console.log('Could not read the seller join date:', e.message);
    return null;
  }
}

export const handler = async (event) => {
  try {
    const { seller_id } = JSON.parse(event.body || '{}');
    // a Cognito user id (sub): reject anything else so it cannot break out of the filter string
    if (!seller_id || !/^[A-Za-z0-9-]{8,64}$/.test(seller_id)) return json(400, { error: 'Invalid seller' });

    // The ad counts and the join date change slowly, so they are kept for a minute. The profile part (logo, photo, name,
    // address, hours...) is read fresh every time, so a saved change shows on the dealer page straight away.
    let slow = cache.get(seller_id);
    if (!slow || Date.now() - slow.at >= CACHE_MS) {
      const [{ active, total }, since] = await Promise.all([countAds(seller_id), memberSince(seller_id)]);
      slow = { at: Date.now(), member_since: since, active_ads: active, total_ads: total };
      cache.set(seller_id, slow);
    }
    const profile = await sellerProfile(seller_id);
    return json(200, { member_since: slow.member_since, active_ads: slow.active_ads, total_ads: slow.total_ads, ...profile });
  } catch (error) {
    console.error('getSellerStats error:', error);
    return json(500, { error: 'Could not load seller details' });
  }
};
