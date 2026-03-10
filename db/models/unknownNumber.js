const {DataTypes} = require("sequelize"); 
const sequelize = require("../connection");  

const UnknownNumber = sequelize.define('unknown_number', {
  uknownSim_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    autoIncrement:true, 
    primaryKey: true,  
  }, 
   unknown_contact_number: {
    type: DataTypes.STRING, 
    allowNull: false , 
   }, 
    message_content: { 
      type: DataTypes.STRING, 
      allowNull: true                      
    }, 
     
}, { 
    timestamps: true 
})
module.exports = UnknownNumber;