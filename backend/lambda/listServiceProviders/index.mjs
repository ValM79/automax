// Public directory of one service category (Rent a Car, Recovery Service, HGV Repair & Servicing, Auto Repair & Servicing):
// every Service Business account that is complete, paid up and not hidden (see _lib/serviceListing.mjs).
//
// Public, so the list returns only what a business shows on its listing: name, logo, county and area, services, opening
// hours and whether it is open 24/7. Never an email, phone number, street address or VAT number.
//
// With { id } instead of { category } it returns that one business for its own page: the same, plus its description and
// website, and a phone number, WhatsApp number or contact email ONLY when the business ticked that way of being contacted
// on its Profile. Still never the street address, Eircode or VAT number. A business that is not listed is a 404.
import { QueryCommand, BatchGetCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json } from '../_lib/common.mjs';
import { openingTimes } from '../_lib/openingTimes.mjs';
import { normalizeWebsite } from '../_lib/website.mjs';
import { SERVICE_CATEGORIES, isCategory, isListed } from '../_lib/serviceListing.mjs';

const MAX_PROVIDERS = 500;

const photoOf = (url) => {
  const cdn = `https://${process.env.PHOTOS_CDN_DOMAIN}/`;
  return typeof url === 'string' && url.startsWith(cdn) ? url : null;
};
const servicesOf = (p) => (Array.isArray(p.service_list) ? p.service_list : []).filter((s) => SERVICE_CATEGORIES[p.service_category].includes(s));

// One business, for its own page
async function oneProvider(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9-]{8,64}$/.test(id)) return json(404, { error: 'Not found' });
  const res = await ddb.send(new GetCommand({ TableName: TABLES.User, Key: { id } }));
  const p = res.Item;
  if (!isListed(p)) return json(404, { error: 'Not found' });
  const ways = p.contact_ways && typeof p.contact_ways === 'object' ? p.contact_ways : {};
  const text = (v, n) => (v ? String(v).slice(0, n) : '');
  return json(200, {
    provider: {
      id: p.id,
      category: p.service_category,
      name: text(String(p.business_name).trim(), 80),
      county: text(p.county, 40),
      area: text(p.area, 60),
      about: text(p.about, 500),
      services: servicesOf(p),
      open_24_7: p.open_24_7 === true,
      opening_times: openingTimes(p.opening_times),
      avatar_url: photoOf(p.avatar_url),
      website: normalizeWebsite(p.website) || '',
      phone: ways.phone !== false ? text(p.phone, 30) : '',
      whatsapp: ways.whatsapp === true ? text(p.whatsapp_number || p.phone, 30) : '',
      email: ways.email === true ? text(p.contact_email, 120) : '',
    },
  });
}

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
    const { category, id } = JSON.parse(event.body || '{}');
    if (id !== undefined) return await oneProvider(id);
    if (!isCategory(category)) return json(400, { error: 'Unknown category' });

    const indexed = await serviceProfiles();
    const extra = await listingFields(indexed.map((p) => p.id));
    const now = Date.now();
    const providers = [];
    for (const p of indexed) {
      const full = { ...p, ...(extra.get(p.id) || {}) };
      if (full.service_category !== category || !isListed(full, now)) continue;
      providers.push({
        id: full.id,
        name: String(full.business_name).trim().slice(0, 80),
        county: String(full.county).slice(0, 40),
        area: full.area ? String(full.area).slice(0, 60) : '',
        services: servicesOf(full),
        open_24_7: full.open_24_7 === true,
        opening_times: openingTimes(full.opening_times),
        avatar_url: photoOf(full.avatar_url),
      });
    }
    providers.sort((a, b) => a.name.localeCompare(b.name));
    return json(200, { providers: providers.slice(0, MAX_PROVIDERS) });
  } catch (error) {
    console.error('listServiceProviders error:', error);
    return json(500, { error: 'Could not load the directory' });
  }
};
