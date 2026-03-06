import sequelize from "@/db/connection";
import { Purchase, PurchaseItems } from "@/db/models";
import { NextResponse } from "next/server";

export async function GET(req, {params}) {
    await sequelize.sync(); 
    const {purchaseid}  = await params 
    const purchase = await Purchase.findByPk(purchaseid, {
        include: PurchaseItems 
    }); 

    try {
         if(!purchase){
                   return NextResponse.json({
                     messages: "record not found" 
                   }, {status: 404} )
                }
                return NextResponse.json({purchase}); 
    } catch (error) {
         return NextResponse.json({messages: error } , {status : 500}); 
    }
}