const {DataTypes} = require("sequelize"); 
const sequelize = require("../connection"); 

const CombinationPattern =sequelize.define('pattern',{ 
  id:{ 
    type : DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true, 
  }, 
   columnA: { 
    type: DataTypes.STRING,   
   },  
   columnE:{ 
    type: DataTypes.STRING
   }
}, {}); 
module.exports = CombinationPattern; 

/* 

*/
