import prisma from '../db/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type User from '../interfaces/user.interfaces.js';

export class AccountError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
function stripPassword<T extends { password: string }>(user: T) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}
function signToken(user: { id: string; email: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required');
  return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '8h' });
}
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.password)) {
    throw new AccountError('Usuário ou senha inválidos.', 401);
  }
  return { token: signToken(user), user: stripPassword(user) };
}
export async function register(user: User) {
  const password = await bcrypt.hash(user.password, 10);
  try {
    const created = await prisma.user.create({ data: { email: user.email, name: user.name, password } });
    return { token: signToken(created), user: stripPassword(created) };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      throw new AccountError('Este email já está cadastrado.', 409);
    }
    throw error;
  }
}
export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? stripPassword(user) : null;
}
