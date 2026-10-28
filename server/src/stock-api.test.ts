import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";

test(
  "store inventory and insight integration",
  { skip: !process.env.TEST_DATABASE_URL },
  async (t) => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.JWT_SECRET = "integration-test-secret-at-least-32-characters";
    const { app } = await import("./app.js"),
      { default: db } = await import("./db/db.js");
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`,
      prefix = randomUUID(),
      sku = prefix + "-stock",
      cardId = prefix + "-card";
    let token = "",
      itemId = "",
      importBody: Record<string, unknown>;
    const mapping = {
      sku: "sku",
      name: "name",
      quantity: "quantity",
      priceBrl: "priceBrl",
    };
    async function req(
      path: string,
      method = "GET",
      body?: unknown,
      auth = token,
    ) {
      const r = await fetch(base + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return {
        status: r.status,
        data: r.status === 204 ? null : await r.json(),
      };
    }
    try {
      const registered = await req("/register", "POST", {
        email: `${prefix}@test.com`,
        name: "Stock Admin",
        password: "test-password",
      });
      token = registered.data.token;
      await t.test(
        "every stock route requires a current administrator role",
        async () => {
          for (const [path, method, body] of [
            ["/inventory", "GET", undefined],
            ["/inventory/export", "GET", undefined],
            ["/inventory/movements", "GET", undefined],
            ["/inventory", "POST", {}],
            ["/inventory/import/preview", "POST", {}],
            ["/inventory/import/commit", "POST", {}],
          ] as const)
            assert.equal((await req(path, method, body)).status, 403);
          await db.user.update({
            where: { id: registered.data.user.id },
            data: { isAdmin: true },
          });
        },
      );
      await t.test(
        "opening balances, reservations, sales, validation and stale-edit checks",
        async () => {
          const created = await req("/inventory", "POST", {
            sku,
            name: "Test stock",
            quantity: 5,
            costBrl: 2.5,
            priceBrl: 10,
          });
          assert.equal(created.status, 201);
          itemId = created.data.id;
          assert.equal(
            (
              await req("/inventory", "POST", {
                sku,
                name: "Duplicate",
                quantity: 0,
              })
            ).status,
            409,
          );
          assert.equal(
            (
              await req(`/inventory/${itemId}/movements`, "POST", {
                type: "RESERVE",
                quantity: 3,
                version: 1,
                reason: "Order 123",
              })
            ).status,
            204,
          );
          assert.equal(
            (
              await req(`/inventory/${itemId}/movements`, "POST", {
                type: "SALE",
                quantity: 3,
                version: 2,
                reason: "Oversell",
              })
            ).status,
            400,
          );
          assert.equal(
            (
              await req(`/inventory/${itemId}/movements`, "POST", {
                type: "SALE",
                quantity: 1,
                version: 1,
                reason: "Old version",
              })
            ).status,
            409,
          );
          assert.equal(
            (
              await req(`/inventory/${itemId}/movements`, "POST", {
                type: "SALE",
                quantity: 2,
                version: 2,
                reason: "Order 124",
              })
            ).status,
            204,
          );
          const item = await db.inventoryItem.findUniqueOrThrow({
            where: { id: itemId },
          });
          assert.equal(item.quantity, 3);
          assert.equal(item.reserved, 3);
          const concurrent = await Promise.all(
            [1, 2].map(() =>
              req(`/inventory/${itemId}/movements`, "POST", {
                type: "RECEIVE",
                quantity: 1,
                version: 3,
                reason: "Concurrent receipt",
              }),
            ),
          );
          assert.deepEqual(concurrent.map((r) => r.status).sort(), [204, 409]);
          const list = await req(`/inventory?search=${prefix}&low=true`);
          assert.equal(list.data.total, 1);
          assert.equal(
            (await req("/inventory/movements?itemId=" + itemId)).data.total,
            4,
          );
        },
      );
      await t.test(
        "preview, transaction rollback, import conflicts and idempotency",
        async () => {
          const csv = `sku;name;quantity;priceBrl\n${sku};Test stock;8;12,50\n${prefix}-new;New card;2;8,00`;
          importBody = { csv, mapping, filename: "test.csv" };
          const preview = await req(
            "/inventory/import/preview",
            "POST",
            importBody,
          );
          assert.equal(preview.status, 200);
          assert.equal(preview.data.errors.length, 0);
          const invalid = await req("/inventory/import/commit", "POST", {
            ...importBody,
            csv: csv + "\ninvalid;Bad;-2;1",
            fingerprint: preview.data.fingerprint,
          });
          assert.equal(invalid.status, 400);
          assert.equal(
            (
              await db.inventoryItem.findUniqueOrThrow({
                where: { id: itemId },
              })
            ).quantity,
            4,
          );
          await req(`/inventory/${itemId}/movements`, "POST", {
            type: "RECEIVE",
            quantity: 1,
            version: 4,
            reason: "Change after preview",
          });
          assert.equal(
            (
              await req("/inventory/import/commit", "POST", {
                ...importBody,
                fingerprint: preview.data.fingerprint,
              })
            ).status,
            409,
          );
          const fresh = await req(
            "/inventory/import/preview",
            "POST",
            importBody,
          );
          const committed = await req("/inventory/import/commit", "POST", {
            ...importBody,
            fingerprint: fresh.data.fingerprint,
          });
          assert.equal(committed.status, 200);
          assert.equal(committed.data.imported, 2);
          assert.equal(
            (
              await req("/inventory/import/commit", "POST", {
                ...importBody,
                fingerprint: fresh.data.fingerprint,
              })
            ).data.alreadyImported,
            true,
          );
          const item = await db.inventoryItem.findUniqueOrThrow({
            where: { id: itemId },
          });
          assert.equal(item.quantity, 8);
          assert.equal(Number(item.priceBrl), 12.5);
          assert.equal(item.reserved, 3);
          assert.equal(Number(item.costBrl), 2.5);
          const badCsv = `sku;name;quantity\n${sku};Wrong variant;1`;
          assert(
            (
              await req("/inventory/import/preview", "POST", {
                csv: badCsv,
                mapping,
              })
            ).data.errors.length > 0,
          );
        },
      );
      await t.test(
        "insights query uses real aggregated history and handles empty windows",
        async () => {
          await db.cards.create({
            data: {
              card_id: cardId,
              name: "Insight test",
              colors: [],
              color_identity: [],
            },
          });
          const date = new Date();
          date.setUTCHours(0, 0, 0, 0);
          await db.card_prices.createMany({
            data: Array.from({ length: 9 }, (_, i) => ({
              card_id: cardId,
              date: new Date(date.getTime() - i * 86400000),
              price_usd: i < 2 ? 10 : 20,
            })),
          });
          const result = await req("/market/insights?days=30");
          assert.equal(result.status, 200);
          const card = result.data.data.find(
            (r: { card_id: string }) => r.card_id === cardId,
          );
          assert(card);
          assert(card.signals.includes("low"));
          assert(card.signals.includes("research"));
          assert.equal(card.observations, 9);
          assert.equal((await req("/market/insights?days=2")).status, 400);
          await db.user.update({
            where: { id: registered.data.user.id },
            data: { isAdmin: false },
          });
          assert.equal((await req("/inventory")).status, 403);
        },
      );
    } finally {
      const items = await db.inventoryItem.findMany({
        where: { sku: { startsWith: prefix } },
        select: { id: true },
      });
      await db.stockMovement.deleteMany({
        where: { itemId: { in: items.map((i) => i.id) } },
      });
      await db.inventoryItem.deleteMany({
        where: { sku: { startsWith: prefix } },
      });
      // Only the batch created by this test; never clear other tests' import records.
      if (importBody!) {
        const { importRows } = await import("./stock-input.js");
        const { createHash } = await import("node:crypto");
        const digest = createHash("sha256")
          .update(
            JSON.stringify({
              items: importRows(importBody.csv as string, mapping).items,
              fields: Object.keys(mapping).sort(),
            }),
          )
          .digest("hex");
        await db.stockImport.deleteMany({ where: { digest } });
      }
      await db.user.deleteMany({ where: { email: `${prefix}@test.com` } });
      await db.card_prices.deleteMany({ where: { card_id: cardId } });
      await db.cards.deleteMany({ where: { card_id: cardId } });
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await db.$disconnect();
    }
  },
);
