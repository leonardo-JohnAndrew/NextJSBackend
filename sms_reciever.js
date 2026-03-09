import path from "path";
import { calculateTotalCol, extractNumberedMessages, InsertSMS, ParseSender ,  RegisterNumber} from "./refracted.js";
import { Server } from "socket.io";
import express from "express";
import http from "http";
import {SerialPort} from "serialport";

async function main() {
     await  extractNumberedMessages('12-23-23-2').then((result) => {
        console.log(result);
    }).catch((error) => {
        console.error("Error calculating totals:", error);
    }
    ); 
    await calculateTotalCol().then((result) => {
        console.log(result.message);
    }).catch((error) => {
       console.error("Error calculating totals:", error);
    });
}
 const modemConfig = [ 
    {port: 'COM12', pin: ""},
    {port: 'COM17', pin: ""}, 
 ]



// code for modem function 
async function  startModem(config) {
    const {port : comport, pin} = config; 
    let number ; 
    let parsed = {}; 
    
    const port = new SerialPort({
        path: comport , 
        baudRate:115200, 
        autoOpen: true,
    });


      
    let waitingformessage = false;  
    let parsedHeader = {} ; 
    let smsBuffer = ""; 

    port.on('open' , () => { 
        console.log(`Port ${comport} opened successfully`); 
        
        //array of at commands to initialize modem 
        const atCommands = [
               'ATE0', 
               'AT+CPIN?',
               'AT+CMGF=1',
               'AT+CNUM',
               'AT+CSCS="GSM"',
               'AT+CPMS="ME","ME","ME"', 
               'AT+CNMI=2,2,0,0,0',
               'AT+CMGL="ALL"',
        ]  
        atCommands.forEach((cmd, index) => {
            setTimeout(() => {
                port.write(cmd + '\r');
                console.log(`Sent command: ${cmd}`);
            }, index * 2000); // stagger  by 2000ms
    });
                
}); 

 port.on('data', async (data) => {

    const text = data.toString();

    smsBuffer += text;

    const lines = smsBuffer.split(/\r?\n/);
    lines.forEach(async (line) => {
        line = line.trim();
        if(line.length === 0) return; // skip empty lines
        if(line.includes('+CPN:')){
            //customize for +CPN
            
            return; 
        } 
        if(data.includes('+CNUM')){
            const match = line.match(/\+CNUM:\s*"[^"]*","([^"]*)"/);
            if (match){
                const number = match[1]; 
              //   console.log(`Found phone number: ${number}`);
                await RegisterNumber(comport , number).then((result) => {
                    console.log(`Registered modem ${comport} with contact number ${number}`);
                }).catch((error) => {
                    console.error(`Error registering modem ${comport} with contact number ${number}: `, error);
                });
            }
             return; 
        }  
        if(line.startsWith('+CMTI:')|| line.startsWith('+CMT:')) {
            waitingformessage = true; // wait for new message
            const result = await ParseSender(line); 
             
            if(result){
                number = result.sender; 
               return;  
            }
        }else if(waitingformessage){
          if(!line || line === "OK" || line === "ERROR" ) return; 
          if(!number) return ; 
          // insert sms  
          await InsertSMS(number, line , comport); 
           io.emit('new_sms', { 
            sender: number,
            content: line, 
            port: comport 
        });
          waitingformessage = false;  
          if(line.toLowerCase() === "summary"){ 
          const total = await calculateTotalCol(); 
          port.write(`AT+CMGS="${number}"\r`);
          // wait for > prompt 
          port.write(`${total.message}`+ String.fromCharCode(26)); 
           // ctrl z 
          return; 
          } else if (number){ 
            const ExtractedResult = await extractNumberedMessages(line); 
            port.write(`AT+CMGS="${number}"\r`); 
            // wait for > prompt 
            port.write(`${ExtractedResult.response}`+ String.fromCharCode(26));
            return; 
          }
        } 
    }); 
});
}


const app = express();  
const server = http.createServer(app); 
const io  = new Server(server, { 
    cors: {
        origin: "*", 
    }
});  
server.listen(3001, () => {
    console.log("Server is running on port 3001");
});

io.on('connection', (socket) => {
    console.log('A client connected: ', socket.id);
}); 

modemConfig.forEach(config => {
    startModem(config);
});


