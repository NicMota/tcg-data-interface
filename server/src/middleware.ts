import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import prisma from './db/db.js';

export interface AuthUserPayload {
    id: string;
    email: string;
}

export interface AuthRequest extends Request {
    user?: AuthUserPayload;
}

const secret = process.env.JWT_SECRET;

const validJwt = (req: AuthRequest, res: Response, next: NextFunction) => {

    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;

    if (!token || !secret) {
        res.status(403).json({ message: "Não autorizado." });
        return;
    }

    jwt.verify(token, secret, (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err || !decoded) {
            res.status(403).json({ message: "Sessão inválida ou expirada." });
            return;
        }

        req.user = decoded as AuthUserPayload;
        next();
    })

}

// Must run after validJwt, which populates req.user.
const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {

    if (!req.user) {
        res.status(403).json({ message: "Não autorizado." });
        return;
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });

        if (!user || !user.isAdmin) {
            res.status(403).json({ message: "Acesso restrito a administradores." });
            return;
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao verificar permissões." });
    }
}

export { validJwt, requireAdmin };
