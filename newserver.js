const { error } = require('console');
const {SerialPort} = require('serialport'); 

const port = new SerialPort({
    path:'COM16', 
    baudRate:115200
}); 

port.on('open', () =>{ 
    console.log('port open'); 

    port.write('AT\r\n')
    setTimeout(() => port.write('AT+CMGF=1\r'), 1000);
            setTimeout(() => port.write('ATE0\r'), 200);
        setTimeout(() => port.write('AT+CPIN?\r'), 500);
        setTimeout(() => port.write('AT+CNUM\r'), 1500);
        setTimeout(() => port.write('AT+CSCS="GSM"\r'), 1500);
        setTimeout(() => port.write('AT+CPMS="ME","ME","ME"\r'), 2000); // set message format and validity period
        setTimeout(() => port.write('AT+CNMI=2,2,0,0,0\r'), 2500)
       // console.log(`listening to ${comport} for incoming messages...`);
})

port.on('data',(data) => { 
    console.log('received', data.toString('ascii'))
})

port.on("error",(err)=>{
    console.log('error',err
    )
})