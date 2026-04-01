const {DataTypes} = require('sequelize');
const sequelize = require('../connection');
const { time } = require('node:console');

const ALists = sequelize.define('alist', {
    id: {
        type: DataTypes.INTEGER,    
        autoIncrement: true,
        primaryKey: true,
    },
    // port 
    digit1: { 
          type: DataTypes.INTEGER , 
          allowNull: true,
    },
    digit2: { 
          type: DataTypes.INTEGER , 
          allowNull: true,
    },
    digit3: { 
          type: DataTypes.INTEGER , 
          allowNull: true,
    }

}, {});

module.exports = ALists

