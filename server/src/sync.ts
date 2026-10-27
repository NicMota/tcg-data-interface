import { load_cards_data, update_prices } from './models/CardM.js';
import prisma from './db/db.js';
try {
  await load_cards_data();
  await update_prices();
} finally { await prisma.$disconnect(); }
