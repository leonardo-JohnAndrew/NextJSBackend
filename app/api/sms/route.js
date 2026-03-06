import { NextResponse } from 'next/server';
 
const sequelize = require("@/db/connection"); 
const {SMS }  = require('../../../db/models/index')
// crud 


 // Post 
   export async function POST(request) {
     
     await sequelize.sync();  // database sync 
     const body = await request.json();   
     
     // dito ang validations  / /here the validations 
     // requirements

     // create / insert sa database 
     const text_messages = await SMS.create({  // Syntax pattern ExportModel.function 
        sender: body.sender, 
        content: body.content,     
     });                         
      // return or response 
    return NextResponse.json({ "Your Data is" : text_messages }, {status: 200 });
}
 //read all 
 export async function GET() {
    // validations 
   try {
      await sequelize.sync(); 
     const data = await SMS.findAll({}); 
      return NextResponse.json({
         raw_data :  data
      }); 
   } catch (error) {
     return NextResponse.json({
        message: error
     }, {status : 500})
   } 
 }

