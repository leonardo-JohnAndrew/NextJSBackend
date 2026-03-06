
const express = require('express');
const http = require('http');
const { SerialPort } = require('serialport');
const { Server } = require('socket.io');
const { ReadlineParser } = require('@serialport/parser-readline');
const   SMS  = require('./db/models/sms');
const Comport = require('./db/models/comport');
const  sequelize = require('./db/connection');
const { Extract } = require('./db/models');
const { json } = require('sequelize');




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
    // {port: 'COM12', pin: ""},
    // {port: 'COM13', pin: ""},
    // {port: 'COM14', pin: ""},
    {port: 'COM12', pin: ""},
    // {port: 'COM16', pin: ""},
    // {port: 'COM17', pin: ""},
    // {port: 'COM18', pin: ""}, 
]  // comport list & pin 

// db config 
sequelize.sync({ alter: true }).then(() => console.log('Database synced successfully!'))

// webscokeet server for real-time updates to frontend 
const app  = express(); 
const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: '*', // allow all origins for testing, restrict in production
    }
});

 server.listen(3000, () => { 
    console.log('Websocket server listening on port 3000');
}); 
 // extractMessageWithDash("40-20-12-15");

async function startModem(config) {
    const {port: comport ,  pin} = config;
    let number; 
    let parsed = {}; 
   // const contact  = await findSimNum(80); 
   // console.log(JSON.stringify(contact))
   
     
    const port = new SerialPort({
        path: comport, 
        baudRate: 115200, 
        incomingSMSIndication: true 
    });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    let sender = " "; 
    let waitingformessage = false; 
    let isReply = false ; 
    let isInserted = false; 
    // open 
    port.on('open', () => {
        console.log(`Serial port ${comport} opened.`);
        console.log(`listening to ${comport} for incoming messages...`);
setTimeout(() => port.write('ATE0\r'), 200);
setTimeout(() => port.write('AT+CPIN?\r'), 500);
setTimeout(() => port.write('AT+CMGF=1\r'), 1000);
setTimeout(() => port.write('AT+CNUM\r'), 1500);
setTimeout(() => port.write('AT+CSCS="GSM"\r'), 1500);
setTimeout(() => port.write('AT+CPMS="ME","ME","ME"\r'), 2000); // preferred storage first
setTimeout(() => port.write('AT+CNMI=2,2,0,0,0\r'), 2500);
setTimeout(() => port.write('AT+CMGL="REC UNREAD"\r'), 3000); // read all REC UNREAD 

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
      const match = data.match(/\+CMTI: "SM",(\d+)/) 
      ||data.match(/\+CMTI: "ME",(\d+)/)
      ||data.match(/\+CMT: "SM",(\d+)/)
      ||data.match(/\+CMT: "ME",(\d+)/) ; // match for SIM or internal storage
      waitingformessage = true; // wait for new message 
       
      const result = CMGRParser(data);
      console.log("Parsed result from header: ", result);
      if(result) {
            parsed = result;
            //store parsed sender and datetime for use when message content arrives
            return; 
        }    
     }else if (waitingformessage) {
    
          const message = data.trim();
           //if message = summary perform calculation 
         
          if (!message || message === 'OK') return;
           
           await extractMessageWithDash(message) //
               await insertSMS(parsed.sender, message, parsed.datetime_received, comport);
               isInserted = true;
               io.emit('new_sms', {
                   sender: parsed.sender,
                   message
          });
          waitingformessage = false;
          isReply = false; 
        
    
              if(message.toLowerCase() === "summary") {
                
               const total  = await calculateTotalCol();  // inserted, can be enhanced to check actual db insert result
               
               if(isInserted) { 
                 console.log("Number texted: ", parsed.sender); 
                 console.log("total ", JSON.stringify(total)); 
             
                 port.write(`AT+CMGS="${parsed.sender}"\r`);  // number  
                 // // wait for > prompt
                 port.write( `Today Summary \nTotal in Column A : ${total.ListColumnA.map((v, i) => `${v}`).join(' + ')} =  ${total.columnA} \nTotal in Column D : ${total.ListColumnD.map((v, i) => `${v}`).join(' + ')} =  ${total.columnD} \nTotal of Column A and D : ${total.columnA} + ${total.columnD} = ${total.total} ` + String.fromCharCode(26));
                 // CTRL+Z
                 isReply = true 
                 return; 
               }
              
            }else if (parsed?.sender && parsed?.datetime_received) {
             
   
               if(isInserted) { 
                 console.log("Number texted: ", parsed.sender); 
               //   console.log("total ", JSON.stringify(total)); 
             
                 port.write(`AT+CMGS="${parsed.sender}"\r`);  // number  
                 // // wait for > prompt
                 port.write( `DateTime Recieved: ${new Date().toLocaleString()} \nMessage: ${message}` + String.fromCharCode(26));
                 // CTRL+Z
                 isReply = true 
                 return; 
               }
                 return; 
              //  console
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
        console.log(`Parsed message from ${sender} received at ${datetime_received.toISOString()}`);
        return {
            datetime_received,
            sender
        };
}

    // calculate function
      //extracts table contain value_num1, value_num2, value_num3, value_num4 for the 4 parts of the message
    //calculateTotalCol can also use from the refrated.js it use the table extracteds with columnA, columnB, columnC, columnD
async function calculateTotalCol(){ 
       //declare variables 
      let columnA = 0 ; 
      let columnD = 0; 
      let total = 0 
      let message = " "   
      let ListColumnA = []
      let ListColumnD = []
       //get the total from database 

      try { 
           const ListColumnAval = await Extract.findAll({
            attributes: ['value_num1']
           });
           const ListColumnDval = await Extract.findAll({
            attributes: ['value_num4']
           }); 
            // list all in ListColumnA and ListColumnD 
              ListColumnAval.forEach((item, index) => {
                ListColumnA.push(item.value_num1); 
                });
                ListColumnDval.forEach((item, index) => {
                    ListColumnD.push(item.value_num4);
                });
           columnA = await Extract.sum("value_num1"); 
           columnD = await Extract.sum("value_num4"); 
           total =  columnA + columnD  ; 
            
            //  message = `Today Summary \nTotal in Column A : ${columnA} \nTotal in Column D : ${columnD} \nTotal of Column A and D : ${total} `;  
           
        //    console.log(`column A:  ${columnA} , column D: ${columnD} , Total: ${total}` ); 
      } catch (error) {
         console.log('Error fetching from database'); 
        
      } 
      return {
        columnA, 
        columnD, 
        total, 
        ListColumnA, 
        ListColumnD
      }; 
} 
    //extract message 
    //extracts table contain value_num1, value_num2, value_num3, value_num4 for the 4 parts of the message
    //extractNumberedMessages can also use from the refrated.js it use the table extracteds with columnA, columnB, columnC, columnD
async function extractMessageWithDash(message) {
     message = message.trim();
     const regex = /^\d+-\d+-\d+-\d+$/;
     const isValidFormat = regex.test(message);
     if (!isValidFormat) {
       return null; // or handle invalid format as needed  
     }

      const parts = message.split('-');
     
      try {
          let data = {};
          parts.forEach((part , index )=> {
             data[`value_num${index+1}`] = part;
          });         
            const extracted = await Extract.create(data)
            console.log('Extracted data inserted:', extracted);
      } catch (error) {
          console.error('Error inserting extracted message:', error);
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
            console.log('New SMS inserted:', newSMS);
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
 // 

// start modem for each config  
io.on('connection', (socket) => {
    console.log('New client connected to websocket', socket.id);
});   
setInterval(() => {
   modems.forEach(config => startModem(config)); 
}, 5000); // new messages


