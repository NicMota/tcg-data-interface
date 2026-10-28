import { test } from "node:test";
import assert from "node:assert/strict";
import { databaseDiagnostic } from "./db/diagnostics.js";

test("database connection errors explain recovery without printing credentials", () => {
  const message = databaseDiagnostic(
    { code: "ECONNREFUSED" },
    "postgresql://private-user:private-password@localhost:5432/tcg",
  );
  assert(message?.includes("localhost:5432"));
  assert(message?.includes("docker compose up -d --wait db"));
  assert(!message?.includes("private-user"));
  assert(!message?.includes("private-password"));
});

test("authentication and schema problems have different recovery instructions", () => {
  assert.match(
    databaseDiagnostic({ code: "28P01" }, undefined)!,
    /credentials/,
  );
  assert.match(databaseDiagnostic({ code: "P2021" }, undefined)!, /db:migrate/);
  assert.equal(
    databaseDiagnostic(new Error("Unrelated failure"), undefined),
    null,
  );
});
