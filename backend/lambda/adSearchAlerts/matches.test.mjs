// Tests of which ads a saved search matches and which searches each run looks at (no AWS access needed).
//
//   cd backend/lambda
//   node --test adSearchAlerts/matches.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matches, dueFor, liveSince, buildDigests } from './index.mjs';

const search = { id: 's1', user_id: 'u1', make: 'Volkswagen', model: 'ID.4', subsection: 'Cars', yearFrom: 2023, yearTo: 2025, priceFrom: 26300, priceTo: 35600, county: 'Dublin', frequency: 'instant', last_checked: '2026-10-29T10:00:00.000Z', name: 'Volkswagen ID.4 in Cars' };
const ad = { id: 'a1', created_by_id: 'u2', vehicleMake: 'Volkswagen', vehicleModel: 'ID.4', vehicleYear: '2024', price: '30,950', county: 'Dublin', subsection: 'Cars', status: 'active', created_date: '2026-10-29T10:30:00.000Z' };

test('an ad inside every range matches', () => assert.equal(matches(search, ad), true));
test('make, model and county are compared without case', () => assert.equal(matches(search, { ...ad, vehicleMake: 'volkswagen', vehicleModel: 'id.4', county: 'dublin' }), true));
test('a different model, year, price or county does not match', () => {
  assert.equal(matches(search, { ...ad, vehicleModel: 'ID.3' }), false);
  assert.equal(matches(search, { ...ad, vehicleYear: '2021' }), false);
  assert.equal(matches(search, { ...ad, vehicleYear: '2026' }), false);
  assert.equal(matches(search, { ...ad, price: '20000' }), false);
  assert.equal(matches(search, { ...ad, price: '40,000' }), false);
  assert.equal(matches(search, { ...ad, county: 'Cork' }), false);
});
test('an ad with no year or price cannot be inside a year or price range', () => {
  assert.equal(matches(search, { ...ad, vehicleYear: '' }), false);
  assert.equal(matches(search, { ...ad, price: '' }), false);
});
test('a search without ranges only needs the make and model', () => {
  const open = { ...search, yearFrom: '', yearTo: '', priceFrom: '', priceTo: '', county: '' };
  assert.equal(matches(open, { ...ad, vehicleYear: '', price: '', county: 'Cork' }), true);
});
test('a search with only a "from" or only a "to" is open on the other side', () => {
  const fromOnly = { ...search, yearTo: '', priceTo: '' };
  assert.equal(matches(fromOnly, { ...ad, vehicleYear: '2030', price: '90000' }), true);
  assert.equal(matches(fromOnly, { ...ad, vehicleYear: '2022' }), false);
});
test('a search with no make watches the whole category', () => {
  const category = { ...search, make: '', model: '', yearFrom: '', yearTo: '', priceFrom: '', priceTo: '', county: '', subsection: 'Quads' };
  assert.equal(matches(category, { ...ad, subsection: 'Quads', vehicleMake: 'Yamaha' }), true);
  assert.equal(matches(category, ad), false);
});
test('your own ads never match', () => assert.equal(matches(search, { ...ad, created_by_id: 'u1' }), false));

test('an ad is new from when it was paid for, not from when it was created', () => {
  const pendingForAWhile = { ...ad, created_date: '2026-10-29T09:00:00.000Z', paymentHistory: [{ date: '2026-10-29T10:30:00.000Z' }] };
  assert.equal(liveSince(pendingForAWhile), '2026-10-29T10:30:00.000Z');
  assert.equal(matches(search, pendingForAWhile), true); // created before the last check, paid after it
  assert.equal(matches(search, { ...pendingForAWhile, paymentHistory: [{ date: '2026-10-29T09:30:00.000Z' }] }), false);
});

test('each run looks at its own searches; "no alerts" is never emailed', () => {
  const all = [{ id: '1', frequency: 'instant' }, { id: '2', frequency: 'daily' }, { id: '3' }, { id: '4', frequency: 'off' }];
  assert.deepEqual(dueFor(all, 'instant').map((a) => a.id), ['1']);
  assert.deepEqual(dueFor(all, 'daily').map((a) => a.id), ['2', '3']);
});

test('one digest per person, an ad that fits two searches is listed once', () => {
  const second = { ...search, id: 's2' };
  const [digest] = buildDigests([search, second], [ad], Date.parse('2026-10-29T11:00:00Z'));
  assert.equal(digest.alerts[0].ads.length, 1);
  assert.equal(digest.alerts[1].ads.length, 0);
});

test('a search for Cars also finds electric, modified, vintage and dealership cars, but not vans or bikes', () => {
  assert.equal(matches(search, { ...ad, subsection: 'Electric & Hybrid Cars' }), true);
  assert.equal(matches(search, { ...ad, subsection: 'Dealership Cars' }), true);
  assert.equal(matches(search, { ...ad, subsection: 'Commercials' }), false);
});
test('a search for another section only finds that section', () => {
  const quads = { ...search, make: 'Yamaha', model: '', subsection: 'Quads', yearFrom: '', yearTo: '', priceFrom: '', priceTo: '', county: '' };
  assert.equal(matches(quads, { ...ad, vehicleMake: 'Yamaha', subsection: 'Quads' }), true);
  assert.equal(matches(quads, { ...ad, vehicleMake: 'Yamaha', subsection: 'Motorbikes' }), false);
});
test('a search with a make and no section looks in every section', () => {
  assert.equal(matches({ ...search, subsection: '' }, { ...ad, subsection: 'Commercials' }), true);
});
