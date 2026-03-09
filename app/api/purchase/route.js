import { generatePurchaseID } from "@/app/functions/purchase";
import { NextResponse } from "next/server";

const sequelize = require("@/db/connection"); 
const {SMS, Purchase,PurchaseItems} = require("../../../db/models/index"); 


// insert 
 
export async function POST(request) {
  await sequelize.sync();

  const requiredFields = ["ItemName","Quantity","UnitPrice","Total","Unit","RequiredBalance"];
  const body = await request.json();

  if (!body.purchaseItem) {
    return NextResponse.json(
      { message: "purchaseItem is required" },
      { status: 400 }
    );
  }

  // validate items
  for (const item of body.purchaseItem) {
    if (!requiredFields.every(field => item[field] !== undefined)) {
      return NextResponse.json(
        { message: "Missing required fields in purchase item" },
        { status: 400 }
      );
    }
  }

  try {

    const codeID = generatePurchaseID();

    const createPurchase = await Purchase.create({
      PurchaseID: codeID,
      timestamp: new Date(),
    });

    const purchaseItemsData = body.purchaseItem.map(item => ({
      ItemName: item.ItemName,
      Quantity: item.Quantity,
      UnitPrice: item.UnitPrice,
      Total: item.Total,
      Unit: item.Unit,
      RequiredBalance: item.RequiredBalance,
      PurchaseID: createPurchase.PurchaseID
    }));

    const items = await PurchaseItems.bulkCreate(purchaseItemsData);

    return NextResponse.json({
      purchase: createPurchase,
      items
    });

  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}