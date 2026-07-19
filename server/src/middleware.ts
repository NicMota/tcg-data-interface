import { NextFunction, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthRequest } from "./interfaces";

const secret = process.env.JWT_SECRET!;

export function validJwt(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return res.sendStatus(401);
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, secret);

        if (typeof decoded === "string") {
            return res.sendStatus(403);
        }

        req.userInfo = decoded as AuthRequest["userInfo"];

        next();
    } catch {
        return res.sendStatus(403);
    }
}