
const express = require('express');
const http = require('http');
const { SerialPort } = require('serialport');
const { Server } = require('socket.io');
const { ReadlineParser } = require('@serialport/parser-readline');
const   SMS  = require('./db/models/sms');
const Comport = require('./db/models/comport');
const RegisteredSim = require('./db/models/registeredNumber')
const UnknownNumber = require('./db/models/unknownNumber');
const Group = require('./db/models/group'); 
const  sequelize = require('./db/connection');
const { Extract } = require('./db/models');
const { Op } = require('sequelize');
const { json } = require('sequelize');
const { arrayBuffer } = require('stream/consumers');
const e = require('express');

// list of comports to check for GSM modem, with their corresponding PINs 
const modems = [ 
    // {port: 'COM3', pin: ""},
    // {port: 'COM4', pin: ""},
    // {port: 'COM5', pin: ""},
    // {port: 'COM6', pin: ""},
    // {port: 'COM7', pin: ""},
    // {port: 'COM8', pin: ""},
    // {port: 'COM9', pin: ""},
    // {port: 'COM10', pin: ""},
    // {port: 'COM11', pin: ""},
    {port: 'COM12', pin: ""},
    // {port: 'COM13', pin: ""},
    // {port: 'COM14', pin: ""},
    // {port: 'COM16', pin: ""},
  //  {port: 'COM17', pin: ""},
    // {port: 'COM18', pin: ""}, 
]  // comport list & pin 

// db config 
//sequelize.sync({ alter: true }).then(() => console.log('Database synced successfully!'))
// websockeet server for real-time updates to frontend 
const app  = express(); 
const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: '*', // allow all origins for testing, restrict in production
    }
});

 server.listen(3001, () => { 
    console.log('Websocket server listening on port 3001');
}); 

async function startModem(config) {
    const {port: comport ,  pin} = config;
    let group; 
    let isLeader = false; 
    let parsed = {}; 
   // const contact  = await findSimNum(80); 
   // console.log(JSON.stringify(contact))  

    const port = new SerialPort({
        path: comport, 
        baudRate: 115200, 
        incomingSMSIndication: true 
    });
 
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    let waitingformessage = false; 
    let isReply = false ; 
   
    // open 
    port.on('open', () => {
        console.log(`Serial port ${comport} opened.`);
        console.log(`listening to ${comport} for incoming messages...`);
setTimeout(() => port.write('ATE0\r'), 200);
setTimeout(() => port.write('AT+CPIN?\r'), 500);
setTimeout(() => port.write('AT+CMGF=1\r'), 1000);
setTimeout(() => port.write('AT+CNUM\r'), 1500);
setTimeout(() => port.write('AT+CSCS="GSM"\r'), 1500);
setTimeout(() => port.write('AT+CPMS="ME","ME","ME"\r'), 2000); // set message format and validity period
setTimeout(() => port.write('AT+CNMI=2,2,0,0,0\r'), 2500)
//setTimeout(() => port.write('AT+CMGL="ALL"\r'), 3000); // read all REC UNREAD 
    });  

// data received 
parser.on('data', async (data) => {
    // check lng for raw data 
    console.log(`Received data o[${comport}] raw: ${data}`);
    //check for lock status 
    if(data.includes('+CPIN:')) { 
        //console.log(`this [${comport}] is OKAY ` )
        if(data.includes('SIM PIN') && pin) {
            console.log(`SIM on ${comport} is locked, entering PIN..`);
            port.write(`AT+CPIN=${pin}\r`); // enter PIN if needed 
            return ;
        } 
         // console.log(number);         
    } 
   if (data.includes('+CNUM')) {
       const match = data.match(/\+CNUM:\s*"[^"]*","([^"]*)"/);
       if (match) {
        const number = match[1]; // captured phone number
        RegisterModemNumbers(comport, number);
        }
        return;
    }
      // test insert plang toh kahit di bago ung message ma insert sa db   
        //  waitingformessage = true;  
      console.log("WAITING FOR MESSAGE......... "); 
   if (data.startsWith('+CMTI:')|| data.startsWith('+CMT:')) {
       waitingformessage = true; // wait for new message 
       const result = CMGRParser(data);
       //console.log("Parsed result from header: ", result);
       if(result) {
           if(!result.sender || !result.sender.startsWith('+63')) {
               // check if number starts with +63
               waitingformessage = false;
               return; // ignore message
            };
            parsed = result;
            //store parsed sender and datetime for use when message content arrives
            return; 
        }    
    }else if(waitingformessage){
        const GroupNumber = await FindGroupNumber(parsed.sender);
        group = await GroupNumber; 
        isLeader =  group.isLeader;

        const message = data.trim();
        //if message = summary perform calculation 
        
        if (!message || message.toUpperCase() === 'OK') return;
        
        //    await insertSMS(parsed.sender, message, parsed.datetime_received, comport);
        waitingformessage = false;
        isReply = false; 
        console.log(`Parsed sender: ${parsed.sender} is a Leade: ${isLeader}`);
              if(message.toLowerCase() === "summary") {    
                // check if sender is leader of the group 
                 //if leader perform summary calculation and send reply  
                 //if not leader basic calculation and send reply
                 if(isLeader === true){
                    const leadSummary = await LeaderSummary(parsed.sender); 
                    port.write(`AT+CMGS="${parsed.sender}"\r`);  // number
                    // wait for > prompt
                    port.write( `${leadSummary.message}` + String.fromCharCode(26));
                    isReply = true;
                    return;

                 }else {
                     const total  = await calculateTotalCol(parsed.sender);  // inserted, can be enhanced to check actual db insert result   
                     port.write(`AT+CMGS="${parsed.sender}"\r`);  // number  
                     // // wait for > prompt
                     port.write( `${total.message}` + String.fromCharCode(26));
                     // CTRL+Z
                     isReply = true 
                     return; 
                    }
            }else if (parsed?.sender && parsed?.datetime_received )  {
                //add  logic check limit before insert if message contain data: 

                  const isExtracted = await extractMessageWithDash(parsed.sender, message) // 
                  if(isExtracted.isReply === false){ 
                    return ; 
                  }
                  port.write(`AT+CMGS="${parsed.sender}"\r`);  // number  
                   // // wait for > prompt
                  port.write( `${isExtracted.response}` + String.fromCharCode(26));
                 // CTRL+Z
                  return;       
                                   
            } 
            console.log(`New message from ${parsed.sender}: ${message}`); 
           
} 
}); 


// reconnect 
port.on('error', () => {
    console.log(`Error on ${comport}, attempting to reconnect in 5 seconds...`); 
    setTimeout(() => startModem(config), 5000);
})
}
async function LeaderSummary(sender) { 
    // perform leader summary calculation and return message
    const findGroup = await FindGroupNumber(sender); 
      const dateNow = new Date();
      const formattedDate = dateNow.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }); 
    if(findGroup.isLeader === false) return; 
    try{ 
        const groups = await Group.findAll({ 
            where: { group_no: findGroup.group_no,}, 
            include: [{ 
                model: RegisteredSim, 
                // where: { 
                //     contact_number: {
                //         [Op.ne]: sender
                //     }
                // },  use if you want to exclude leader from summary 
                where:{group_no: findGroup.group_no},
                separate: true, 
                order: [
                    [sequelize.literal(`contact_number = '${sender}'`), 'DESC']
                ], 
                include: [{ 
                      model: Extract ,
                      required: false,
                      where: {
                        dateTimeReceived:{
                            [Op.between]: [dateTodayRange().start, dateTodayRange().end]
                        }
                    }
                }],
                
            }]
        });

      //  console.log(JSON.stringify(groups, null, 2));
        let result = [] 

        groups.forEach(group => { 
            group.registered_sims.forEach(sim => { //sim {[],[]}
                let totalA = 0 ;  
                let totalE = 0; 
                
                sim.extracts.forEach(ex => { 
                   totalA += ex.columnA || 0 ; 
                   totalE += ex.columnE || 0 ; 
                }); 

                result.push({
                    contact_number: sim.contact_number, 
                    totalA, 
                    totalE, 
                    total: totalA + totalE
                })
            });
        });
      
        if(result.length === 0) {
            return { 
                message: `Today Summary ${formattedDate} for Group ${findGroup.group_no} \nNo entries found for today.`
            }
        }
        return { 
            message: `Today Summary ${formattedDate} for Group ${findGroup.group_no} \n${result.map(r=> `No: ${r.contact_number}\n${r.total === 0 ?`Total: ${r.total}`:`Total: A ${r.totalA} + E ${r.totalE} = ${r.total}`} `).join('\n')}`
        }
    }catch(error){ 
        console.log('Error fetching from database leader summary' , error );
    }
}
    //date range for today 
function dateTodayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
}
//find sender group functions 
async function FindGroupNumber(sender){
    let isLeader = false; 
    let group_no = 0; 
    try{ 
         const GroupNumber = await RegisteredSim.findAll({
            where: { contact_number: sender },
            include:[{ 
                model: Group 
                , attributes: ['group_no']
            }]
        });

        return {
             group_list : GroupNumber[0]?.group_no? GroupNumber[0].group_no : 0 ,  
             isLeader:  GroupNumber[0]?.group_list?  true : isLeader , 
             group_no : GroupNumber[0]?.group_list?.group_no || 0 ,
             sim_id : GroupNumber[0]?.sim_id || 0
        } ; 
    }catch(error){ 
        console.log("message_error: ", error); 
        return { group_no, isLeader }; 
    }
}
//insert function for unknow number 
async function  InsertUnknownNumber(sender , message){ 
 try{
       const Unknown = await UnknownNumber.create({
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
// function that perform breakdonw
function CMGRParser(header) { 
    const match = header.match(/\+CMGL:\s*(\d+),"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/) ||
    header.match(/\+CMGR:\s*"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/)
    ||header.match(/\+CMGL:\s*(\d+),"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/)
    ||header.match(/\+CMT:\s*"([^"]*)",,"([^"]*)"/);
    if (!match) {
            console.error('Failed to parse sender from header:', header);
            return null;
        }  
        // destructure 
        const [,sender,datatimeRaw] = match; 
        const [date, time] = datatimeRaw.split(" "); 
        const [yy , mm , dd] = date.split("/").map(Number); 
        const [hh, min, ss] =  time.slice(0,8).split(":").map(Number); 
        
        
        const datetime_received = new Date(yy, mm - 1, dd, hh, min, ss); 
       //  console.log(`Parsed message from ${sender} received at ${datetime_received.toISOString()}`);
        return {
            datetime_received,
            sender
        };
}
 //GROUP QUERY 
 async function FindOwnSummary(sender) {
    const dateRange  = dateTodayRange(); 
    try{ 
        const summary = await RegisteredSim.findAll({ 
            where: { contact_number: sender}, 
            include: [{
                model: Extract, where: {
                    dateTimeReceived: {
                    [Op.between]: [dateRange.start, dateRange.end]
                }
                },
                attributes: ['columnA', 'columnE']
            }]
        }) 
         let extracts = summary[0]?.extracts || [];
         let ListColumnA = []; 
         let ListColumnE = []; 

         if(extracts.length === 0) return { ListColumnA: [0], ListColumnE: [0] };
          extracts.forEach((count , index )=> { 
             ListColumnA.push(count.columnA);
             ListColumnE.push(count.columnE);
          }) 
         console.log("List Column A: ", ListColumnA.join(' + '));
         console.log("List Column E: ", ListColumnE.join(' + '));
          return{
            ListColumnA, 
            ListColumnE
          }
    }catch(error){
        console.log('Error fetching from database own summary' , error );  
    }
 }
    // calculate function
      //extracts table contain value_num1, value_num2, value_num3, value_num4 for the 4 parts of the message
    //calculateTotalCol can also use from the refrated.js it use the table extracteds with columnA, columnB, columnC, columnD
async function calculateTotalCol(sender , objects ={}){ 
       //declare variables 
      const dateNow = new Date();
      const formattedDate = dateNow.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }); 
      let columnA = 0 ; 
      let columnE= 0; 
      let total = 0 
      let message = " "   
      let arrayValue = {}; 
      //find own summary 
      if(!sender){
        arrayValue = objects;
      }else{ 
          arrayValue  = await FindOwnSummary(sender);
      }
    //    console.log("Array Value: ", arrayValue);
    //   return 
      let ListColumnA = arrayValue.ListColumnA;
      let ListColumnE= arrayValue.ListColumnE;
      try {        
            columnA = ListColumnA.reduce((acc, val) => acc + val, 0); 
            columnE = ListColumnE.reduce((acc, val) => acc + val, 0);
            total =  columnA + columnE  ; 
            
            if(total === 0) {
                message = `Today Summary: ${formattedDate} \nNo entries found for today. \nPlease submit your data in the format: \nData:0-0-0-0-0\ndata:0-0-0-0-0\nDATA:0-0-0-0-0`;
            }else { 
                message = `Today Summary: ${formattedDate} \nTotals in Column A : ${ListColumnA.map((v, i) => `${v}`).join(' + ')} =  ${columnA} \nTotal in Column E : ${ListColumnE.map((v, i) => `${v}`).join(' + ')} =  ${columnE} \nTotal of Column A and E : ${columnA} + ${columnE} = ${total} `;  
            }
           
      } catch (error) {
         console.log('Error fetching from database');  
      }  
      return {
        message, 
        columnA,
        columnE
      }; 
} 
    //extract message 
    //extracts table contain value_num1, value_num2, value_num3, value_num4 for the 4 parts of the message
    //extractNumberedMessages can also use from the refrated.js it use the table extracteds with columnA, columnB, columnC, columnD
async function extractMessageWithDash( sender,  message) { 
    const  isReply = false; 
    const groupNumber = await FindGroupNumber(sender);
    //sim id 
    if(groupNumber.sim_id === null || groupNumber.sim_id === 0) { 
           // console.log("This number is Unknown"); 
            await InsertUnknownNumber(sender ,message.trim()); 
            waitingformessage = false;
            return { 
                isReply 
            }; 
        }
     let response = "";  
     const [prefix , number ] = message.split(":");
      if(prefix.toLowerCase() !== "data"){
          response = `Text must start in Data: , \nexample: \nData:0-0-0-0-0\ndata:0-0-0-0-0\nDATA:0-0-0-0-0` 
          return { 
         isInserted: false,
         response
          }  
      }
     const regex = /^\d+-\d+-\d+-\d+-\d+$/; // expects exactly 5 parts separated by dashes, all numeric sample: 12-23-34-45-56
     const isValidFormat = regex.test(number);
     if (!isValidFormat) {
        //response validation message must be\n Data:0-0-0-0-0
        response = `Invalid text format must be Data:0-0-0-0-0 ,example:\nData:1-2-3-4-5\ndata:1-2-3-4-5\nDATA:1-2-3-4-5`;
      return {
         isInserted: false,
         response
      };  
     }
     const columnList = ["columnA", "columnB", "columnC", "columnD", "columnE"]; 
     const parts = number.split('-'); 
     
     // validation number column B = part[1] to D = part[3] must value of 0 -9 
     if (parts.slice(1, 4).some(part => isNaN(part) || part < 0 || part > 9)) {
         // response sample : Invalid Number : specific number should be between 0-9 for example if part[1] is invalid response should be Invalid Number - Column B should be between 0-9
         const invalidColumns = [];
         if (isNaN(parts[1]) || parts[1] < 0 || parts[1] > 9) invalidColumns.push(`Invalid Number - Column B : ${parts[1]} should be between 0-9`);
         if (isNaN(parts[2]) || parts[2] < 0 || parts[2] > 9) invalidColumns.push(`Invalid Number - Column C : ${parts[2]} should be between 0-9`);
         if (isNaN(parts[3]) || parts[3] < 0 || parts[3] > 9) invalidColumns.push(`Invalid Number - Column D : ${parts[3]} should be between 0-9`);
         response = `${invalidColumns.join('\n')}`;
         
         return {
             isInserted: false,
             response
            }; 
        } 
        // check user inputs
        const valB_To_valD = [parts[1],parts[2], parts[3]];  
        const joinedNumbers = valB_To_valD.join('-'); 
        const checkTotal = await addingColumnAccordingPair(parts[0], joinedNumbers,parts[4]);    
        // if no return console.log (able )
       
        console.log("Check Total: ", checkTotal);
        if(checkTotal.response.some(m => m !== undefined)){
            response = `For ${joinedNumbers}:\n${checkTotal.response.join('\n')}` 
            return { 
                isInserted: false,
                response
            }
        }
        // if(checkTotal.isLimit === true){ 
        //     //return 
        //     response =`For ${joinedNumbers}\n${checkTotal.response.join('\n')}`
        //    return { 
        //       isInserted : false, 
        //       response
        //    }
        // }         
       const data = {}; 
       columnList.forEach((column, index) => {
        data[column] = parseInt(parts[index]);
     });
    //  data['group_no'] = groupNumber.group_list;
     data['sim_id'] = groupNumber.sim_id;
    try {
      await Extract.create(data);
      response = `DateTime Recieved: ${new Date().toLocaleString()} \nMessage: ${parts.join('-')} `;
      return {
         isInserted: true,
        response
      }; 
    } catch (error) {
    console.error("Error creating record:", error);
    return {
         isReply
    }
  }
}

    //test database 
    let lastid = 0; 
    // update db to read  
 async function  setRead(id) {   
        try {
            await SMS.update({
                read: true 
            }, {
                where :{
                    id : id 
                }
            })
            console.log(`id ${id} is already read`)
            return true;  
        } catch (error) {
            return false 
        }
}
    //insert function get sms read from modem and insert to db 
    
async function insertSMS(sender, content, datetime_received , comportNumber) { // sender number and message content 
        try {
            const newSMS = await SMS.create({
                sender: sender,
                content_message: content,
                read: false, 
                sim_number: "unknown", // can be enhanced to get actual SIM number from modem
                port_number: comportNumber, // can be enhanced to get actual port from modem
                datetime_received : datetime_received, 
                
            });
           //  console.log('New SMS inserted:', newSMS);
        } catch (error) {
            console.error('Error inserting SMS:', error);
        }
}
    //initialize modems register comport number and contact number in db for reference
async function RegisterModemNumbers(modemNumbers, contactNumbers) {
        try{ 
            // find pk  
            const existing = await Comport.findByPk(modemNumbers, {
                     attributes: ['contact_number']
                });
                //  return existing ? console.log(`Modem ${modemNumbers} already registered with contact number ${existing.contact_number}`) : null;
                if(existing) {
                     // update if not match to current number 
                    if(existing.contact_number !== contactNumbers) {
                        await existing.update({contact_number: contactNumbers});
                        console.log(`Updated modem ${modemNumbers} with new contact number ${contactNumbers}`);
                    }
                  
                }  else {
                    // create new record if not exist
                    const regsistereMode = await Comport.create({
                        port_number: modemNumbers,
                        contact_number: contactNumbers 
                    });  
                    console.log('Registered modem number:', regsistereMode);
                }
         }catch(error){
             console.error('Error registering modem numbers:', error);
         }
}  
    //find contact number 
async function findSimNum(idmsg) {
         
        try {
            const contactCnum =  await SMS.findByPk(idmsg, {
               attributes:['sender'], 
              include: [
                 { 
                    model:Comport, 
                    attributes : ['contact_number']
                 }
              ]
           }); 
            return contactCnum ? contactCnum :{ "null" : "null"}
           
        } catch (error) {
           console.log ("error message: ", error ) 
        }
}

async function getDb() {
  //     console.log(`latesid is ${lastid}`); 
    try {
        console.log('Checking database for new messages...');
        const latest = await SMS.findAll({
            where: {read:false}, 
            order: [['id', 'ASC']],
        }
        );

        if (!latest.length) return;
     
        latest.forEach(msg => {
             // 8 
             console.log(msg.id); 
            if(  msg.id <= lastid){
                console.log('New message in database:', msg);    
                io.emit('new_sms', {
                    sender: msg.sender,
                    message: msg.content,
                });
                setRead(msg.id); 
            }
        });      
        lastid = Math.max(lastid, ...latest.map(m => m.id));  
        return latest ; 
    } catch (error) {
        console.error('Error fetching latest message from database:', error);
    }
} 
async function  getnumbertextedToSpecificPort(comportNum) {
    const contactNumbers = await Comport.findAll({
         where: { port_number: comportNum },
               attributes: ['contact_number'],
                include: [
                           {
                           model: SMS,
                           attributes: ['sender'],
               }
               ],
                group: [
                      'comport.port_number',
                      'sms_messages.sender'
                ]
               });
     return  contactNumbers? contactNumbers: {"null" : "null"}
}
// start modem for each config  
io.on('connection', (socket) => {
    console.log('New client connected to websocket', socket.id);
});   
// setInterval(() => {
// }, 7000); // new messages
modems.forEach(config => startModem(config)); 
 
async function assembleNumbers(){  
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
           //console.log("Combined Numbers: ", combinedNumbers); 
            return combinedNumbers;
        }catch(error){
            console.log('Error fetching from database', error);  
            return; 
        }
}
async function addingColumnAccordingPair(valueA ,valueB_D , valueE){ 
    /* 
    data [30-2-3-1-4]  data[120-1-4-5-4]
    data [20-2-3-1-20] data[400-1-4-5-100]
    group to 2-3-1 
    add first and last 30 + 20 = 50 , 4+20 = 24
    */
    let islimit = false;
      const assemble =  await assembleNumbers();
      //for loops 
      let uniqueNum = []; 
      // console.log(assemble); 
      assemble.forEach((item, index) => {
          const value = item[`Number${index}`][0];
          //     console.log(item);
          if (!uniqueNum.includes(value)) {
              uniqueNum.push(`${value}`);
            }
        });
      // console.log(JSON.stringify(uniqueNum));
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

 //console.log(JSON.stringify(pairs));      

   //sum all columnA and columnE in pairs 
    if(!pairs[valueB_D]){ 
        pairs[valueB_D] = {
            ColumnA: [0],
            ColumnE: [0]
        }
    }
     let ListColumnA = []; 
     let ListColumnE = []; 
   
     ListColumnA = pairs[valueB_D].ColumnA  
     ListColumnE = pairs[valueB_D].ColumnE  
     const collectedNumbers = { 
       ListColumnA,
       ListColumnE
   }  
   let message = []; 
   const cal =  await calculateTotalCol(null,collectedNumbers ); 
   // console.log("Calculated Total Column: ", cal);
   const columns = ['A','E']
   const data = {ColA:[], ColE:[]};
     columns.forEach((col, i)=>{ 
     if(col === 'A'){
          const rs = checkLimit(cal[`column${col}`],valueA, col)
        //   data.ColA.push(rs.canAdd); 
        //   data.ColA.push(rs.ableToAdd);
          message.push(rs)
          return 
        } else{ 
            if(message.some(m => m === undefined)){
                const rs =  checkLimit(cal[`column${col}`],valueE, col)
                message.push(rs)
                
          return
        } 

       }
     })
     return {
        response: message
    }  
}
// create function determin if value is greater than ,limit   
 function checkLimit(currentTotal , value2, column){ // 950 , 80 
     const limit = 1000
     const newTotal = parseInt(currentTotal)  + parseInt(value2) ; // 1030
     const available = limit - currentTotal // 1000-950 = 50   
     let ableToAdd = 0;
     console.log('current total: ', currentTotal)
     console.log(`new total for Column ${column}: ${newTotal}`);
     let canAdd = false ;
     if(currentTotal === limit){ 
         return `Column ${column} Current ${currentTotal}:\nCan't add new value already reached the limit of ${limit}`
     }else if (newTotal > limit){ 
         return `Column ${column} Current ${currentTotal}:\nAdding ${value2} will exceed the limit of ${limit}. Available to add: ${available}`;  
     }
     return 
}