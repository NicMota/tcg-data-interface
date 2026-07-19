import prisma from "./db/db.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface User {
    name: string
    email: string
    password: string
}
const secret = process.env.JWT_SECRET;

function stripPassword<T extends { password: string }>(user: T) {
    const { password, ...safeUser } = user;
    return safeUser;
}

function signToken(user: { id: string; email: string }) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "8h",
        }
    );
}

export async function login(email: string, password: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new Error("Usuário ou senha inválidos.");
        }

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            throw new Error("Usuário ou senha inválidos.");
        }

        const token = signToken(user);

        return { token, user: stripPassword(user) };
    } catch (error) {
        console.error(error);
        throw error;
    }
}
export async function register(user : User)
{  
    try {
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (existing) {
            throw new Error("Este email já está cadastrado.");
        }

        const hashedPwd = await bcrypt.hash(user.password,10)
        const created = await prisma.user.create({
            data: {
            ...user,
            password: hashedPwd,
            },
        });

        const token = signToken(created);

        return { token, user: stripPassword(created) };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getUserById(id: string) {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return null;
        return stripPassword(user);
    } catch (error) {
        console.error(error);
        throw error;
    }
}