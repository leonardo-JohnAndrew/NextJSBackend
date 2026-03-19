import { Comport, Extracted  ,Extract ,SMS ,RegisteredSim, Group, UnknownNumber} from "./db/models/index.js";
import sequelize from "./db/connection.js";
import {Op} from 'sequelize'
import e from "express";
import { register } from "module";
import { read } from "fs";
//sequelize.sync({ alter: true }).then(() => console.log('Database synced')); 



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
async function calculateTotalCol(number, objects={}){ 
       //declare variables 
      let columnA = 0 ; 
      let columnE= 0; 
      let total = 0 
      let message = " " 
      let arrayValue = {};  
      //find own summary 
      if(!number){ 
        console.log("Calculating by bcd");
          arrayValue = objects;  
          //console.log("Assembled Numbers: ", arrayValue);    
      }else{ 
          console.log(`Calculating summary for group number ${number}...`);
          arrayValue = await Grouping(number); 
      } 
      console.log("Array Value: ", arrayValue); 
      let ListColumnA = arrayValue.ListColumnAval;
      let ListColumnE= arrayValue.ListColumnEval;

   //   console.log(`ListColumnA: ${JSON.stringify(ListColumnA[0])} \n ListColumnE: ${JSON.stringify(ListColumnE[0])}`);
     //  return 
      try {        
            columnA = ListColumnA.reduce((acc, val) => acc + val, 0); 
            columnE = ListColumnE.reduce((acc, val) => acc + val, 0);
            total =  columnA + columnE  ; 
            
            message = `Today Summary \nTotals in Column A : ${ListColumnA.map((v, i) => `${v}`).join(' + ')} =  ${columnA} \nTotal in Column E : ${ListColumnE.map((v, i) => `${v}`).join(' + ')} =  ${columnE} \nTotal of Column A and E : ${columnA} + ${columnE} = ${total} `;  
           
      } catch (error) {
         console.log('Error fetching from database');  
      }  
      return {
        message, 
        columnA,
        columnE
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
      where: { group_no: 2 },
      include:[{
          model:Extract, 
      }]
   })
   let array = grouped[0].extracts;
   const ListColumnAval = []
   const ListColumnEval = []

   array.forEach((item, index) => {
      console.log("Group Number: ", item.group_no);
      console.log("Column A: ", item.columnA);
      console.log("Column B: ", item.columnB);
      console.log("Column C: ", item.columnC);
      console.log("Column D: ", item.columnD);
      ListColumnAval.push(item.columnA);
      ListColumnEval.push(item.columnE); 
   }) 

    //add all ColumnA values inside Array 
    let totalA = ListColumnAval.reduce((acc, val) => acc + val, 0); 
    let totalE = ListColumnEval.reduce((acc, val) => acc + val, 0); 
    console.log("Total Column A: ", totalA);
    console.log("Total Column E: ", totalE);

   return { 
      ListColumnAval, ListColumnEval
   };

   console.log("List Column A: ", ListColumnAval.join(' + '));
   console.log("List Column E: ", ListColumnEval.join(' + '));

}

//create function that sender find number in contact list and get his group number   
async function FindGroupNumber(sender){
    let isLeader = false; 
    let group_no = 0; 
    try{ 
         const GroupNumber = await RegisteredSim.findAll({
            where: { contact_number: sender },
            include:[{ 
                model: Group , attributes: ['group_no']
            }]
        });
        //console.log(JSON.stringify(GroupNumber, null, 2));
   //     return
        return {
             group_no :  GroupNumber[0]?.group_list?.group_no || 0, 
             isLeader:  GroupNumber[0]?.group_list?  true : isLeader
        } 
    }catch(error){ 
        console.log("message_error: ", error); 
        return { group_no, isLeader }; 
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

 //for leaders 
 async function Summary(sender){ 
    const findGroup = await FindGroupNumber(sender);
    if(findGroup.isLeader === false) return;

    try{ 
        const groups = await Group.findAll({
            where: { group_no: 1, 
            
             },
            include: [{
                model: RegisteredSim, 
                include:[{
                    model: Extract, where: {createdAt:{
                  [Op.between]: [dateTodayRange().start, dateTodayRange().end]
               }
            }
                }]
            }]
        });

        let result = []
       
     //  console.log("Groups: ", groups[0].registered_sims[0].extracts);
     //    return 

        groups.forEach(group => {
            group.registered_sims.forEach(sim => {
                let total1 = 0;
                let total2 = 0;
                sim.extracts.forEach(ex => {
                    total1 += ex.columnA || 0;
                    total2 += ex.columnE || 0;
                });  
                result.push({
                    sim_number : sim.contact_number,
                    total: total1 + total2
                });
            });
        });

      return { 
         message : `Today Summary for Group ${findGroup.group_no} \n${result.map(r => `SIM: ${r.sim_number} - Total: ${r.total}`).join('\n')}`,
      }

    }catch(error){
       console.log('Error fetching from database', error);
    }
}
 //own summary function 
 export async function  FindOwnSummary(sender) {
     const dateRange = dateTodayRange(); 
    try{
        const summary = await RegisteredSim.findAll({
          where: { 'contact_number': sender , 
          },
          include: [{
            model: Extract, where: {
               createdAt: {
              [Op.between]: [dateRange.start, dateRange.end]
           }
            }, 
            attributes: ['columnA', 'columnE']
          }]
        })
   
        let extracts = summary[0]?.extracts || [];
        let ListColumnA = [];
        let ListColumnE = [];
         extracts.forEach((item) => {
            ListColumnA.push(item.columnA);
            ListColumnE.push(item.columnE);
         }) ;
         console.log("List Column A: ", ListColumnA.join(' + '));
         console.log("List Column E: ", ListColumnE.join(' + '));
         return { 
            ListColumnA,
            ListColumnE
         }
    }catch(error){
       console.log("Error fetching own summary: ", error);
    }
 }
 function dateTodayRange(){ 
   const start = new Date();
   start.setHours(0, 0, 0, 0);

   const end = new Date(); 
   end.setHours(23, 59, 59, 999);
   return {
      start, 
      end
   }

 }
 //const summary = await FindGroupNumber("+639053168644"); 
 //console.log("Group Number: ", summary.group_no);
 //console.log("Is Leader: ", summary.isLeader);
//  console.log("Column A:", Own.ListColumnA);
//  console.log("Column E:", Own.ListColumnE);
//must console Jan 4 2024   

export async function assembleNumbers(){  
 // get all numbers a b c 
     const listNumbers = {}; //list of number  { values: [columnB, columnC, columnD]} 
       try{

          const numbers = await Extract.findAll({ 
             attributes: ['ColumnA','ColumnB', 'ColumnC', 'ColumnD','ColumnE'], 
   })
   numbers.forEach((num , index) => {
  //      console.log(`Number ${index}: B=${num.dataValues?.ColumnB}, C=${num.dataValues?.ColumnC}, D=${num.dataValues?.ColumnD}`);
            listNumbers[`Number${index}`] = {
               values: [num.dataValues?.ColumnB, num.dataValues?.ColumnC, num.dataValues?.ColumnD]
            }
         })
         //combine numbers to format B-C-D
         //  console.log(JSON.stringify(combinedNumbers));
         const formatted = {}; 
         numbers.forEach((num , index) => {
            formatted[`Number${index}`] = {
               values: [
                  listNumbers[`Number${index}`].values.join('-'), 
                  num.dataValues?.ColumnA,
                  num.dataValues?.ColumnE
               ]
            }
         })
         const combinedNumbers = Object.entries(formatted).map(([key, obj]) => {
            return {
               [key]: obj.values
            }
         });
         //  console.log("Combined Numbers: ", combinedNumbers); 
         return combinedNumbers;
      }catch(error){
        console.log('Error fetching from database');
        return;
      }
}

export async function addingColumnAccordingPair(){ 
    /* 
    data [30-2-3-1-4]  data[120-1-4-5-4]
    data [20-2-3-1-20] data[400-1-4-5-100]
    group to 2-3-1 
    add first and last 30 + 20 = 50 , 4+20 = 24
    */
      const assemble =  await assembleNumbers();
   //console.log(assemble); 
   //for loops 
    let uniqueNum = []; 
   // console.log(assemble); 
     const missingFields = {};
    assemble.forEach((item, index) => {
    const value = item[`Number${index}`][0];
   //     console.log(item);
      if (!uniqueNum.includes(value)) {
        uniqueNum.push(`${value}`);
       }
     });
   const pairs = {} ;  
  assemble.forEach((item, index) => {
    const value = item[`Number${index}`][0];
    const columnA = item[`Number${index}`][1];
    const columnE = item[`Number${index}`][2];
   
     // if uniqueNum ==== value push columnA and columnE to pairs[value]
     // if double value of uniqueNum === value push columnA and columnE to pairs[value] and add to existing value in pairs[value]
    if (!pairs[value]) {
        pairs[value] = {
            ColumnA: [columnA],
            ColumnE: [columnE]
        }
    }
    else {
    
        pairs[value].ColumnA.push(columnA);
        pairs[value].ColumnE.push(columnE);
    }
    
  });
  
   //sum all columnA and columnE in pairs 
   Object.keys(pairs).forEach(async key => {
       let ListColumnAval = []; 
     let ListColumnEval = []; 
    
    ListColumnAval = pairs[key].ColumnA
    ListColumnEval = pairs[key].ColumnE
    const collectedNumbers = { 
        ListColumnAval,
        ListColumnEval
    }  
     const cal =  await calculateTotalCol(null,collectedNumbers ); 
    console.log(`${key}: ColumnA: ${cal.columnA} \nColumnE: ${cal.columnE}`);
}) 
}
