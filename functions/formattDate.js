export function formatDates(date){ 
  let formatted = null;
      const dateRecieved = new Date(date);
        
             const mm = String(dateRecieved.getMonth() + 1).padStart(2, "0");
             const dd = String(dateRecieved.getDate()).padStart(2, "0");
             const yyyy = dateRecieved.getFullYear();
             formatted = `${mm}-${dd}-${yyyy}`;
            return formatted;
}