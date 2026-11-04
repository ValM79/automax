// Public directory of one service category (Rent a Car, Recovery Service, HGV Repair & Servicing, Auto Repair & Servicing):
// every Service Business account that is complete, paid up and not hidden (see _lib/serviceListing.mjs).
//
// Public, so it returns only what a business shows on its listing: name, logo, county and area, services, opening hours and
// whether it is open 24/7. Never an email, phone number, street address or VAT number.
import { QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json } from '../_lib/common.mjs';
import { openingTimes } from '../_lib/openingTimes.mjs';
import { SERVICE_CATEGORIES, isCategory, isListed } from '../_lib/serviceListing.mjs';

const MAX_PROVIDERS = 500;

// Every Service Business profile (the index holds the name, logo and place; the rest is read from the profiles directly,
// 100 at a time, because an index's columns cannot be changed afterwards).
async function serviceProfiles() {
  const out = [];
  let key;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.User,
      IndexName: 'bySellerType',
      KeyConditionExpression: 'seller_type = :s',
      ExpressionAttributeValues: { ':s': 'service' },
      ExclusiveStartKey: key,
    }));
    out.push(...(res.Items || []));
    key = res.LastEvaluatedKey;
  } while (key && out.length < 5000);
  return out;
}

async function listingFields(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 100) {
    let keys = ids.slice(i, i + 100).map((id) => ({ id }));
    for (let attempt = 0; keys.length && attempt < 3; attempt += 1) {
      const res = await ddb.send(new BatchGetCommand({
        RequestItems: {
          [TABLES.User]: { Keys: keys, ProjectionExpression: 'id, service_category, service_list, open_24_7, opening_times, listed_until, service_hidden' },
        },
      }));
      for (const item of res.Responses?.[TABLES.User] || []) out.set(item.id, item);
      keys = res.UnprocessedKeys?.[TABLES.User]?.Keys || [];
    }
  }
  return out;
}

export const handler = async (event) => {
  try {
    const { category } = JSON.parse(event.body || '{}');
    if (!isCategory(category)) return json(400, { error: 'Unknown category' });

    const indexed = await serviceProfiles();
    const extra = await listingFields(indexed.map((p) => p.id));
    const cdn = `https://${process.env.PHOTOS_CDN_DOMAIN}/`;
    const now = Date.now();
    const providers = [];
    for (const p of indexed) {
      const full = { ...p, ...(extra.get(p.id) || {}) };
      if (full.service_category !== category || !isListed(full, now)) continue;
      const allowed = SERVICE_CATEGORIES[category];
      providers.push({
        id: full.id,
        name: String(full.business_name).trim().slice(0, 80),
        county: String(full.county).slice(0, 40),
        area: full.area ? String(full.area).slice(0, 60) : '',
        services: (Array.isArray(full.service_list) ? full.service_list : []).filter((s) => allowed.includes(s)),
        open_24_7: full.open_24_7 === true,
        opening_times: openingTimes(full.opening_times),
        avatar_url: typeof full.avatar_url === 'string' && full.avatar_url.startsWith(cdn) ? full.avatar_url : null,
      });
    }
    providers.sort((a, b) => a.name.localeCompare(b.name));
    return json(200, { providers: providers.slice(0, MAX_PROVIDERS) });
  } catch (error) {
    console.error('listServiceProviders error:', error);
    return json(500, { error: 'Could not load the directory' });
  }
};
