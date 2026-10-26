import 'dotenv/config';
import { app } from './app.js';
import prisma from './db/db.js';
import { startDailySync } from './scheduler.js';

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Configure DATABASE_URL e JWT_SECRET (mínimo 32 caracteres).');
}
await prisma.$queryRaw`SELECT 1`;
const stopSchedule = startDailySync();
const server = app.listen(Number(process.env.PORT ?? 8000), '0.0.0.0', () => {
  console.log(`TCG API listening on port ${process.env.PORT ?? 8000}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    stopSchedule();
    server.close(() => { void prisma.$disconnect().then(() => process.exit(0)); });
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
