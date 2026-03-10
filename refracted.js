import { Comport, Extracted  ,Extract ,SMS ,RegisteredSim, Group, UnknownNumber} from "./db/models/index.js";
import sequelize from "./db/connection.js";
import e from "express";
import { register } from "module";
import { read } from "fs";
sequelize.sync({ alter: true }).then(() => console.log('Database synced')); 



 export async function extractNumberedMessages(message ,groupNumber) {
 message = message.trim() ; 
 let isInserted = false; 
 let response = ""; 
 const regex = /^\d+-\d+-\d+-\d+-\d+$/;  
 if (!regex.test(message)) {
   response = "Invalid Format - Message should not be in the format of 5 numbers separated by dashes example\n 35-3-3-5-17";    
   isInserted = false; 
   return { 
      isInserted , 
      response 
   } 
}
 const columnList = ["columnA", "columnB", "columnC", "columnD"]; 
 const parts = message.split('-'); 
 const data = {};

 if(parts.slice(1,4).some(part => isNaN(part) || part < 0 || part > 9)){ 
   const invalidColumns = [] 
     if(isNaN(parts[1]) || parts[1] < 0 || parts[1] > 9) invalidColumns.push(`Invalid Number - Column B : ${parts[1]} should be a between 0-9`);
     if(isNaN(parts[2]) || parts[2] < 0 || parts[2] > 9) invalidColumns.push(`Invalid Number - Column C : ${parts[2]} should be a between 0-9`);
     if(isNaN(parts[3]) || parts[3] < 0 || parts[3] > 9) invalidColumns.push(`Invalid Number - Column D : ${parts[3]} should be a between 0-9`);
     response = invalidColumns.join('\n');
     isInserted = false ; 
     return { 
        isInserted , 
        response 
     }
 }
    columnList.forEach((column, index) => {
        data[column] = parseInt(parts[index], 10);
    });
 try {
     await Extracted.create(data); 
    response = `DateTime Recieved: ${new Date().toLocaleString()} \nMessage: ${message}`;
    isInserted = true; 
   return { 
      isInserted , 
      response  
   }
     
} catch (error) {
    console.error("Error creating record:", error);
    return "An error occurred while creating the record.";
 }

}
 export async  function calculateTotalCol(){ 
       //declare variables 
      let columnA = 0 ; 
      let columnE = 0; 
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
export async function RegisterNumber(modemNumber, contactNum){ 
 try { 
     const existing = await Comport.findByPk(modemNumber, { 
      attributes: ['contact_number'] 
     }); 
      if(existing) {
       // update existing record if contact number is different 
         if(existing.contact_number !== contactNum) {
            await existing.update({ contact_number: contactNum }); 
            console.log(`Updated modem ${modemNumber} with new contact number ${contactNum}`);   
         }
      } else{ 
         const registered = await Comport.create({ 
             port: modemNumber,
               contact_number: contactNum
            });
          console.log('Registered: ', registered);
         }
  } catch (error) {
       console.error("Error registering modem number: ", error);
  }
} 
export async function ParseSender(header){ 
    const match = header.match(/\+CMGL:\s*(\d+),"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/) ||
    header.match(/\+CMGR:\s*"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/)
    ||header.match(/\+CMGL:\s*(\d+),"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/)
    ||header.match(/\+CMT:\s*"([^"]*)",,"([^"]*)"/);
   
    console.log("Match: ", match);
    if(!match){
      return null;
    } ;
     
    const [, sender ,dateTime] = match;
    return {sender}
}
export async function InsertSMS(sender , content , comportNumber){ 
   try{ 
       await SMS.create({ 
         sender : sender, 
         content_message: content , 
         read: true , 
         port_number: comportNumber , 
         datetime_received: new Date()  
       })     
   }catch(error){ 
         console.error("Error inserting SMS: ", error);
   } 
}
async function GroupNumbers(){ 
  
   let grouped = await Group.findAll({
      group:['group_no'] ,
      where:{group_no: number}, 

      include:[{
          model:Extract
      }]
   })
}

//create function that sender find number in contact list and get his group number   
export async function FindGroupNumber(sender){ 
   let group_no = 0; 
   try{ 
      const GroupNumber = await RegisteredSim.findOne({
         where: { contact_number: sender }, 
         attributes: ['contact_number','group_no']
      });
     return group_no = GroupNumber ? GroupNumber.group_no : 0; 
   }catch(error){ 
      console.log("message_error: ", error);
      return group_no;  
   }

}
//insert function for unknown number 
export  async function InsertUnknownNumber(sender, message){ 
    try{ 
          const Unknown =  await UnknownNumber.create({
            unknown_contact_number: sender, 
            message_content: message
          }) 
           console.log(Unknown); 
           return  
    }catch(error){ 
          console.error("Error inserting unknown number: ", error);
          return; 
    }
 }
 console.log("Group No: ", await FindGroupNumber("+639579787978"));

 