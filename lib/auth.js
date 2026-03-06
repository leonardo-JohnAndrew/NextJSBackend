import jwt from "jsonwebtoken" ; 
import { cookies } from 'next/headers';
import { EXPORT_DETAIL } from "next/dist/shared/lib/constants";
const JWT_SECRET =  process.env.JWT_SECRET;

export function signToken(payload){ 
     return jwt.sign(payload , JWT_SECRET , {expiresIn: "5m"}); 
}

export function verifyToken(token) { 
     return jwt.verify(token , JWT_SECRET ) ; 
} 






