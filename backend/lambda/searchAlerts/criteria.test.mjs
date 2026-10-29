// Tests of how a saved search is read from what the browser sends and identified (no AWS access needed).
//
//   cd backend/lambda
//   node --test searchAlerts/criteria.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criteriaOf, alertId } from './index.mjs';

test('model types are kept only with a make and a model, cleaned and without repeats', () => {
  const c = criteriaOf({ make: 'Volkswagen', model: 'ID.4', trims: ['Pro Plus', ' pro plus ', 'Pro Plus', '<b>Style</b>', ''] });
  assert.deepEqual(c.trims, ['Pro Plus', 'pro plus', 'b Style /b']);
  assert.deepEqual(criteriaOf({ make: 'Volkswagen', trims: ['Style'] }).trims, []);
  assert.deepEqual(criteriaOf({ subsection: 'Cars', trims: ['Style'] }).trims, []);
  assert.deepEqual(criteriaOf({ make: 'Volkswagen', model: 'ID.4' }).trims, []);
});
test('at most 10 model types', () => {
  const many = Array.from({ length: 30 }, (_, i) => 'T' + i);
  assert.equal(criteriaOf({ make: 'A', model: 'B', trims: many }).trims.length, 10);
});
test('a search without model types keeps the id it had before model types existed', () => {
  const old = { make: 'Volkswagen', model: 'ID.4', subsection: 'Cars', yearFrom: 2023, yearTo: 2025, priceFrom: 26300, priceTo: 35600, county: 'Dublin' };
  const same = alertId('u1', { ...old, trims: [] });
  assert.equal(same, alertId('u1', old));
  assert.notEqual(alertId('u1', { ...old, trims: ['Style'] }), same);
  assert.equal(alertId('u1', { ...old, trims: ['Style', 'Life'] }), alertId('u1', { ...old, trims: ['life', 'STYLE'] }));
});

test('mileage is read as whole km, put the right way round, and a search without it keeps its id', () => {
  const c = criteriaOf({ make: 'A', model: 'B', mileageFrom: '50,000', mileageTo: 10000 });
  assert.equal(c.mileageFrom, 10000);
  assert.equal(c.mileageTo, 50000);
  assert.equal(criteriaOf({ make: 'A' }).mileageFrom, '');
  const base = { make: 'A', model: 'B', subsection: 'Cars', yearFrom: '', yearTo: '', priceFrom: '', priceTo: '', county: '' };
  assert.equal(alertId('u1', { ...base, mileageFrom: '', mileageTo: '' }), alertId('u1', base));
  assert.notEqual(alertId('u1', { ...base, mileageTo: 50000 }), alertId('u1', base));
});
