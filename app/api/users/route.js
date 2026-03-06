import {  signToken, verifyToken } from "@/lib/auth"; 
import { cookies  } from "next/headers"; 
import bcrypt from "bcryptjs"
import { use } from "react";
import { error } from "node:console";
import { NextResponse } from "next/server";

export async function POST(request) {
  const  body = await request.json(); 
   
  const user =  { 
     id : 1 , 
     email : "test@test.com", 
     passwords : "password"
  } 
  // return NextResponse.json({ "Your Data is" : body }, {status: 200 });
   const isMatch = body.passwords === body.passwords;  
  if(!isMatch){ 
    return NextResponse.json({error: "Invalid"})
  }

  const token = signToken({userId: user.id}); 
 //  Set HTTP-Only cookie
 (await cookies()).set("token", token, { 
 httpOnly:true , 
 secure: process.env.NODE_ENV === "development", 
sameSite: "strict", 
path:"/" , 
maxAge: 60*5
 }); 

  return Response.json({ message: "Login successful" });
}


export async function GET() {
    const token = (await cookies()).get('token')?.value; 
    
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);
     const now = Math.floor(Date.now() / 1000); // current time in seconds
    const exp = decoded.exp; // JWT expiration in seconds
    const timeLeft = exp - now;
    return Response.json({ message: "Protected data", user: decoded , "timeleft ": timeLeft});
  } catch (err) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }


}


