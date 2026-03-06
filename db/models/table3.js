const { DataTypes } = require("sequelize");
const sequelize = require("../connection");


const Table3 =  sequelize.define('content', { 
 id: {
    type: DataTypes.INTEGER, 
    autoIncrement: true , 
    primaryKey : true , 
 }, 
  content : {
     type : DataTypes.STRING ,
     allowNull: true , 
  }, 
  timestamp: {
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, {}); 

module.exports = Table3