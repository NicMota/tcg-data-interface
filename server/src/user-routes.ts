import { Router } from "express";
import { getUserById, login, register } from "./models/UserM";
import { getAdminStats, runCardSync, runPriceSync } from "./models/CardM";

import {requireAdmin, validJwt } from "./middleware";
import { AuthRequest } from "./interfaces/auth.interfaces";


const user_router = Router()

user_router.post('/login', async (req, res)=>{
  try {
    const {email,password} = req.body;
    const result = await login(email,password);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error?.message ?? "Usuário ou senha inválidos." });
  }
})

user_router.post('/register', async (req, res)=>
{
  try {
    const {email,name,password} = req.body;
    const result = await register({email,name,password});
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error?.message ?? "Erro ao criar conta." });
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

export default user_router;