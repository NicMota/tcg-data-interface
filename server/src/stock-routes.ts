import { Router } from "express";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "./db/db.js";
import { validJwt, requireAdmin } from "./middleware.js";
import type { AuthRequest } from "./interfaces/auth.interfaces.js";
import { pagination } from "./utils.js";
import {
  stockInput,
  importInput,
  importRows,
  parseCsv,
  csvCell,
  type StockInput,
} from "./stock-input.js";

class StockError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const router = Router();
router.use("/inventory", validJwt, requireAdmin);
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

router.get("/inventory", async (req, res) => {
  const { page, limit } = pagination.parse(req.query);
  const { search, low } = z
    .object({
      search: z.string().trim().max(200).default(""),
      low: z.enum(["true", "false"]).default("false"),
    })
    .parse(req.query);
  const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
  const matches = Prisma.sql`("name" ILIKE ${pattern} OR "sku" ILIKE ${pattern}) AND (${low === "false"} OR "quantity" - "reserved" <= "reorderPoint")`;
  const [rows, counts, summaries] = await prisma.$transaction([
    prisma.$queryRaw<
      { id: string }[]
    >`SELECT id FROM "InventoryItem" WHERE ${matches} ORDER BY "updatedAt" DESC, id LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    prisma.$queryRaw<
      { total: number }[]
    >`SELECT count(*)::int AS total FROM "InventoryItem" WHERE ${matches}`,
    prisma.$queryRaw`SELECT count(*)::int AS skus, coalesce(sum(quantity),0)::int AS units,
      coalesce(sum(reserved),0)::int AS reserved, coalesce(sum(quantity * "costBrl"),0)::float8 AS cost,
      coalesce(sum(quantity * "priceBrl"),0)::float8 AS retail,
      count(*) FILTER (WHERE quantity - reserved <= "reorderPoint")::int AS "lowStock" FROM "InventoryItem"`,
  ]);
  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    include: { card: { select: { image_uris: true } } },
  });
  const byId = new Map(items.map((item) => [item.id, item]));
  res.json({
    data: rows.map((row) => byId.get(row.id)),
    total: counts[0].total,
    totalPages: Math.ceil(counts[0].total / limit),
    summary: (summaries as unknown[])[0],
  });
});

router.get("/inventory/export", async (_req, res) => {
  const rows = await prisma.inventoryItem.findMany({
    orderBy: { sku: "asc" },
    take: 50001,
  });
  if (rows.length > 50000)
    throw new StockError(400, "Exporte até 50.000 SKUs por vez.");
  const keys = [
    "sku",
    "name",
    "setCode",
    "condition",
    "language",
    "finish",
    "quantity",
    "costBrl",
    "priceBrl",
    "reorderPoint",
    "location",
    "cardId",
  ] as const;
  res.setHeader("Content-Disposition", 'attachment; filename="estoque.csv"');
  res
    .type("text/csv")
    .send(
      "\uFEFF" +
        [
          keys.join(";"),
          ...rows.map((row) => keys.map((key) => csvCell(row[key])).join(";")),
        ].join("\r\n"),
    );
});

router.get("/inventory/movements", async (req, res) => {
  const { itemId } = z
    .object({ itemId: z.string().max(100).optional() })
    .parse(req.query);
  const { page, limit } = pagination.parse(req.query);
  const where = itemId ? { itemId } : {};
  const [data, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        actor: { select: { name: true } },
        item: { select: { sku: true, name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);
  res.json({ data, total, totalPages: Math.ceil(total / limit) });
});

async function validateCard(
  tx: Prisma.TransactionClient,
  cardId: string | null,
) {
  if (
    cardId &&
    !(await tx.cards.findUnique({
      where: { card_id: cardId },
      select: { id: true },
    }))
  )
    throw new StockError(400, `Scryfall ID não encontrado: ${cardId}`);
}
router.post("/inventory", async (req: AuthRequest, res) => {
  const input = stockInput.parse(req.body);
  const item = await prisma.$transaction(async (tx) => {
    await validateCard(tx, input.cardId);
    const item = await tx.inventoryItem.create({ data: input });
    await tx.stockMovement.create({
      data: {
        itemId: item.id,
        actorId: req.user!.id,
        type: "OPENING",
        quantityDelta: item.quantity,
        quantityAfter: item.quantity,
        reservedAfter: 0,
        reason: "Cadastro de estoque",
      },
    });
    return item;
  });
  res.status(201).json(item);
});

router.patch("/inventory/:id", async (req: AuthRequest, res) => {
  const { version, ...data } = stockInput
    .pick({ costBrl: true, priceBrl: true, reorderPoint: true, location: true })
    .required()
    .extend({ version: z.number().int().positive() })
    .parse(req.body);
  await prisma.$transaction(async (tx) => {
    const updated = await tx.inventoryItem.updateMany({
      where: { id: String(req.params.id), version },
      data: { ...data, version: { increment: 1 } },
    });
    if (!updated.count)
      throw new StockError(
        409,
        "O estoque mudou. Atualize a página e tente novamente.",
      );
    const item = await tx.inventoryItem.findUniqueOrThrow({
      where: { id: String(req.params.id) },
    });
    await tx.stockMovement.create({
      data: {
        itemId: item.id,
        actorId: req.user!.id,
        type: "EDIT",
        quantityDelta: 0,
        quantityAfter: item.quantity,
        reservedAfter: item.reserved,
        reason: `Preço R$ ${item.priceBrl}; custo R$ ${item.costBrl}; mínimo ${item.reorderPoint}; local ${item.location}`,
      },
    });
  });
  res.status(204).end();
});

router.post("/inventory/:id/movements", async (req: AuthRequest, res) => {
  const input = z
    .object({
      type: z.enum(["RECEIVE", "SALE", "ADJUST", "RESERVE", "RELEASE"]),
      quantity: z
        .number()
        .int()
        .min(-1000000)
        .max(1000000)
        .refine((n) => n !== 0),
      version: z.number().int().positive(),
      reason: z.string().trim().min(3).max(300),
    })
    .refine((v) => v.type === "ADJUST" || v.quantity > 0)
    .parse(req.body);
  await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!item) throw new StockError(404, "SKU não encontrado.");
    if (item.version !== input.version)
      throw new StockError(
        409,
        "O estoque mudou. Atualize a página e tente novamente.",
      );
    const delta =
      input.type === "SALE"
        ? -input.quantity
        : ["RECEIVE", "ADJUST"].includes(input.type)
          ? input.quantity
          : 0;
    const reservedDelta =
      input.type === "RESERVE"
        ? input.quantity
        : input.type === "RELEASE"
          ? -input.quantity
          : 0;
    const quantity = item.quantity + delta,
      reserved = item.reserved + reservedDelta;
    if (
      quantity < 0 ||
      reserved < 0 ||
      reserved > quantity ||
      quantity > 1000000
    )
      throw new StockError(
        400,
        "Saldo insuficiente ou quantidade inválida. Libere a reserva antes de vender unidades reservadas.",
      );
    const updated = await tx.inventoryItem.updateMany({
      where: { id: item.id, version: input.version },
      data: { quantity, reserved, version: { increment: 1 } },
    });
    if (!updated.count)
      throw new StockError(
        409,
        "O estoque mudou. Atualize a página e tente novamente.",
      );
    await tx.stockMovement.create({
      data: {
        itemId: item.id,
        actorId: req.user!.id,
        type: input.type,
        quantityDelta: delta,
        reservedDelta,
        quantityAfter: quantity,
        reservedAfter: reserved,
        reason: input.reason,
      },
    });
  });
  res.status(204).end();
});

async function preview(
  tx: Prisma.TransactionClient,
  items: StockInput[],
  errors: { line: number; message: string }[],
  mapping: Record<string, string>,
) {
  const existing = await tx.inventoryItem.findMany({
    where: { sku: { in: items.map((i) => i.sku) } },
  });
  const bySku = new Map(existing.map((i) => [i.sku, i]));
  const cardIds = items.flatMap((i) => (i.cardId ? [i.cardId] : []));
  const knownCards = new Set(
    (
      await tx.cards.findMany({
        where: { card_id: { in: cardIds } },
        select: { card_id: true },
      })
    ).map((c) => c.card_id),
  );
  const rows = items.map((parsedItem, index) => {
    const item = { ...parsedItem };
    const old = bySku.get(item.sku);
    // Missing optional columns retain existing metadata instead of resetting prices to zero.
    if (old) {
      const merged: Record<string, unknown> = { ...item };
      for (const key of Object.keys(stockInput.shape)) {
        if (!mapping[key])
          merged[key] = ["costBrl", "priceBrl"].includes(key)
            ? Number(old[key as "costBrl" | "priceBrl"])
            : old[key as keyof typeof old];
      }
      Object.assign(item, stockInput.parse(merged));
    }
    if (item.cardId && !knownCards.has(item.cardId))
      errors.push({
        line: index + 2,
        message: `Scryfall ID não encontrado: ${item.cardId}`,
      });
    if (
      old &&
      ["name", "setCode", "condition", "language", "finish", "cardId"].some(
        (key) => old[key as keyof typeof old] !== item[key as keyof StockInput],
      )
    )
      errors.push({
        line: index + 2,
        message: `SKU ${item.sku}: variante diferente. Use outro SKU.`,
      });
    if (old && old.reserved > item.quantity)
      errors.push({
        line: index + 2,
        message: `SKU ${item.sku}: quantidade menor que a reserva.`,
      });
    return {
      ...item,
      before: old?.quantity ?? 0,
      action: old ? "update" : "create",
      version: old?.version ?? 0,
    };
  });
  return {
    rows,
    errors,
    fingerprint: hash(rows),
    creates: rows.filter((r) => r.action === "create").length,
    updates: rows.filter((r) => r.action === "update").length,
  };
}
router.post("/inventory/import/columns", async (req, res) => {
  const { csv } = importInput.pick({ csv: true }).parse(req.body);
  const { headers, rows } = parseCsv(csv);
  res.json({ headers, sample: rows.slice(0, 3), total: rows.length });
});
router.post("/inventory/import/preview", async (req, res) => {
  const { csv, mapping } = importInput.parse(req.body);
  const parsed = importRows(csv, mapping);
  res.json(
    await prisma.$transaction((tx) =>
      preview(tx, parsed.items, parsed.errors, mapping),
    ),
  );
});
router.post("/inventory/import/commit", async (req: AuthRequest, res) => {
  const input = importInput
    .extend({ fingerprint: z.string().length(64) })
    .parse(req.body);
  const parsed = importRows(input.csv, input.mapping);
  if (parsed.errors.length)
    throw new StockError(400, "Corrija os erros antes de importar.");
  // Hash normalized content, not the filename. Reimporting the same snapshot is a no-op.
  const digest = hash({
    items: parsed.items,
    fields: Object.keys(input.mapping)
      .filter((key) => input.mapping[key] && key in stockInput.shape)
      .sort(),
  });
  const result = await prisma.$transaction(
    async (tx) => {
      const previous = await tx.stockImport.findUnique({ where: { digest } });
      if (previous) return { imported: 0, alreadyImported: true };
      const checked = await preview(
        tx,
        parsed.items,
        parsed.errors,
        input.mapping,
      );
      if (checked.errors.length)
        throw new StockError(400, "Corrija os erros antes de importar.");
      if (checked.fingerprint !== input.fingerprint)
        throw new StockError(
          409,
          "O estoque mudou após a prévia. Gere uma nova prévia.",
        );
      for (const row of checked.rows) {
        const { before, action, version, ...data } = row;
        const item =
          action === "create"
            ? await tx.inventoryItem.create({ data })
            : await tx.inventoryItem.update({
                where: { sku: data.sku },
                data: { ...data, version: { increment: 1 } },
              });
        await tx.stockMovement.create({
          data: {
            itemId: item.id,
            actorId: req.user!.id,
            type: "IMPORT",
            quantityDelta: item.quantity - before,
            quantityAfter: item.quantity,
            reservedAfter: item.reserved,
            reason: `CSV: ${input.filename}`,
          },
        });
      }
      await tx.stockImport.create({
        data: {
          digest,
          filename: input.filename,
          rowCount: checked.rows.length,
        },
      });
      return { imported: checked.rows.length, alreadyImported: false };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 20000,
    },
  );
  res.json(result);
});

router.use(
  (
    err: unknown,
    _req: import("express").Request,
    res: import("express").Response,
    next: import("express").NextFunction,
  ) => {
    if (err instanceof StockError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(err.code)
    ) {
      res
        .status(409)
        .json({
          message:
            "SKU já cadastrado ou estoque alterado por outro administrador. Atualize e tente novamente.",
        });
      return;
    }
    if (
      err instanceof Error &&
      !(err instanceof z.ZodError) &&
      /CSV:|Mapeie|arquivo|Importe|linhas/.test(err.message)
    ) {
      res.status(400).json({ message: err.message });
      return;
    }
    next(err);
  },
);
export default router;
