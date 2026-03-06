const { DataTypes } = require("sequelize");
const sequelize = require("../connection");
const { time } = require("node:console");

const Comport = sequelize.define('comport', {
 
    port_number: {
        type: DataTypes.STRING,
        primaryKey: true,
        autoIncrement: false,
        allowNull: false,
    }, 
    contact_number: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
    
},{}); module.exports = Comport; 