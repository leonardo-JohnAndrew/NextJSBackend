import crypto from "crypto"; 


export function generatePurchaseID(){ 
    const prefix = "NSCR"; 
    const type = "PR"; 
    const year = new Date().getFullYear(); 
    const randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `${prefix}-${type}-${year}-${randomCode}`; 
}