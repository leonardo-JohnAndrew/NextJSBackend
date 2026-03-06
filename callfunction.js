import { calculateTotalCol, extractNumberedMessages } from "./refracted.js";

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

main();