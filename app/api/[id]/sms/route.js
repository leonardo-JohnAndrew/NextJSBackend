import { NextResponse } from 'next/server';
import sequelize from '../../../../db/connection';
import SMS from '../../../../db/models/sms';


// read by id 
export async function GET(req,{params}) {
    await sequelize.sync(); 
    const {id} = await params
    const messages = await SMS.findByPk(id); 
    try {
        if(!messages){
           return NextResponse.json({
             messages: "record not found" 

           }, {status: 404} )
        }
        
        return NextResponse.json({messages}); 
    } catch (error) {
        return NextResponse.json({messages: error } , {status : 500}); 
    }
    
    //update by id 
}
export async function PATCH(req, {params }) {
    await sequelize.sync(); 
    const body = await req.json();
    const {id} = await params
    const message  = await SMS.findByPk(id)
    try {
        if(!message){
           return NextResponse.json({
             messages: "record not found" 
        
           }, {status: 404} )
        }  
         //update
       await message.update({
          sender : body.sender, 
          content: body.content 
       }); 
         return NextResponse.json({updated_data :message }, {status : 201}); 
        
    } catch (error) {
        return NextResponse.json({
            error_message : "something wrong", 
            error 
        } , {status : 500})
  }    
}
// delete by id 
  export async function  DELETE(req, {params}) {
     await sequelize.sync(); 
     const {id} = await  params; 
     const message = await SMS.findByPk(id); 
     try {
          if(!message){
           return NextResponse.json({
             messages: "record not found" 
        
           }, {status: 404} )
        }  
        // del 
         await message.destroy(); 
           return NextResponse.json({"message":`id: ${id} is deleted from database`}); 

     } catch (error) {
        return NextResponse.json({ 
            error_message : "something wrong", 
             error 
        } , {status : 500} ); 
     }
  }