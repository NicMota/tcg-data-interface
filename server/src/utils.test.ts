import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pagination, search_filter, registerInput } from './utils.js';
import { nextSync } from './scheduler.js';
test('query defaults and strict boolean parsing', () => {
  assert.deepEqual(pagination.parse({}), { page: 1, limit: 20 });
  assert.equal(search_filter.parse({ foil: 'false' }).foil, false);
  assert.equal(search_filter.parse({ foil: 'true' }).foil, true);
  for (const query of [{ limit: -1 }, { page: 'NaN' }, { limit: 101 }]) assert.equal(pagination.safeParse(query).success, false);
  assert.equal(search_filter.safeParse({ released_from: '2026-10-02', released_to: '2026-10-01' }).success, false);
});
test('password byte limit prevents silent bcrypt truncation', () => {
  assert.equal(registerInput.safeParse({ name: 'Tester', email: 'user@example.com', password: '🔒'.repeat(20) }).success, false);
});
test('daily scheduling uses the next UTC occurrence', () => {
  assert.equal(nextSync(new Date('2026-12-31T12:00:00Z'), 11).toISOString(), '2027-01-01T11:00:00.000Z');
  assert.equal(nextSync(new Date('2026-10-26T10:00:00Z'), 11).toISOString(), '2026-10-26T11:00:00.000Z');
});
