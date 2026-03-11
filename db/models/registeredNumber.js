const {DataTypes} = require("sequelize");
const sequelize = require("../connection");

const RegisteredSim =sequelize.define('registered_sim', { 
    sim_id: { 
        type : DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true, 
    }, 
    contact_number: { 
        type: DataTypes.STRING , 
        allowNull: false,
    }, 
    isLeader:{
        type: DataTypes.BOOLEAN,
        allowNull: false, 
        defaultValue: false,
    }
    
}, { 
      timestamps:true 
})
module.exports = RegisteredSim; 