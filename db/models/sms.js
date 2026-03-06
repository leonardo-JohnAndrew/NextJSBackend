const {DataTypes} = require('sequelize');
const sequelize = require('../connection');
const { time } = require('node:console');

const SMS = sequelize.define('sms_message', {
    id: {
        type: DataTypes.INTEGER,    
        autoIncrement: true,
        primaryKey: true,
    },
    sender: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content_message:{
        type: DataTypes.TEXT,
        allowNull: false,         
    },
    // port 
    port_number:{
        type :DataTypes.STRING , 
        allowNull: false,
    }, 

     datetime_received: {
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
     }

}, {
    timestamps: false
});

module.exports = SMS;

