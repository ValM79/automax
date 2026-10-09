// Public seller facts for the ad page, like DoneDeal's "time on DoneDeal / active ads / total ads":
// when the seller joined (month and year only), how many ads they have live now, and how many
// they have placed in total (live + expired; unpaid drafts are not counted).
//
// It is public because buyers (including logged-out visitors) see it. It returns counts and a
// month/year only, never the seller's email, phone or name. The user profile table has no
// created date, so the join date comes from the account system (Cognito).
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { ddb, TABLES, json } from '../_lib/common.mjs';

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

    const hit = cache.get(seller_id);
    if (hit && Date.now() - hit.at < CACHE_MS) return json(200, hit.body);

    const [{ active, total }, since] = await Promise.all([countAds(seller_id), memberSince(seller_id)]);
    const body = { member_since: since, active_ads: active, total_ads: total };
    cache.set(seller_id, { at: Date.now(), body });
    return json(200, body);
  } catch (error) {
    console.error('getSellerStats error:', error);
    return json(500, { error: 'Could not load seller details' });
  }
};
