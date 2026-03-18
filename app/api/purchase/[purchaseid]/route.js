import sequelize  from "@/db/connection"; 
import { Purchase  , PurchaseItems} from "@/db/models"; 
import { NextResponse } from "next/server"; 


// get purchase by id 
export async function GET( request, {params}){
    await sequelize.sync(); 
    const {purchaseid} =await params; 
    try{ 
        const purchase = await Purchase.findByPk(purchaseid, { 
            include : [PurchaseItems]   
        }) 
         if(!purchase){ 
            return NextResponse.json({ 
                message: "record not found", 
            }, {status: 404}) 
         } 

         return NextResponse.json({ 
            purchase 
        }, {status: 200}); 
    }catch(error){ 
        return NextResponse.json( 
            {message: "Error fetching purchase", error: error.message},
            {status: 500}
        );
    }
} 

// update purchase by id 
// PurchaseItems: fields EndingInventoryDate , EndingInventory ,UnitPrice , updatedAt
// Purchase: fields EmployeeSign , ChiefSign , ProjectDirectorSign 
// remark , isClaimable 