import { Extracted } from "./db/models/index.js";
import sequelize from "./db/connection.js";
sequelize.sync({ alter: true }).then(() => console.log('Database synced')); 



 export async function extractNumberedMessages(message) {
 message = message.trim() ; 
 const regex = /^\d+-\d+-\d+-\d+$/;  
 if (!regex.test(message)) {
    return "Invalid Format - Message should not be in the format of 4 numbers separated by dashes example\n 123-456-789-012";    
 }
 const columnList = ["columnA", "columnB", "columnC", "columnD"]; 
 const parts = message.split('-'); 
 const data = {};
    columnList.forEach((column, index) => {
        data[column] = parseInt(parts[index], 10);
    });
 try {
    const record = await Extracted.create(data); 
   return "Record created successfully with values: " + JSON.stringify(record.toJSON());
 } catch (error) {
    console.error("Error creating record:", error);
    return "An error occurred while creating the record.";
 }

}
 export async  function calculateTotalCol(){ 
       //declare variables 
      let columnA = 0 ; 
      let columnD = 0; 
      let total = 0 
      let message = " "   
      let ListColumnA = []
      let ListColumnD = []
       //get the total from database 

      try { 
           const ListColumnAval = await Extracted.findAll({
            attributes: ['columnA']
           });
           const ListColumnDval = await Extracted.findAll({
            attributes: ['columnD']
           }); 
            // list all in ListColumnA and ListColumnD 
              ListColumnAval.forEach((item, index) => {
                ListColumnA.push(item.columnA); 
                });
                ListColumnDval.forEach((item, index) => {
                    ListColumnD.push(item.columnD);
                });
           columnA = await Extracted.sum("columnA"); 
           columnD = await Extracted.sum("columnD"); 
           total =  columnA + columnD  ; 
            
          message = `Today Summary \nTotals in Column A : ${ListColumnA.map((v, i) => `${v}`).join(' + ')} =  ${columnA} \nTotal in Column D : ${ListColumnD.map((v, i) => `${v}`).join(' + ')} =  ${columnD} \nTotal of Column A and D : ${columnA} + ${columnD} = ${total} `;  
           
        //    console.log(`column A:  ${columnA} , column D: ${columnD} , Total: ${total}` ); 
      } catch (error) {
         console.log('Error fetching from database'); 
      } 
      return {
        columnA, 
        columnD, 
        total, 
        ListColumnA, 
        ListColumnD,
        message
      }; 
} 

