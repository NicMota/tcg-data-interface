import { Request } from "express";
import jwt from 'jsonwebtoken'
interface AuthRequest extends Request {
    userInfo: jwt.JwtPayload & {
        id: string;
        email: string;
    };
}
interface TokenPayload {
    id: string;
    email: string;
}

export {AuthRequest, TokenPayload}