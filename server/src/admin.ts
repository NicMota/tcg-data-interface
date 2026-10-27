import prisma from './db/db.js';
const email = process.argv[2]?.trim().toLowerCase();
if (!email) throw new Error('Uso: npm run admin -- email@example.com');
try {
  const user = await prisma.user.update({ where: { email }, data: { isAdmin: true }, select: { email: true } });
  console.log(`Administrador: ${user.email}`);
} finally { await prisma.$disconnect(); }
