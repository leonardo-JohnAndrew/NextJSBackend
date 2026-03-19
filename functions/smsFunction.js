import {Extract} from '../db/models/index.js';
import sequelize from '../db/connection.js';

 export async function GroupNumbers(){ 
let grouped = await Extract.findAll({ 
    attributes: ['group_no'], 
    group: ['group_no'] 
}); 
console.log(grouped); 
}
