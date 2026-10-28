import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("tcg_token", "test-token");
    localStorage.setItem("tcg_language", "en");
  });
});

test("price radar explains signals, filters candidates and switches language", async ({
  page,
}, testInfo) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows = [
    {
      card_id: "low-card",
      name: "Rhystic Study",
      set_name: "Wilds of Eldraine: Enchanting Tales",
      signals: ["low", "research"],
      current: 24.5,
      low: 24,
      average: 34,
      change: -1.2,
      discount: 27.9,
    },
    {
      card_id: "spike-card",
      name: "Ancient Tomb",
      set_name: "Ultimate Masters",
      signals: ["spike"],
      current: 82,
      low: 54,
      average: 62,
      change: 25.8,
      discount: -32.2,
    },
    {
      card_id: "drop-card",
      name: "The One Ring",
      set_name: "The Lord of the Rings",
      signals: ["drop", "low"],
      current: 45,
      low: 44,
      average: 65,
      change: -22.5,
      discount: 30.8,
    },
  ].map((row) => ({
    ...row,
    observations: 30,
    firstDate: "2026-10-01",
    asOf: today,
    image_uris: { small: "/card-placeholder.svg" },
    series: [34, 32, 33, 29, 30, 27, 24.5].map((price, i) => ({
      date: `2026-10-${i + 10}`,
      price,
    })),
  }));
  await page.route("http://localhost:8000/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/me")
      await route.fulfill({
        json: { user: { id: "admin", name: "Ana Costa", isAdmin: true } },
      });
    else if (path === "/market/insights")
      await route.fulfill({
        json: {
          data: rows,
          days: 90,
          coverage: { tracked: 12984, lastUpdate: today },
          limit: 500,
        },
      });
    else await route.fulfill({ json: [] });
  });
  await page.goto("/insights");
  await expect(
    page.getByRole("heading", { name: "Your next move starts here." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Rhystic Study/ })).toBeVisible();
  await page.screenshot({
    path: `/tmp/arcana-overview-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("tab", { name: /Buying shortlist/ }).click();
  await expect(page.getByRole("link", { name: /Ancient Tomb/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Rhystic Study/ })).toBeVisible();
  await page.getByRole("tab", { name: /All signals/ }).click();
  await page.getByLabel("Search signals").fill("Ancient");
  await expect(page.getByRole("link", { name: /Ancient Tomb/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Rhystic Study/ })).toHaveCount(
    0,
  );
  await page.getByText("How to read these signals").click();
  await expect(page.getByText(/This is a research shortlist/)).toBeVisible();
  await page.getByRole("button", { name: "PT", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sua próxima jogada começa aqui." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("admin can add stock, record a sale, and preview a mapped CSV", async ({
  page,
}, testInfo) => {
  const stock = [
    {
      id: "stock-1",
      sku: "BOLT-NM-EN",
      name: "Lightning Bolt",
      setCode: "M11",
      condition: "NM",
      language: "EN",
      finish: "nonfoil",
      quantity: 5,
      reserved: 1,
      costBrl: "5",
      priceBrl: "12.50",
      reorderPoint: 2,
      location: "A-01",
      version: 1,
      cardId: null,
    },
  ];
  let sales = 0,
    commits = 0;
  await page.route("http://localhost:8000/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    if (path === "/me")
      await route.fulfill({
        json: { user: { id: "admin", name: "Ana Costa", isAdmin: true } },
      });
    else if (path === "/favorites/ids") await route.fulfill({ json: [] });
    else if (path === "/inventory" && request.method() === "GET")
      await route.fulfill({
        json: {
          data: stock,
          total: stock.length,
          totalPages: 1,
          summary: {
            skus: stock.length,
            units: stock.reduce((n, s) => n + s.quantity, 0),
            reserved: 1,
            cost: 25,
            retail: 62.5,
            lowStock: 0,
          },
        },
      });
    else if (path === "/inventory" && request.method() === "POST") {
      const body = request.postDataJSON();
      expect(body.quantity).toBe(3);
      expect(body.priceBrl).toBe(20);
      stock.push({
        ...stock[0],
        ...body,
        id: "stock-2",
        reserved: 0,
        version: 1,
      });
      await route.fulfill({ status: 201, json: stock[1] });
    } else if (path === "/inventory/stock-1/movements") {
      const body = request.postDataJSON();
      expect(body.type).toBe("SALE");
      expect(body.quantity).toBe(2);
      expect(body.version).toBe(1);
      sales++;
      stock[0].quantity -= 2;
      stock[0].version++;
      await route.fulfill({ status: 204 });
    } else if (path === "/inventory/import/columns")
      await route.fulfill({
        json: { headers: ["SKU", "Nome", "Quantidade"], total: 1 },
      });
    else if (path === "/inventory/import/preview") {
      expect(request.postDataJSON().mapping).toMatchObject({
        sku: "SKU",
        name: "Nome",
        quantity: "Quantidade",
      });
      await route.fulfill({
        json: {
          fingerprint: "a".repeat(64),
          creates: 1,
          updates: 0,
          errors: [],
          rows: [
            {
              sku: "CSV-001",
              name: "Counterspell",
              before: 0,
              quantity: 4,
              costBrl: 0,
              priceBrl: 0,
              action: "create",
            },
          ],
        },
      });
    } else if (path === "/inventory/import/commit") {
      expect(request.postDataJSON().fingerprint).toBe("a".repeat(64));
      commits++;
      await route.fulfill({ json: { imported: 1, alreadyImported: false } });
    } else await route.fulfill({ status: 404, json: { message: "Not found" } });
  });
  await page.goto("/inventory");
  await expect(page.getByText("Lightning Bolt", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `/tmp/arcana-inventory-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Add stock", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("SKU", { exact: true }).fill("COUNTER-NM-EN");
  await dialog.getByLabel("Card name", { exact: true }).fill("Counterspell");
  await dialog.getByLabel("Opening quantity").fill("3");
  await dialog.getByLabel("Sale price (BRL)").fill("20");
  await dialog.getByRole("button", { name: "Save stock" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Counterspell", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Move stock", exact: true })
    .first()
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Movement type").selectOption("SALE");
  await dialog.getByLabel("Quantity", { exact: true }).fill("2");
  await dialog.getByLabel("Reason / order reference").fill("Order #1001");
  await dialog
    .getByRole("button", { name: "Record movement", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(sales).toBe(1);
  await page.getByRole("button", { name: "Import CSV", exact: true }).click();
  dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Apply stock snapshot" }),
  ).toBeDisabled();
  await dialog
    .locator("input[type=file]")
    .setInputFiles({
      name: "estoque.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("SKU;Nome;Quantidade\nCSV-001;Counterspell;4"),
    });
  await dialog.getByRole("button", { name: "Preview changes" }).click();
  await expect(dialog.getByText("CSV-001", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Apply stock snapshot" }).click();
  await expect(dialog).toHaveCount(0);
  expect(commits).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("landing and account creation are responsive and accessible", async ({
  page,
}, testInfo) => {
  // A clean unauthenticated page, overriding the shared initialization.
  await page.addInitScript(() => localStorage.removeItem("tcg_token"));
  await page.route("http://localhost:8000/me", (route) =>
    route.fulfill({ status: 403, json: { message: "No session" } }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good cards. Better decisions." }),
  ).toBeVisible();
  await page.screenshot({
    path: `/tmp/arcana-landing-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Find your next move" }).click();
  await expect(page.getByLabel("Confirm password")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
