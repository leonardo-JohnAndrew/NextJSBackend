import { NextResponse  } from "next/server";
import sequelize  from "@/db/connection"; 
import { ALists } from "@/db/models"; 
import { Op } from "sequelize";
import Alist from "@/app/Table/Alist/page";

export async function GET(params) {
     await sequelize.sync(); 
     try{ 
         const alist = await ALists.findAll({
            where:{ 
                data: {
                    [Op.ne] : 0
                }
            }
         }) 
         const total = await ALists.sum('data', {
            where:{
                data:{ 
                    [Op.ne]: 0 
                }
            }
         })
         
         return NextResponse.json({alist , total}, {status: 201}); 
     }catch(err){ 
         return NextResponse.json({message: err }, {status: 500}); 
     }
}