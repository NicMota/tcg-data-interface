import prisma from "./db/db.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface User {
    name: string
    email: string
    password: string
}
const secret = process.env.JWT_SECRET;



export async function login(email: string, password: string) {
    try {
        if (!secret) {
            throw new Error("JWT_SECRET environment variable is not defined");
        }
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

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
            },
            secret,
            {
                expiresIn: "8h",
            }
        );
        
        return token;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
export async function register(user : User)
{  
    try {
        const hashedPwd = await bcrypt.hash(user.password,10)
        user.password = hashedPwd;
        return prisma.user.create({
            data: {
            ...user,
            password: hashedPwd,
            },
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function me(id : string){
    const user = await prisma.user.findUnique({
        where: {
            id: id
        },
        select: {
            id: true,
            name: true,
            email: true
        }
    });

    return user;
}