import { test, expect } from '@playwright/test';

test('catalog, favorites, price history and profile', async ({ page }) => {
  const user = { id: 'test-user', name: 'Tester', email: 'test@example.com', isAdmin: false };
  const card = { id: 1, card_id: 'test-card', name: 'Test Card', set_name: 'Test Set', type_line: 'Creature', foil: false,
    image_uris: { normal: '/card-placeholder.svg' }, card_prices: [{ price_usd: '2.50', date: '2026-10-26T00:00:00Z' }, { price_usd: '1.25', date: '2026-10-25T00:00:00Z' }] };
  const favorites = new Set<string>();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { localStorage.setItem('tcg_token', 'test-token'); localStorage.setItem('tcg_language', 'en'); });
  await page.route('http://localhost:8000/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    let data: unknown;
    if (path === '/me') {
      if (request.method() === 'PATCH') user.name = request.postDataJSON().name;
      data = { user };
    } else if (path === '/favorites/ids') data = [...favorites];
    else if (path === '/favorites/test-card') {
      if (request.method() === 'PUT') favorites.add('test-card'); else favorites.delete('test-card');
      await route.fulfill({ status: 204 }); return;
    } else if (path === '/favorites') data = { data: favorites.size ? [card] : [], totalPages: favorites.size ? 1 : 0, total: favorites.size };
    else if (path === '/cards') data = { data: [card], total: 1, totalPages: 1 };
    else if (path === '/cards/test-card') data = { card_info: card, prices: card.card_prices };
    else if (path === '/sets') data = [];
    else if (path === '/market/movers') data = [];
    else { await route.fulfill({ status: 404, json: { message: 'Not found' } }); return; }
    await route.fulfill({ json: data });
  });
  await page.goto('/cards');
  await expect(page.getByRole('heading', { name: 'Test Card', exact: true })).toBeVisible();
  await expect(page.getByText('$2.50', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '☆ Save favorite' }).click();
  await expect(page.getByRole('button', { name: '★ Remove favorite' })).toBeVisible();
  await page.getByRole('link', { name: 'Favorites', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Test Card', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /view card/i }).click();
  await expect(page.getByRole('heading', { name: 'Price History' })).toBeVisible();
  await expect(page.locator('.apexcharts-canvas')).toBeVisible();
  await page.goto('/profile');
  await page.getByLabel('Name', { exact: true }).fill('Updated Tester');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('status')).toHaveText('Profile updated.');
  await page.getByRole('link', { name: 'Market', exact: true }).click();
  await expect(page.getByText('No price changes yet. Two daily price snapshots are needed.')).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test('catalog errors can be retried', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('tcg_token', 'test-token'); localStorage.setItem('tcg_language', 'en'); });
  let failed = true;
  await page.route('http://localhost:8000/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/me') await route.fulfill({ json: { user: { id: 'test-user', name: 'Tester' } } });
    else if (path === '/cards' && failed) await route.fulfill({ status: 500, json: { message: 'Error' } });
    else await route.fulfill({ json: path === '/cards' ? { data: [], totalPages: 0 } : [] });
  });
  await page.goto('/cards');
  await expect(page.getByRole('alert')).toBeVisible(); failed = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
