import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyPrice, type PriceEvidence } from "./insights.js";
const now = new Date("2026-10-28T12:00:00Z");
const evidence: PriceEvidence = {
  current: 10,
  previous: 10.2,
  low: 10,
  average: 15,
  observations: 20,
  firstDate: new Date("2026-10-01"),
  asOf: new Date("2026-10-28"),
  previousDate: new Date("2026-10-27"),
};
test("discounted lows can be shortlisted when the latest day has stabilized", () => {
  assert.deepEqual(classifyPrice(evidence, now).signals, ["low", "research"]);
});
test("spikes and drops require consecutive daily observations", () => {
  assert(
    classifyPrice(
      { ...evidence, current: 12, previous: 10 },
      now,
    ).signals.includes("spike"),
  );
  assert(
    classifyPrice(
      { ...evidence, current: 8, previous: 10, low: 8 },
      now,
    ).signals.includes("drop"),
  );
  assert.deepEqual(
    classifyPrice({ ...evidence, current: 20, previous: 10 }, now).signals,
    ["spike"],
  );
  const falling = classifyPrice({ ...evidence, previous: 20 }, now);
  assert(falling.signals.includes("drop"));
  assert(!falling.signals.includes("research"));
  const gap = classifyPrice(
    { ...evidence, previous: 5, previousDate: new Date("2026-10-25") },
    now,
  );
  assert.equal(gap.change, null);
  assert(!gap.signals.includes("spike"));
});
test("stale, sparse, flat and penny-priced histories do not generate misleading candidates", () => {
  for (const patch of [
    { asOf: new Date("2026-10-20") },
    { observations: 2 },
    { firstDate: new Date("2026-10-26") },
    { current: 0.5 },
  ])
    assert.deepEqual(classifyPrice({ ...evidence, ...patch }, now).signals, []);
  assert.deepEqual(
    classifyPrice(
      { ...evidence, current: 10, low: 10, average: 10, previous: 10 },
      now,
    ).signals,
    [],
  );
});
