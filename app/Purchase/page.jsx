'use client' 
import { useCallback, useEffect , useState} from "react";
import Link from "next/link";
import axios from "axios";
export default function PurchaseDetails() {
     const [ purchaseDetails, setPurchaseDetails ] = useState();
      
     // crud next js api route 
     
     const fetchPurchaseDetails = useCallback( async () => {
        try{ 
            const response = await axios.get(`/api/purchase`);
            setPurchaseDetails(response.data);

        }catch(error){
            if(error.response && error.response.status === 404){ 
                setIs404(true);
            }else{ 
                console.error("Error fetching purchase details:", error);     
            }
            }
        }, [])   
        useEffect(()=> { 
            fetchPurchaseDetails();
     }, [fetchPurchaseDetails]) 
       
return ( 
    <>
       
       {purchaseDetails && (
           <div>
             { 
              purchaseDetails.purchases.map(pr => ( 
                <div key={pr.PurchaseID}> 
                <h1>Purchase Details: {pr.PurchaseID}</h1>
             {pr.purchaseItems.map(item => (
            <div key={item.id}>
                <p>Item Name: {item.ItemName}</p>
                <p>Quantity: {item.Quantity}</p> 
                <p>Required Balance: {item.RequiredBalance.toFixed(2)}</p>
                <p>Unit: {item.Unit} </p>
                <p>Unit Price: {item.UnitPrice}</p>
                <p>Total: {item.Quantity * item.UnitPrice}</p>
                <Link href={`/Purchase/${pr.PurchaseID}`}>View Details</Link>
             </div>       
  ))}
  <br />
                </div>
              ))
             }
                
           </div>
       )}
    </>
)
}