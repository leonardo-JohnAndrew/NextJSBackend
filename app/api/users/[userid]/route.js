import { NextResponse } from "next/server";

const sequelize = require("@/db/connection");
const {SMS , User, Table3} = require('../../../../db/models/index'); 


export async function GET( req , {params}) {
    try {
        await sequelize.sync(); 
        await sequelize.authenticate(); 
        const {userid} = await params; 
        const users = await User.findByPk(userid , {
            include: [
                {
                    model: SMS, 
                    include: [ 
                        { 
                          model: Table3 , 
                   
                        }
                    ]
                }
            ]
        }); 
        
        return NextResponse.json({
            raw_data : users 
            
        }, {status: 200})
         
    } catch (error ) {
        return NextResponse.json({
            message : "something wrong" , 
            
        },{status : 500}); 
    }
}