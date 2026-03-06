const { DataTypes } = require("sequelize");
const sequelize = require("../connection");  


const Extract = sequelize.define('extract', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
     },  
    value_num1:{
        type: DataTypes.INTEGER,  
        allowNull: false,
     }, 
    value_num2:{
        type: DataTypes.INTEGER,
        allowNull: false,
      }, 
    value_num3:{
        type: DataTypes.INTEGER,
        allowNull: false,   
      },
    value_num4:{
        type: DataTypes.INTEGER,
        allowNull: false,
      }, 
    dateTimeReceived: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
     }
},{
    timestamps: false,
});
module.exports = Extract; 