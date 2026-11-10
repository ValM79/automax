// In-memory tests of publishFreeAd (the free launch offer) against a fake DynamoDB, no AWS access needed.
//
//   cd backend/lambda
//   node --experimental-test-module-mocks --test publishFreeAd/publishFreeAd.test.mjs
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();

const db = new Map();
const profiles = { u1: { seller_type: 'private' }, biz: { seller_type: 'trader' } };
const emails = [];

mock.module('../_lib/common.mjs', {
  namedExports: {
    TABLES: { UserAd: 'UserAd', User: 'User' },
    json: (statusCode, body) => ({ statusCode, body: JSON.stringify(body) }),
    // "Bearer u1" = a normal user, "Bearer root" = admin; anything else = signed out
    getUserFromEvent: async (e) => {
      const id = e.headers?.authorization?.replace('Bearer ', '');
      return id ? { id, email: `${id}@example.com`, role: id === 'root' ? 'admin' : 'user' } : null;
    },
    getUserProfile: async (id) => profiles[id] || null,
    ddb: {
      send: async (cmd) => {
        const input = cmd.input;
        switch (cmd.constructor.name) {
          case 'GetCommand': return { Item: structuredClone(db.get(input.Key.id)) };
          case 'QueryCommand': return { Items: [...db.values()].filter((a) => a.created_by_id === input.ExpressionAttributeValues[':id']).map((a) => structuredClone(a)) };
          case 'UpdateCommand': {
            const ad = db.get(input.Key.id);
            const v = input.ExpressionAttributeValues;
            if (!ad || ad.status !== v[':prev']) { const e = new Error('condition'); e.name = 'ConditionalCheckFailedException'; throw e; }
            if (':one' in v) { ad.originalCreatedDate = ad.originalCreatedDate || ad.created_date; ad.renewCount = (ad.renewCount || 0) + 1; }
            Object.assign(ad, { status: v[':status'], packageName: v[':pkg'], listingDays: v[':days'], spotlight: v[':spotlight'], created_date: v[':now'] });
            return { Attributes: structuredClone(ad) };
          }
          default: throw new Error(`fake ddb: unsupported ${cmd.constructor.name}`);
        }
      },
    },
  },
});
mock.module('../_lib/adEmails.mjs', { namedExports: { sendAdLiveEmail: async (args) => { emails.push(args); return true; } } });
const { handler } = await import('./index.mjs');

const call = (adId, who = 'u1') => handler({ headers: who ? { authorization: `Bearer ${who}` } : {}, body: JSON.stringify({ adId }) });
const parse = (r) => JSON.parse(r.body);
const seed = (ad) => db.set(ad.id, structuredClone(ad));
const pending = (over = {}) => ({ id: 'a1', created_by_id: 'u1', status: 'pending', subsection: 'Cars', created_date: daysAgo(3), ...over });
const liveFree = (id, over = {}) => ({ id, created_by_id: 'u1', status: 'active', packageName: 'Free', listingDays: 60, created_date: daysAgo(5), subsection: 'Cars', ...over });

test('a pending car ad goes live for 60 days with the Free package, no bumps or spotlight', async () => {
  db.clear(); emails.length = 0;
  seed(pending());
  const res = await call('a1');
  assert.equal(res.statusCode, 200);
  const ad = db.get('a1');
  assert.equal(ad.status, 'active');
  assert.equal(ad.packageName, 'Free');
  assert.equal(ad.listingDays, 60);
  assert.equal(ad.spotlight, false);
  assert.ok(Date.now() - Date.parse(ad.created_date) < 5000, 'countdown starts now, not when the draft was saved');
  assert.equal(emails.length, 1);
  assert.equal(emails[0].free, true);
});

test('every category gets the same 60 days', async () => {
  for (const subsection of ['Cars', 'Car Parts', 'Motorbikes', 'Trucks', 'Other items']) {
    db.clear();
    seed(pending({ subsection }));
    await call('a1');
    assert.equal(db.get('a1').listingDays, 60, subsection);
  }
});

test('signed out -> 401, someone else\'s ad -> 403, unknown ad -> 404, nothing changes', async () => {
  db.clear();
  seed(pending());
  assert.equal((await call('a1', null)).statusCode, 401);
  assert.equal((await call('a1', 'someone')).statusCode, 403);
  assert.equal((await call('nope')).statusCode, 404);
  assert.equal(db.get('a1').status, 'pending');
});

test('a sold or removed ad cannot be published', async () => {
  db.clear();
  seed(pending({ status: 'sold' }));
  assert.equal((await call('a1')).statusCode, 400);
  assert.equal(db.get('a1').status, 'sold');
});

test('no limit on live free ads: a private account with many live ads can still post more', async () => {
  db.clear();
  for (let i = 0; i < 30; i++) seed(liveFree(`f${i}`));
  seed(pending());
  assert.equal((await call('a1')).statusCode, 200);
  assert.equal(db.get('a1').status, 'active');
});

test('business accounts and admins are not limited either', async () => {
  db.clear();
  for (let i = 0; i < 25; i++) seed(liveFree(`b${i}`, { created_by_id: 'biz' }));
  seed(pending({ id: 'n1', created_by_id: 'biz' }));
  assert.equal((await call('n1', 'biz')).statusCode, 200);
  for (let i = 0; i < 25; i++) seed(liveFree(`r${i}`, { created_by_id: 'root' }));
  seed(pending({ id: 'r9', created_by_id: 'root' }));
  assert.equal((await call('r9', 'root')).statusCode, 200);
});

test('renewing one of your own live free ads restarts the countdown', async () => {
  db.clear();
  seed(liveFree('f1')); seed(liveFree('f2')); seed(liveFree('f3'));
  const res = await call('f1');
  assert.equal(res.statusCode, 200);
  assert.equal(parse(res).renewed, true);
  assert.equal(db.get('f1').renewCount, 1);
  assert.ok(db.get('f1').originalCreatedDate);
});

test('a second click on an already-live ad is a renewal, not a way to get extra ads', async () => {
  db.clear();
  seed(pending());
  await call('a1');
  const again = await call('a1');
  assert.equal(parse(again).renewed, true);
  assert.equal([...db.values()].length, 1);
});
