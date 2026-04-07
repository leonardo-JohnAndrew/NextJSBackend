import { NextResponse  } from "next/server";
import sequelize  from "@/db/connection"; 
import { ELists } from "@/db/models"; 
import { Op } from "sequelize";

export async function GET(params) {
     await sequelize.sync(); 
     try{ 
         const elist = await ELists.findAll({
            where:{ 
                data: {
                    [Op.ne] : 0
                }
            }
         }) 
         const total = await ELists.sum('data', {
            where:{
                data: { 
                    [Op.ne] : 0
                }
            }
         })
         
         return NextResponse.json({elist, total}, {status: 201}); 
     }catch(err){ 
         return NextResponse.json({message: err }, {status: 500}); 
     }
}