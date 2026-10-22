// A signed-in user's email alerts for new ads ("Notify me" on an ad page): list, create and turn off.
// POST /functions/searchAlerts, body { action, ... }:
//   list    the caller's alerts
//   create  { make, model, subsection }  an alert for new ads of that make (and model), or, with no make, of that category
//   delete  { id }                       turn one of the caller's alerts off
// The emails themselves are sent by the daily adSearchAlerts function.
import { createHash } from 'node:crypto';
import { PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, nowIso, json, getUserFromEvent } from '../_lib/common.mjs';

const MAX_ALERTS = 25;

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001F\u007F<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// one alert per person per make / model / category: asking again does not make a second one
export const alertId = (userId, make, model, subsection) =>
  createHash('sha256').update([userId, make, model, subsection].map((x) => x.toLowerCase()).join('|')).digest('hex').slice(0, 32);

export const alertName = (a) => [a.make, a.model].filter(Boolean).join(' ') || a.subsection || 'New ads';

const shape = (a) => ({ id: a.id, name: a.name, make: a.make, model: a.model, subsection: a.subsection, created_date: a.created_date, ...(a.ad ? { ad: a.ad } : {}) });

// What the Notifications page shows as the card of the ad the alert was set up from. Taken from the ad itself (never from what the
// browser sends), and kept with the alert so the card is still there when the ad is later sold or taken down.
export async function adSnapshot(adId) {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(String(adId || ''))) return null;
  const ad = (await ddb.send(new GetCommand({ TableName: TABLES.UserAd, Key: { id: adId } }))).Item;
  if (!ad || !['active', 'sold', 'expired'].includes(ad.status)) return null;
  const photos = Array.isArray(ad.photos) ? ad.photos.filter((p) => typeof p === 'string') : [];
  return {
    id: ad.id,
    title: clean(ad.title, 120),
    price: clean(ad.price, 20),
    currency: clean(ad.currency, 3) || '€',
    image: photos[0] || null,
    photo_count: photos.length || 1,
    vehicleYear: clean(ad.vehicleYear, 8),
    vehicleFuel: clean(ad.vehicleFuel, 30),
    mileage: clean(ad.mileage, 20),
    location: clean(ad.location, 80),
    created_date: ad.created_date || null,
  };
}

async function alertsOf(userId) {
  const items = [];
  let key;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.SearchAlert,
      IndexName: 'byUser',
      KeyConditionExpression: 'user_id = :u',
      ExpressionAttributeValues: { ':u': userId },
      ScanIndexForward: false,
      ExclusiveStartKey: key,
    }));
    items.push(...(res.Items || []));
    key = res.LastEvaluatedKey;
  } while (key);
  return items;
}

async function list(user) {
  return json(200, { alerts: (await alertsOf(user.id)).map(shape) });
}

async function create(user, body) {
  const make = clean(body.make, 40);
  const model = make ? clean(body.model, 60) : '';
  const subsection = clean(body.subsection, 60);
  if (!make && !subsection) return json(400, { error: 'Nothing to watch for' });
  const id = alertId(user.id, make, model, subsection);
  const existing = (await ddb.send(new GetCommand({ TableName: TABLES.SearchAlert, Key: { id } }))).Item;
  if (existing) {
    // an alert made before cards existed gets its card the next time it is asked for from an ad page
    if (!existing.ad && body.ad_id) {
      const ad = await adSnapshot(body.ad_id);
      if (ad) {
        await ddb.send(new UpdateCommand({ TableName: TABLES.SearchAlert, Key: { id }, UpdateExpression: 'SET ad = :ad', ExpressionAttributeValues: { ':ad': ad } }));
        existing.ad = ad;
      }
    }
    return json(200, { alert: shape(existing), already: true });
  }
  if ((await alertsOf(user.id)).length >= MAX_ALERTS) return json(400, { error: `You can have up to ${MAX_ALERTS} alerts. Turn one off first.` });
  const now = nowIso();
  const ad = await adSnapshot(body.ad_id);
  const item = { id, user_id: user.id, make, model, subsection, name: '', created_date: now, last_checked: now, ...(ad ? { ad } : {}) };
  item.name = alertName(item);
  await ddb.send(new PutCommand({ TableName: TABLES.SearchAlert, Item: item }));
  return json(200, { alert: shape(item) });
}

async function remove(user, body) {
  const id = String(body.id || '');
  const item = (await ddb.send(new GetCommand({ TableName: TABLES.SearchAlert, Key: { id } }))).Item;
  if (!item || item.user_id !== user.id) return json(404, { error: 'Alert not found' });
  await ddb.send(new DeleteCommand({ TableName: TABLES.SearchAlert, Key: { id } }));
  return json(200, { success: true });
}

const ACTIONS = { list, create, delete: remove };
export const actions = ACTIONS; // for tests

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Please sign in' });
    const body = JSON.parse(event.body || '{}');
    const action = ACTIONS[body.action];
    if (!action) return json(400, { error: 'Unknown action' });
    return await action(user, body);
  } catch (error) {
    console.error('searchAlerts error:', error);
    return json(500, { error: 'Something went wrong' });
  }
};
