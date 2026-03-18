import sequelize from "@/db/connection";
import { Purchase, PurchaseItems } from "@/db/models";
import { NextResponse } from "next/server";
import { generatePurchaseId } from "@/functions/purchase";

// insert 
export async function  POST(request){ 
    await sequelize.sync(); 

    const requiredFields = [ 
        "ItemName", 
        "Quantity", 
        "UnitPrice",  
        "Total",  
        "Unit", 
        "RequiredBalance",
    ]

    const body = await request.json(); 

    if(!body.purchaseItem){ 
        return NextResponse.json( 
            {message: "Data is required"},
            {status: 400}
        ); 
    } 
     let missingFields  = {}; 
    //item valdation 
    for(const item of body.purchaseItem){ 
      let missing  =[]; 
      requiredFields.forEach(field => { 
        if(item[field] === undefined || item[field] === null){ 
            missing.push(`${field} is required`); 
        }
        }); 
        if(missing.length > 0){ 
            missingFields[`purchaseItem_${body.purchaseItem.indexOf(item)+1}`] = missing; 
        }

    }

    console.log(missingFields); 

    if(Object.keys(missingFields).length > 0){ 
        return NextResponse.json( 
            {message: "Validation failed", errors: missingFields},
            {status: 400}
        ); 
    }
     // insert data 
    try{  
        const codeID = generatePurchaseId();
        const purchase = await  Purchase.create({ 
            PurchaseID: codeID,
            timeStamp: new Date(),
        }); 
        const purchaseItemsData = body.purchaseItem.map(item => ({ 
            ...item, 
            PurchaseID: purchase.PurchaseID, 
        })); 
       const items =   await sequelize.models.purchaseItems.bulkCreate(purchaseItemsData);
      
       if(!items || items.length === 0 || items === undefined ){
          await purchase.destroy({
              where: {PurchaseID: purchase.PurchaseID}
          });   

          return NextResponse.json(
            {message: "Failed to create purchase items, purchase rolled back"},
            {status: 500}
          ); 
        
        } 
        return NextResponse.json({
            purchase: purchase , 
            items 
        }); 
    }catch(error){ 
        console.error("Error inserting data:", error); 
        return NextResponse.json( 
            {message: "Internal Server Error"},
            {status: 500}
        ); 
    }
  
 }

 //get all 
export async function GET(){ 
  try {
     await sequelize.sync(); 
     const purchases = await Purchase.findAll({ 
        include: [{ 
            model: PurchaseItems 
        }]
     }); 
        return NextResponse.json({purchases}, {status: 200});
  } catch (error) {
     return NextResponse.json(
        {message: "Internal Server Error" , error: error.message},
        {status: 500}
    );
  }  
 }