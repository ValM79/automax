// A signed-in user's saved searches ("Save search" on an ad page): list, create, update and remove.
// A saved search is a target, not an ad: a category, optionally a make and model, a year and price range and a county, plus how often to email.
// POST /functions/searchAlerts, body { action, ... }:
//   list    the caller's saved searches
//   create  { name, subsection, make, model, trims, yearFrom, yearTo, priceFrom, priceTo, county, frequency }
//           frequency is 'instant', 'daily' or 'off' (saved, but no emails); asking for the same search again updates its name and frequency
//   update  { id, frequency?, name? }   change how often to email, or the name
//   delete  { id }                      remove one of the caller's saved searches
// The emails themselves are sent by the adSearchAlerts function (every 15 minutes for instant ones, once a day for daily ones).
import { createHash } from 'node:crypto';
import { PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, nowIso, json, getUserFromEvent } from '../_lib/common.mjs';

const MAX_ALERTS = 25;
export const FREQUENCIES = ['instant', 'daily', 'off'];

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001F\u007F<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
// a whole number between min and max, or '' when the value is empty or not one
const whole = (v, min, max) => {
  const n = Number(String(v ?? '').replace(/[^0-9]/g, ''));
  return String(v ?? '').trim() !== '' && Number.isInteger(n) && n >= min && n <= max ? n : '';
};

// one saved search per person per target: saving the same target again does not make a second one
export const alertId = (userId, c) =>
  createHash('sha256').update([userId, c.make, c.model, c.subsection, c.yearFrom, c.yearTo, c.priceFrom, c.priceTo, c.county, ...(c.trims?.length ? [[...c.trims].map((t) => t.toLowerCase()).sort().join(',')] : [])].map((x) => String(x ?? '').toLowerCase()).join('|')).digest('hex').slice(0, 32);

export const alertName = (a) => {
  const what = [a.make, a.model].filter(Boolean).join(' ');
  return what && a.subsection ? `${what} in ${a.subsection}` : what || a.subsection || 'New ads';
};

// An alert from before saved searches had a frequency was emailed once a day
export const frequencyOf = (a) => (FREQUENCIES.includes(a.frequency) ? a.frequency : 'daily');

const shape = (a) => ({
  id: a.id, name: a.name, make: a.make, model: a.model, trims: a.trims || [], subsection: a.subsection,
  yearFrom: a.yearFrom ?? '', yearTo: a.yearTo ?? '', priceFrom: a.priceFrom ?? '', priceTo: a.priceTo ?? '', county: a.county || '',
  frequency: frequencyOf(a), created_date: a.created_date,
});

// what the browser sent, made safe; from/to are put the right way round
export function criteriaOf(body) {
  const make = clean(body.make, 40);
  const c = {
    make,
    model: make ? clean(body.model, 60) : '',
    // the model types (trims) wanted, only with a model: up to 10, each once
    trims: make && body.model && Array.isArray(body.trims) ? [...new Set(body.trims.map((t) => clean(t, 40)).filter(Boolean))].slice(0, 10) : [],
    subsection: clean(body.subsection, 60),
    yearFrom: whole(body.yearFrom, 1900, 2100), yearTo: whole(body.yearTo, 1900, 2100),
    priceFrom: whole(body.priceFrom, 0, 10000000), priceTo: whole(body.priceTo, 0, 10000000),
    county: clean(body.county, 40),
  };
  if (c.yearFrom !== '' && c.yearTo !== '' && c.yearFrom > c.yearTo) [c.yearFrom, c.yearTo] = [c.yearTo, c.yearFrom];
  if (c.priceFrom !== '' && c.priceTo !== '' && c.priceFrom > c.priceTo) [c.priceFrom, c.priceTo] = [c.priceTo, c.priceFrom];
  return c;
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
  const c = criteriaOf(body);
  if (!c.make && !c.subsection) return json(400, { error: 'Nothing to search for' });
  const frequency = FREQUENCIES.includes(body.frequency) ? body.frequency : 'instant';
  const id = alertId(user.id, c);
  const existing = (await ddb.send(new GetCommand({ TableName: TABLES.SearchAlert, Key: { id } }))).Item;
  const name = clean(body.name, 80) || alertName(c);
  if (existing) {
    await ddb.send(new UpdateCommand({ TableName: TABLES.SearchAlert, Key: { id }, UpdateExpression: 'SET #n = :n, frequency = :f', ExpressionAttributeNames: { '#n': 'name' }, ExpressionAttributeValues: { ':n': name, ':f': frequency } }));
    return json(200, { alert: shape({ ...existing, name, frequency }), already: true });
  }
  if ((await alertsOf(user.id)).length >= MAX_ALERTS) return json(400, { error: `You can have up to ${MAX_ALERTS} saved searches. Remove one first.` });
  const now = nowIso();
  const item = { id, user_id: user.id, ...c, name, frequency, created_date: now, last_checked: now };
  await ddb.send(new PutCommand({ TableName: TABLES.SearchAlert, Item: item }));
  return json(200, { alert: shape(item) });
}

async function update(user, body) {
  const id = String(body.id || '');
  const item = (await ddb.send(new GetCommand({ TableName: TABLES.SearchAlert, Key: { id } }))).Item;
  if (!item || item.user_id !== user.id) return json(404, { error: 'Saved search not found' });
  const sets = []; const values = {};
  if (body.frequency !== undefined) {
    if (!FREQUENCIES.includes(body.frequency)) return json(400, { error: 'Unknown frequency' });
    sets.push('frequency = :f'); values[':f'] = body.frequency;
    // coming back from "No alerts" starts from now, so the first email is not about everything placed while it was off
    if (frequencyOf(item) === 'off' && body.frequency !== 'off') { sets.push('last_checked = :t'); values[':t'] = nowIso(); }
  }
  const name = body.name !== undefined ? clean(body.name, 80) : '';
  if (name) { sets.push('#n = :n'); values[':n'] = name; }
  if (!sets.length) return json(400, { error: 'Nothing to change' });
  await ddb.send(new UpdateCommand({
    TableName: TABLES.SearchAlert, Key: { id }, UpdateExpression: 'SET ' + sets.join(', '),
    ...(name ? { ExpressionAttributeNames: { '#n': 'name' } } : {}), ExpressionAttributeValues: values,
  }));
  const next = { ...item, ...(values[':f'] ? { frequency: values[':f'] } : {}), ...(name ? { name } : {}) };
  return json(200, { alert: shape(next) });
}

async function remove(user, body) {
  const id = String(body.id || '');
  const item = (await ddb.send(new GetCommand({ TableName: TABLES.SearchAlert, Key: { id } }))).Item;
  if (!item || item.user_id !== user.id) return json(404, { error: 'Saved search not found' });
  await ddb.send(new DeleteCommand({ TableName: TABLES.SearchAlert, Key: { id } }));
  return json(200, { success: true });
}

const ACTIONS = { list, create, update, delete: remove };
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
