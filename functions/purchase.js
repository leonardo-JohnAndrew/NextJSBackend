import crypto from 'crypto'; 

export function generatePurchaseId() {
    const prefix = "NSCR"; 
    const type = "PR";  
    const year = new Date().getFullYear();  
    const randomString = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${type}-${year}-${randomString}`;
}
