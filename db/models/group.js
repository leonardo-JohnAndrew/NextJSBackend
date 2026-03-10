const {DataTypes} = require('sequelize'); 
const sequelize = require('../connection'); 

const Group = sequelize.define('group_list', {
    group_no: {
        type: DataTypes.INTEGER, 
        autoIncrement: true,
        primaryKey: true,
        },
    }, { 
        timestamp: true
    })
module.exports = Group;