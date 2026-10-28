import { load_cards_data, update_prices } from "./models/CardM.js";
import prisma from "./db/db.js";
import { databaseDiagnostic } from "./db/diagnostics.js";
try {
  // Fail before fetching any bulk data if the database is unavailable.
  await prisma.$queryRaw`SELECT 1`;
  await load_cards_data();
  await update_prices();
} catch (error) {
  console.error(databaseDiagnostic(error, process.env.DATABASE_URL) ?? error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
