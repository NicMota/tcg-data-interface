import { Router } from "express";
import { z } from "zod";
import prisma from "./db/db.js";

export interface PriceEvidence {
  current: number;
  previous: number | null;
  low: number;
  average: number;
  observations: number;
  firstDate: Date;
  asOf: Date;
  previousDate: Date | null;
}
export function classifyPrice(e: PriceEvidence, now = new Date()) {
  const day = 86400000;
  const fresh =
    e.asOf.getTime() <= now.getTime() &&
    now.getTime() - e.asOf.getTime() <= 3 * day;
  const enough =
    e.observations >= 7 && e.asOf.getTime() - e.firstDate.getTime() >= 7 * day;
  const daily =
    e.previousDate != null &&
    e.asOf.getTime() - e.previousDate.getTime() === day;
  const change =
    e.previous != null && e.previous > 0 && daily
      ? Math.round((e.current / e.previous - 1) * 100 * 1e8) / 1e8
      : null;
  const discount =
    e.average > 0
      ? Math.round((1 - e.current / e.average) * 100 * 1e8) / 1e8
      : 0;
  const signals: string[] = [];
  if (fresh && enough && e.current >= 1 && e.low > 0) {
    if (e.current <= e.low * 1.05 && discount >= 5) signals.push("low");
    if (discount >= 15 && change != null && change >= -5 && change <= 10)
      signals.push("research");
    if (change != null && change >= 20) signals.push("spike");
    if (change != null && change <= -20) signals.push("drop");
  }
  return { signals, change, discount, fresh, enough };
}

const router = Router();
router.get("/market/insights", async (req, res) => {
  const { days } = z
    .object({
      days: z.coerce
        .number()
        .pipe(z.union([z.literal(30), z.literal(90), z.literal(180)]))
        .default(90),
    })
    .parse(req.query);
  const now = new Date();
  const since = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - days + 1,
    ),
  );
  type Row = PriceEvidence & {
    card_id: string;
    name: string | null;
    set_name: string | null;
    image_uris: unknown;
    series: { date: string; price: number }[];
  };
  // Aggregate in PostgreSQL: the full historical catalog never enters application memory.
  const rows = await prisma.$queryRaw<Row[]>`
    WITH ranked AS (
      SELECT card_id, price_usd::float8 AS price, date,
        row_number() OVER (PARTITION BY card_id ORDER BY date DESC) AS rn
      FROM card_prices WHERE date >= ${since} AND date <= ${now} AND price_usd > 0
    ), evidence AS (
      SELECT card_id, max(price) FILTER (WHERE rn = 1) AS current,
        max(price) FILTER (WHERE rn = 2) AS previous,
        min(price) AS low, avg(price) AS average, count(*)::int AS observations,
        min(date) AS "firstDate", max(date) AS "asOf",
        max(date) FILTER (WHERE rn = 2) AS "previousDate",
        json_agg(json_build_object('date', date, 'price', price) ORDER BY date) FILTER (WHERE rn <= 20) AS series
      FROM ranked GROUP BY card_id
    )
    SELECT e.*, c.name, c.set_name, c.image_uris FROM evidence e
    JOIN cards c ON c.card_id = e.card_id
    WHERE e.observations >= 7 AND e."asOf" - e."firstDate" >= 7
      AND e."asOf" >= ${new Date(now.getTime() - 3 * 86400000)} AND e.current >= 1
      AND ((e.current <= e.low * 1.05 AND e.current <= e.average * 0.95)
        OR (e."asOf" - e."previousDate" = 1 AND (
          (e.current <= e.average * 0.85 AND e.current >= e.previous * 0.95 AND e.current <= e.previous * 1.10)
          OR e.current >= e.previous * 1.20 OR e.current <= e.previous * 0.80)))
    ORDER BY (e.average - e.current) / nullif(e.average, 0) DESC, e.card_id
    LIMIT 500`;
  const [coverage] = await prisma.$queryRaw<
    { tracked: number; lastUpdate: Date | null }[]
  >`
    SELECT count(DISTINCT card_id)::int AS tracked, max(date) AS "lastUpdate"
    FROM card_prices WHERE date >= ${since} AND date <= ${now} AND price_usd > 0`;
  const data = rows
    .map((row) => ({ ...row, ...classifyPrice(row, now) }))
    .filter((row) => row.signals.length);
  res.json({
    data,
    days,
    coverage,
    limit: 500,
    source: "Scryfall",
    currency: "USD",
    finish: "nonfoil",
  });
});
export default router;
