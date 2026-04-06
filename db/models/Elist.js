const {DataTypes} = require('sequelize');
const sequelize = require('../connection');


const ELists = sequelize.define('elist', {
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
    }, 
    data: {
        type: DataTypes.INTEGER, 
        allowNull: true, 
        defaultValue: 0 , 
    }
}, {});
module.exports = ELists

