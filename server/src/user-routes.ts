import { Router } from "express";
import { AccountError, getUserById, login, register } from "./models/UserM.js";
import { getAdminStats, runCardSync, runPriceSync } from "./models/CardM.js";

import {requireAdmin, validJwt } from "./middleware.js";
import { AuthRequest } from "./interfaces/auth.interfaces.js";


import { loginInput, registerInput, profileInput, pagination } from './utils.js';
import prisma from './db/db.js';

const user_router = Router()

user_router.post('/login', async (req, res)=>{
  try {
    const {email,password} = loginInput.parse(req.body);
    const result = await login(email,password);
    res.status(200).json(result);
  } catch (error) {
    if (!(error instanceof AccountError)) throw error;
    res.status(error.status).json({ message: error.message });
  }
})

user_router.post('/register', async (req, res)=>
{
  try {
    const {email,name,password} = registerInput.parse(req.body);
    const result = await register({email,name,password});
    res.status(201).json(result);
  } catch (error) {
    if (!(error instanceof AccountError)) throw error;
    res.status(error.status).json({ message: error.message });
  }
});

user_router.get('/me', validJwt, async (req: AuthRequest, res) => {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "Usuário não encontrado." });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar usuário." });
  }
});


// --- Admin only ---

user_router.get('/admin/stats', validJwt, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const stats = await getAdminStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar estatísticas." });
  }
});

user_router.post('/admin/sync-cards', validJwt, requireAdmin, async (req: AuthRequest, res) => {
  const result = runCardSync();
  res.status(result.started ? 202 : 409).json(result);
});

user_router.post('/admin/update-prices', validJwt, requireAdmin, async (req: AuthRequest, res) => {
  const result = runPriceSync();
  res.status(result.started ? 202 : 409).json(result);
});

user_router.patch('/me', validJwt, async (req: AuthRequest, res) => {
  const { name } = profileInput.parse(req.body);
  await prisma.user.update({ where: { id: req.user!.id }, data: { name } });
  res.json({ user: await getUserById(req.user!.id) });
});

user_router.get('/favorites', validJwt, async (req: AuthRequest, res) => {
  const { page, limit } = pagination.parse(req.query);
  const where = { userId: req.user!.id };
  const [rows, total] = await prisma.$transaction([
    prisma.favorite.findMany({ where, orderBy: [{ createdAt: 'desc' }, { cardId: 'asc' }],
      skip: (page - 1) * limit, take: limit,
      include: { card: { include: { card_prices: { orderBy: { date: 'desc' }, take: 2 } } } } }),
    prisma.favorite.count({ where }),
  ]);
  res.json({ data: rows.map(row => row.card), total, totalPages: Math.ceil(total / limit) });
});
user_router.get('/favorites/ids', validJwt, async (req: AuthRequest, res) => {
  const rows = await prisma.favorite.findMany({ where: { userId: req.user!.id }, select: { cardId: true } });
  res.json(rows.map(row => row.cardId));
});
user_router.put('/favorites/:cardId', validJwt, async (req: AuthRequest, res) => {
  const cardId = String(req.params.cardId);
  if (!await prisma.cards.findUnique({ where: { card_id: cardId }, select: { id: true } })) {
    res.status(404).json({ message: 'Carta não encontrada.' }); return;
  }
  await prisma.favorite.upsert({ where: { userId_cardId: { userId: req.user!.id, cardId } },
    create: { userId: req.user!.id, cardId }, update: {} });
  res.status(204).end();
});
user_router.delete('/favorites/:cardId', validJwt, async (req: AuthRequest, res) => {
  await prisma.favorite.deleteMany({ where: { userId: req.user!.id, cardId: String(req.params.cardId) } });
  res.status(204).end();
});
export default user_router;