import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';

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

export { validJwt };
