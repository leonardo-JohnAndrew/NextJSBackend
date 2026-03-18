const { DataTypes } = require("sequelize");
const sequelize = require("../connection"); 

const Purchase = sequelize.define('purchase', { 
     PurchaseID: { 
        type : DataTypes.STRING, 
        allowNull: true, 
        primaryKey : true, 
    }, 
     RequestorRole: { 
        type: DataTypes.STRING, 
        allowNull: true,
    }, 
    EmployeeSign:{ 
        type: DataTypes.STRING, 
         allowNull: true , 
    }, 
    ChiefAdminManageSign: { 
        type: DataTypes.STRING , 
        allowNull: true , 
     }, 
     ProjectDirectorSign: { 
        type: DataTypes.STRING , 
        allowNull: true , 
     }, 
     Remarks: { 
        type : DataTypes.STRING, 
         allowNull: true,  
     }, 
     isClaimable: { 
        type: DataTypes.BOOLEAN, 
        allowNull: true, 
        defaultValue: false 
     }, 
     Total:{
         type: DataTypes.INTEGER,
         allowNull: true,
         defaultValue: 0
     },
      timeStamp: { 
         type:DataTypes.DATE, 
         defaultValue: DataTypes.NOW
     }
},{}); 
module.exports = Purchase 
