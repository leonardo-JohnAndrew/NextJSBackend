const { DataTypes } = require("sequelize");
const sequelize = require("../connection");  


const Extracted = sequelize.define('extracted', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
     },  
    columnA:{
        type: DataTypes.INTEGER,  
        allowNull: false,
     }, 
    columnB:{
        type: DataTypes.INTEGER,
        allowNull: false,
      }, 
    columnC:{
        type: DataTypes.INTEGER,
        allowNull: false,   
      },
    columnD:{
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
module.exports = Extracted; 