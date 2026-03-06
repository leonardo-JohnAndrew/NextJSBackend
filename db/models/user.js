
const { DataTypes } = require("sequelize");
const sequelize = require("../connection");


const User = sequelize.define('users' , {
  id: {
    type: DataTypes.INTEGER, 
    autoIncrement: true , 
    primaryKey: true,
   } , 
  usernames : {
     type: DataTypes.STRING, 
     allowNull:false , 
  }
}, {}); 

module.exports = User;