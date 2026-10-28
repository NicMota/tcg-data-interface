import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({
  connectionString,
  max: Number(process.env.DB_POOL_MAX ?? 10),
  connectionTimeoutMillis: 5000,
});
const prisma = new PrismaClient({ adapter });

export default prisma;
