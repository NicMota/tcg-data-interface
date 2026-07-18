import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;

const validJwt = (req :Request,res : Response, next :NextFunction) =>
{   

    const token = req.headers["authorization"];
   
    if(!token || !secret)
    {   
        res.status(403).end();
        return;
    }
    jwt.verify(token,secret,(err,userInfo)=>
    {
        if(err)
        {
            res.status(403).end();
            return;
        }

        next();
    })

}

export {validJwt};