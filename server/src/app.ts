import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import cards from './card-routes.js';
import users from './user-routes.js';

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '16kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(cards);
app.use(users);
app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));
const errors: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ message: 'Dados inválidos.', issues: err.issues }); return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'JSON inválido.' }); return;
  }
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ message: 'Requisição muito grande.' }); return;
  }
  console.error(err);
  res.status(500).json({ message: 'Erro interno. Tente novamente.' });
};
app.use(errors);
