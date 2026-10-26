import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

test('API integration', { skip: !process.env.TEST_DATABASE_URL }, async t => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'integration-test-secret-at-least-32-characters';
  const { app } = await import('./app.js');
  const { default: prisma } = await import('./db/db.js');
  const { default: axios } = await import('axios');
  const { default: upstream } = await import('./axios/client.js');
  const { load_cards_data, update_prices } = await import('./models/CardM.js');
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const prefix = randomUUID(), cardId = `${prefix}-card`, email = `${prefix}@example.com`, otherEmail = `${prefix}-other@example.com`;
  let token = '';
  async function req(path: string, method = 'GET', body?: unknown, auth = token) {
    const response = await fetch(base + path, { method,
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, data: response.status === 204 ? null : await response.json() };
  }
  const originalGet = axios.get, originalUpstreamGet = upstream.get, adapter = axios.defaults.adapter;
  try {
    await t.test('validation, auth, profile and admin protection', async () => {
      for (const path of ['/cards?foil=maybe', '/cards?page=0', '/cards?limit=1000', '/cards?released_from=2026-02-30']) assert.equal((await req(path)).status, 400);
      assert.equal((await req('/favorites')).status, 403);
      assert.equal((await req('/register', 'POST', { email, name: 'Test', password: 'short' })).status, 400);
      const result = await req('/register', 'POST', { email: email.toUpperCase(), name: 'Tester', password: 'test-password' });
      assert.equal(result.status, 201); assert.equal(result.data.user.password, undefined); token = result.data.token;
      assert.equal((await req('/login', 'POST', { email, password: 'wrong' })).status, 401);
      assert.equal((await req('/login', 'POST', { email: email.toUpperCase(), password: 'test-password' })).status, 200);
      assert.equal((await req('/me')).data.user.email, email);
      assert.equal((await req('/me', 'PATCH', { name: 'Updated', isAdmin: true })).data.user.name, 'Updated');
      assert.equal((await req('/me')).data.user.isAdmin, false);
      assert.equal((await req('/admin/stats')).status, 403);
    });
    const bulk = [{ id: cardId, name: `${prefix} Test Card`, set: 'tst', set_name: 'Test Set', foil: false,
      nonfoil: true, colors: ['U'], color_identity: ['U'], rarity: 'rare', prices: { usd: '2.50' },
      card_faces: [{ image_uris: { normal: 'https://example.com/card.png' } }] }];
    await t.test('bulk import handles double-faced cards and idempotent snapshots', async () => {
      axios.get = (async () => ({ data: { download_uri: 'https://example.com/bulk' } })) as typeof axios.get;
      axios.defaults.adapter = async config => ({ data: Readable.from([JSON.stringify(bulk)]), status: 200, statusText: 'OK', headers: {}, config });
      await load_cards_data(); await load_cards_data();
      upstream.get = (async (url: string) => ({ data: url.includes('default_cards') ? { download_uri: 'https://example.com/bulk' } : Readable.from([JSON.stringify(bulk)]) })) as typeof upstream.get;
      await update_prices(); await update_prices();
      assert.equal(await prisma.cards.count({ where: { card_id: cardId } }), 1);
      assert.equal(await prisma.card_prices.count({ where: { card_id: cardId } }), 1);
      const card = await prisma.cards.findUniqueOrThrow({ where: { card_id: cardId } });
      assert.equal(card.quality_score, 100); assert.deepEqual(card.image_uris, bulk[0].card_faces[0].image_uris);
    });
    await t.test('filtered pagination, missing cards and featured route', async () => {
      const result = await req(`/cards?name=${prefix}&foil=false`);
      assert.equal(result.status, 200); assert.equal(result.data.total, 1);
      assert.equal(Number(result.data.data[0].card_prices[0].price_usd), 2.5);
      assert.equal((await req(`/cards?name=${prefix}&foil=true`)).data.total, 0);
      assert.equal((await req('/cards/not-a-card')).status, 404);
      assert.equal((await req('/cards/featured')).status, 200);
    });
    await t.test('favorites are idempotent and isolated by account', async () => {
      assert.equal((await req(`/favorites/${cardId}`, 'PUT')).status, 204);
      assert.equal((await req(`/favorites/${cardId}`, 'PUT')).status, 204);
      assert.deepEqual((await req('/favorites/ids')).data, [cardId]);
      assert.equal((await req('/favorites')).data.total, 1);
      const other = await req('/register', 'POST', { email: otherEmail, name: 'Other', password: 'test-password' });
      assert.equal((await req('/favorites', 'GET', undefined, other.data.token)).data.total, 0);
      await req(`/favorites/${cardId}`, 'DELETE', undefined, other.data.token);
      assert.equal((await req('/favorites')).data.total, 1);
      assert.equal((await req('/favorites/missing', 'PUT')).status, 404);
      await req(`/favorites/${cardId}`, 'DELETE'); assert.equal((await req('/favorites')).data.total, 0);
    });
    await t.test('market compares daily snapshots; admin role is read from database', async () => {
      const previous = new Date(); previous.setUTCDate(previous.getUTCDate() - 1);
      await prisma.card_prices.create({ data: { card_id: cardId, price_usd: 1.25, date: previous } });
      const movers = (await req('/market/movers')).data;
      assert.equal(movers.find((m: { card_id: string }) => m.card_id === cardId).percent_change, 100);
      await prisma.user.update({ where: { email }, data: { isAdmin: true } });
      assert.equal((await req('/admin/stats')).status, 200);
    });
  } finally {
    axios.get = originalGet; upstream.get = originalUpstreamGet; axios.defaults.adapter = adapter;
    await prisma.user.deleteMany({ where: { email: { in: [email, otherEmail] } } });
    await prisma.card_prices.deleteMany({ where: { card_id: cardId } });
    await prisma.cards.deleteMany({ where: { card_id: cardId } });
    await new Promise<void>(resolve => server.close(() => resolve())); await prisma.$disconnect();
  }
});
