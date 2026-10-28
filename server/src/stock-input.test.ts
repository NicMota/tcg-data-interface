import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, importRows, csvCell } from "./stock-input.js";
test("CSV handles quoted delimiters, quotes, BOM, CRLF and multiline cells", () => {
  const csv =
    '\uFEFFsku;name;quantity\r\nABC;"Card; ""Special""\nEdition";3\r\n';
  assert.deepEqual(parseCsv(csv).rows, [
    ["ABC", 'Card; "Special"\nEdition', "3"],
  ]);
  assert.equal(
    importRows(csv, { sku: "sku", name: "name", quantity: "quantity" }).items[0]
      .quantity,
    3,
  );
});
test("CSV reports row errors and rejects duplicates, missing quantities and negative balances", () => {
  const result = importRows(
    "sku,name,quantity\na,Card,2\na,Card,2\nb,Card,-1\nc,Card,",
    { sku: "sku", name: "name", quantity: "quantity" },
  );
  assert.equal(result.items.length, 1);
  assert.deepEqual(
    result.errors.map((e) => e.line),
    [3, 4, 5],
  );
  assert.throws(() => parseCsv("sku;sku\na;1"), /cabeçalhos/);
  assert.throws(() => parseCsv('sku,name\na,"unterminated'), /aspas/);
});
test("Brazilian decimal prices are parsed without silently accepting invalid numbers", () => {
  const result = importRows(
    'sku;name;quantity;preco\na;Card;2;"1.234,56"\nb;Card;3;not-a-price',
    { sku: "sku", name: "name", quantity: "quantity", priceBrl: "preco" },
  );
  assert.equal(result.items[0].priceBrl, 1234.56);
  assert.equal(result.errors.length, 1);
  assert.equal(csvCell('=HYPERLINK("test")'), '"\'=HYPERLINK(""test"")"');
});
