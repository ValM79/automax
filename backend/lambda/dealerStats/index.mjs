// Simple visit and click counters for a Dealer's page, shown only to that dealer on their Dealer Stats page.
//
// One endpoint, two actions (POST /functions/dealerStats, body { action, ... }):
//   track  public. Adds 1 to today's total for a dealer: a page view, or a click on Phone / WhatsApp / Email / Website.
//          A dealer's own visits are not counted. Only totals are kept: no IP address, device, account or any
//          other detail about the visitor is stored.
//   get    the dealer only. The last 30 days of totals, plus messages received and reviews.
//
// The counters live in Automax-DealerStat, one item per dealer per day (day = UTC date). Items expire after about 13 months.
import { GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json, getUserFromEvent } from '../_lib/common.mjs';

const ID_RE = /^[A-Za-z0-9-]{8,64}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const KEEP_SECONDS = 400 * 24 * 60 * 60;
const EVENTS = { view: 'views', phone: 'phone', whatsapp: 'whatsapp', email: 'email', website: 'website' };
const METRICS = ['views', 'phone', 'whatsapp', 'email', 'website'];

const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);

async function getDealer(id) {
  if (!ID_RE.test(String(id || ''))) return null;
  const res = await ddb.send(new GetCommand({ TableName: TABLES.User, Key: { id }, ProjectionExpression: 'id, seller_type' }));
  return res.Item && res.Item.seller_type === 'dealer' ? res.Item : null;
}

async function track(user, body) {
  const field = EVENTS[body.event];
  if (!field) return json(400, { error: 'Unknown event' });
  const dealer = await getDealer(body.dealer_id);
  if (!dealer) return json(404, { error: 'Dealer not found' });
  if (user && user.id === dealer.id) return json(200, { counted: false }); // the dealer's own visits are not counted
  const now = Date.now();
  await ddb.send(new UpdateCommand({
    TableName: TABLES.DealerStat,
    Key: { dealer_id: dealer.id, day: dayOf(now) },
    UpdateExpression: 'ADD #f :one SET #ttl = :ttl',
    ExpressionAttributeNames: { '#f': field, '#ttl': 'ttl' },
    ExpressionAttributeValues: { ':one': 1, ':ttl': Math.floor(now / 1000) + KEEP_SECONDS },
  }));
  return json(200, { counted: true });
}

// Messages sent to the dealer (about any of their ads, or from their dealer page) since a date.
async function messageDates(dealerId, sinceIso) {
  const dates = [];
  let key;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.Message,
      IndexName: 'bySeller',
      KeyConditionExpression: 'seller_user_id = :d AND created_date >= :c',
      ExpressionAttributeValues: { ':d': dealerId, ':c': sinceIso },
      ProjectionExpression: 'created_date',
      ExclusiveStartKey: key,
    }));
    dates.push(...(res.Items || []).map((m) => m.created_date));
    key = res.LastEvaluatedKey;
  } while (key);
  return dates;
}

async function reviewSummary(dealerId) {
  let count = 0;
  let sum = 0;
  let key;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.Review,
      IndexName: 'byDealer',
      KeyConditionExpression: 'dealer_id = :d',
      FilterExpression: 'attribute_not_exists(hidden) OR hidden = :no',
      ExpressionAttributeValues: { ':d': dealerId, ':no': false },
      ProjectionExpression: 'rating',
      ExclusiveStartKey: key,
    }));
    for (const r of res.Items || []) { count += 1; sum += Number(r.rating) || 0; }
    key = res.LastEvaluatedKey;
  } while (key);
  return { count, average: count ? Math.round((sum / count) * 10) / 10 : 0 };
}

async function get(user) {
  if (!user) return json(401, { error: 'Please sign in' });
  const dealer = await getDealer(user.id);
  if (!dealer) return json(403, { error: 'Dealer Stats are for Dealer accounts' });

  const now = Date.now();
  const first = dayOf(now - 29 * DAY_MS);
  const rows = new Map();
  let key;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.DealerStat,
      KeyConditionExpression: 'dealer_id = :d AND #day >= :f',
      ExpressionAttributeNames: { '#day': 'day' },
      ExpressionAttributeValues: { ':d': dealer.id, ':f': first },
      ExclusiveStartKey: key,
    }));
    for (const r of res.Items || []) rows.set(r.day, r);
    key = res.LastEvaluatedKey;
  } while (key);

  const days = [];
  for (let i = 29; i >= 0; i -= 1) {
    const day = dayOf(now - i * DAY_MS);
    const r = rows.get(day) || {};
    days.push({ day, ...Object.fromEntries(METRICS.map((m) => [m, Number(r[m]) || 0])) });
  }
  const sumOf = (list) => Object.fromEntries(METRICS.map((m) => [m, list.reduce((a, d) => a + d[m], 0)]));

  const since30 = new Date(now - 30 * DAY_MS).toISOString();
  const since7 = new Date(now - 7 * DAY_MS).toISOString();
  const messages = await messageDates(dealer.id, since30);

  return json(200, {
    days,
    last7: { ...sumOf(days.slice(-7)), messages: messages.filter((d) => d >= since7).length },
    last30: { ...sumOf(days), messages: messages.length },
    reviews: await reviewSummary(dealer.id),
  });
}

const ACTIONS = { track, get };
export const actions = ACTIONS; // for tests

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const action = ACTIONS[body.action];
    if (!action) return json(400, { error: 'Unknown action' });
    const user = await getUserFromEvent(event);
    return await action(user, body);
  } catch (error) {
    console.error('dealerStats error:', error);
    return json(500, { error: 'Something went wrong' });
  }
};
