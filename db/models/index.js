import SMS  from "./sms.js";
import User from "./user.js";
import sequelize  from "../connection.js";
import Table3  from "./table3.js";
import PurchaseItems from "./purchaseItem.js";
import Purchase from "./purchase.js";
import Comport from "./comport.js";
import Extract from "./extract.js";
import Extracted from "./extracted.js";
// 1:m
User.hasMany(SMS ,{
    foreignKey: { 
         name: "user_ID" 
    }, 
}) 
SMS.belongsTo(User,{
       foreignKey: { 
         name: "user_ID" 
    },
})

SMS.hasMany(Table3, {
    foreignKey: {
        name: "content_id"
    } ,
})

Table3.belongsTo(SMS, {
    foreignKey: {
        name: "content_id"
    } ,
})

// purchase 
Purchase.hasMany(PurchaseItems, { 
  foreignKey: {
        name: "PurchaseID" 
    }, 
})
PurchaseItems.belongsTo(Purchase,  {
    foreignKey: {
        name: "PurchaseID" 
    }, 
})

// comport 
Comport.hasMany(SMS, {
    foreignKey: {
        name: "port_number"
    } ,
}) 
SMS.belongsTo(Comport, {
    foreignKey: {
        name: "port_number"
    } ,
})

export {
    User , 
    SMS , 
    sequelize, 
    Table3, 
    Purchase , 
    PurchaseItems, 
    Comport,
    Extract , 
    Extracted
}