// In-memory tests of the UserAd write rules, both the pure rules and the real
// entity-api handler running against a fake DynamoDB (no AWS access needed).
//
//   cd backend/lambda
//   node --experimental-test-module-mocks --test entity-api/userAdRules.test.mjs
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUserAdCreate, sanitizeUserAdUpdate, SERVER_CONTROLLED_FIELDS } from './userAdRules.mjs';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-21T12:00:00Z');
const owner = { id: 'u1', role: 'user' };
const admin = { id: 'root', role: 'admin' };
const daysAgo = (n) => new Date(NOW - n * DAY).toISOString();
const paid = (over = {}) => ({ id: 'a1', created_by_id: 'u1', status: 'active', packageName: 'Basic', listingDays: 60, created_date: daysAgo(10), ...over });
const unpaid = (status) => ({ id: 'a1', created_by_id: 'u1', status, created_date: daysAgo(1) });

const FORGED = {
  packageName: 'Premium',
  listingDays: 9999,
  spotlight: true,
  paymentAmount: 1499,
  paymentHistory: [{ amount: 1499 }],
  receiptUrl: 'https://evil.example/r',
  lastStripeSessionId: 'cs_fake',
  appleTransactionId: '1',
  originalCreatedDate: daysAgo(500),
  renewCount: 9,
  view_count: 100000,
  save_count: 100000,
};

// ---- pure rules -----------------------------------------------------------

test('the forged-field fixture covers every server-controlled field except updated_date', () => {
  assert.deepEqual(Object.keys(FORGED).sort(), SERVER_CONTROLLED_FIELDS.filter((f) => f !== 'updated_date').sort());
});

test('create: forces pending and drops server-controlled fields', () => {
  const out = sanitizeUserAdCreate({ title: 'Golf', price: 5000, status: 'active', ...FORGED }, owner);
  assert.deepEqual(out, { title: 'Golf', price: 5000, status: 'pending' });
});

test('create: admin body is untouched', () => {
  const body = { title: 'Seed', status: 'active', packageName: 'Basic' };
  assert.deepEqual(sanitizeUserAdCreate(body, admin), body);
});

test('update: ordinary fields pass, server-controlled fields are dropped silently', () => {
  const r = sanitizeUserAdUpdate(paid(), { title: 'New title', price: 4000, photos: ['p.jpg'], ...FORGED }, owner, NOW);
  assert.deepEqual(r, { body: { title: 'New title', price: 4000, photos: ['p.jpg'] } });
});

test('update: status equal to the current one is a no-op (PlaceAd re-saves pending ads with status: pending)', () => {
  assert.deepEqual(sanitizeUserAdUpdate(unpaid('pending'), { title: 'x', status: 'pending' }, owner, NOW), { body: { title: 'x' } });
});

test('update: active -> sold allowed', () => {
  assert.deepEqual(sanitizeUserAdUpdate(paid(), { status: 'sold' }, owner, NOW), { body: { status: 'sold' } });
});

test('update: sold -> active allowed when paid and period not ended', () => {
  const r = sanitizeUserAdUpdate(paid({ status: 'sold' }), { status: 'active' }, owner, NOW);
  assert.deepEqual(r, { body: { status: 'active' } });
});

test('update: sold -> active refused when never paid (no packageName)', () => {
  const r = sanitizeUserAdUpdate({ ...paid({ status: 'sold' }), packageName: undefined }, { status: 'active' }, owner, NOW);
  assert.equal(r.error.statusCode, 403);
});

test('update: sold -> active refused once the listing period has ended', () => {
  const r = sanitizeUserAdUpdate(paid({ status: 'sold', created_date: daysAgo(61) }), { status: 'active' }, owner, NOW);
  assert.equal(r.error.statusCode, 403);
});

test('update: sold -> active refused when listingDays is missing or garbage', () => {
  for (const listingDays of [undefined, 'abc', 0]) {
    const r = sanitizeUserAdUpdate(paid({ status: 'sold', listingDays }), { status: 'active' }, owner, NOW);
    assert.equal(r.error?.statusCode, 403, `listingDays=${listingDays}`);
  }
});

test('update: sold -> active cannot be combined with a forged listingDays to dodge the period check', () => {
  const r = sanitizeUserAdUpdate(paid({ status: 'sold', created_date: daysAgo(61) }), { status: 'active', listingDays: 9999 }, owner, NOW);
  assert.equal(r.error.statusCode, 403);
});

test('update: sold -> expired only when paid and the period has ended (My Ads "Mark as Active" on a lapsed ad)', () => {
  const lapsed = paid({ status: 'sold', created_date: daysAgo(61) });
  assert.deepEqual(sanitizeUserAdUpdate(lapsed, { status: 'expired' }, owner, NOW), { body: { status: 'expired' } });
  assert.equal(sanitizeUserAdUpdate(paid({ status: 'sold' }), { status: 'expired' }, owner, NOW).error.statusCode, 403);
  assert.equal(sanitizeUserAdUpdate({ ...lapsed, packageName: undefined }, { status: 'expired' }, owner, NOW).error.statusCode, 403);
});

test('update: every other owner status change is refused', () => {
  const from = ['pending', 'active', 'expired', 'sold'];
  const to = ['pending', 'active', 'expired', 'sold', 'deleted', 'banned', '', null, { $set: 'active' }];
  for (const f of from) {
    for (const t of to) {
      if (f === 'sold' && (t === 'active' || t === 'expired')) continue; // depends on the period, covered above
      const r = sanitizeUserAdUpdate(paid({ status: f }), { status: t }, owner, NOW);
      if (f === t || (f === 'active' && t === 'sold')) assert.ok(!r.error, `${f} -> ${t} should pass`);
      else assert.equal(r.error?.statusCode, 403, `${f} -> ${String(t)} should be refused`);
    }
  }
});

test('update: pending/expired unpaid ad cannot be activated by the owner', () => {
  for (const status of ['pending', 'expired']) {
    const r = sanitizeUserAdUpdate(unpaid(status), { status: 'active', packageName: 'Premium', listingDays: 90 }, owner, NOW);
    assert.equal(r.error.statusCode, 403, status);
  }
});

test('update: admin may change anything', () => {
  const body = { status: 'active', packageName: 'Basic', listingDays: 60 };
  assert.deepEqual(sanitizeUserAdUpdate(unpaid('pending'), body, admin, NOW), { body });
});

// ---- the real handler against a fake DynamoDB -------------------------------

const db = new Map();
const sentOwner = (id) => ({ headers: { authorization: `Bearer ${id}` } });

mock.module('../_lib/common.mjs', {
  namedExports: {
    TABLES: { UserAd: 'UserAd', Message: 'Message', ReportAd: 'ReportAd', VerificationCode: 'VC', User: 'User' },
    newId: () => `new-${db.size + 1}`,
    nowIso: () => new Date(NOW).toISOString(),
    json: (statusCode, body) => ({ statusCode, body: JSON.stringify(body) }),
    // "Bearer u1" = a normal user, "Bearer root" = admin; anything else = signed out
    getUserFromEvent: async (e) => {
      const id = e.headers?.authorization?.replace('Bearer ', '');
      return id ? { id, role: id === 'root' ? 'admin' : 'user' } : null;
    },
    ddb: {
      send: async (cmd) => {
        const { Key, Item } = cmd.input;
        switch (cmd.constructor.name) {
          case 'GetCommand': return { Item: db.get(Key.id) };
          case 'PutCommand': db.set(Item.id, structuredClone(Item)); return {};
          case 'DeleteCommand': db.delete(Key.id); return {};
          default: throw new Error(`fake ddb: unsupported ${cmd.constructor.name}`);
        }
      },
    },
  },
});
const { handler } = await import('./index.mjs');

const call = (method, id, body, who = 'u1') => handler({
  requestContext: { http: { method } },
  pathParameters: { entity: 'UserAd', ...(id ? { id } : {}) },
  ...sentOwner(who),
  body: body === undefined ? undefined : JSON.stringify(body),
});
const parse = (r) => JSON.parse(r.body);
const seed = (ad) => db.set(ad.id, structuredClone(ad));

test('handler: POST with status active + forged payment fields stores a pending, unpaid ad', async () => {
  db.clear();
  const res = await call('POST', null, { title: 'Golf', status: 'active', ...FORGED });
  assert.equal(res.statusCode, 200);
  const stored = db.get(parse(res).id);
  assert.equal(stored.status, 'pending');
  assert.equal(stored.created_by_id, 'u1');
  for (const f of Object.keys(FORGED)) assert.equal(f in stored, false, `${f} must not be stored`);
  assert.equal(stored.title, 'Golf');
});

test('handler: PUT status active on an unpaid pending ad -> 403 and nothing changes', async () => {
  db.clear();
  seed(unpaid('pending'));
  const res = await call('PUT', 'a1', { status: 'active', packageName: 'Premium', listingDays: 90 });
  assert.equal(res.statusCode, 403);
  assert.equal(db.get('a1').status, 'pending');
  assert.equal(db.get('a1').packageName, undefined);
});

test('handler: PUT edit of a paid ad keeps payment fields and ignores forged ones', async () => {
  db.clear();
  seed(paid({ paymentAmount: 299, paymentHistory: [{ amount: 299 }], view_count: 7 }));
  const res = await call('PUT', 'a1', { title: 'Edited', ...FORGED });
  assert.equal(res.statusCode, 200);
  const stored = db.get('a1');
  assert.equal(stored.title, 'Edited');
  assert.equal(stored.status, 'active');
  assert.equal(stored.packageName, 'Basic');
  assert.equal(stored.listingDays, 60);
  assert.equal(stored.paymentAmount, 299);
  assert.deepEqual(stored.paymentHistory, [{ amount: 299 }]);
  assert.equal(stored.view_count, 7);
  assert.equal(stored.save_count, undefined);
});

test('handler: mark sold, then mark active again', async () => {
  db.clear();
  seed(paid());
  assert.equal((await call('PUT', 'a1', { status: 'sold' })).statusCode, 200);
  assert.equal(db.get('a1').status, 'sold');
  assert.equal((await call('PUT', 'a1', { status: 'active' })).statusCode, 200);
  assert.equal(db.get('a1').status, 'active');
});

test('handler: PlaceAd re-save of a pending ad (status: pending) still works', async () => {
  db.clear();
  seed(unpaid('pending'));
  const res = await call('PUT', 'a1', { title: 'Retry', status: 'pending', photos: ['x.jpg'] });
  assert.equal(res.statusCode, 200);
  assert.equal(db.get('a1').title, 'Retry');
});

test('handler: someone else cannot touch the ad (existing ownership rule), admin can', async () => {
  db.clear();
  seed(unpaid('pending'));
  assert.equal((await call('PUT', 'a1', { title: 'hax' }, 'u2')).statusCode, 403);
  assert.equal((await call('PUT', 'a1', { status: 'active', packageName: 'Basic', listingDays: 60 }, 'root')).statusCode, 200);
  assert.equal(db.get('a1').status, 'active');
});

test('handler: other entities are unaffected by the UserAd rules', async () => {
  db.clear();
  const res = await handler({
    requestContext: { http: { method: 'POST' } },
    pathParameters: { entity: 'ReportAd' },
    ...sentOwner('u1'),
    body: JSON.stringify({ status: 'resolved', packageName: 'kept' }),
  });
  assert.equal(res.statusCode, 200);
  assert.equal(parse(res).status, 'resolved');
  assert.equal(parse(res).packageName, 'kept');
});
