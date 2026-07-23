import { Request } from "express";
import jwt from 'jsonwebtoken'


export interface AuthUserPayload {
    id: string;
    email: string;
}

interface AuthRequest extends Request {
    user?: AuthUserPayload;
}

interface TokenPayload {
    id: string;
    email: string;
}

export {AuthRequest, TokenPayload}

