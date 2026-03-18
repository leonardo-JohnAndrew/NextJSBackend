'use client' 
import { useParams , usePathname } from "next/navigation"
import { useCallback, useEffect , useState} from "react";
import { notFound } from "next/navigation";
import axios from "axios";
import Table from "@/app/components/table";
import {formatDates} from "@/functions/formattDate";
export default function PurchaseDetails() {
     const pathname = usePathname(); 
     const params = useParams();  
     const [ purchaseDetails, setPurchaseDetails ] = useState();
     const [is404 , setIs404] = useState(false);
     const [isfetching , setIsFetching] = useState(true);
    const [formatted, setFormatted] = useState("");
    const [formattedEnding , setFormattedEnding]  = useState(); 
     const fetchPurchaseDetails = useCallback( async () => {
         try{ 
             const response = await axios.get(`/api/purchase/${params.purchaseID}`);
             setPurchaseDetails(response.data);
             setIsFetching(false);
             setFormatted(formatDates(response.data.purchase.createdAt)); 
             setFormattedEnding(formatDates(response.data.purchase.purchaseItems[0].EndingInventoryDate));
            //   console.log(response.data?.purchase?.purchaseItems[0].EndingInventoryDate);
        }catch(error){
            if(error.response && error.response.status === 404){ 
                setIs404(true);
            }else{ 
                console.error("Error fetching purchase details:", error);     
            }
            }
        }, [params.purchaseID])

        useEffect(()=> { 
            fetchPurchaseDetails();
     }, [fetchPurchaseDetails]) 
       
     if(is404){ 
        notFound();
     } 
     if(formattedEnding){ 
        console.log(formattedEnding);
     }
     //update functions by id role based access control 
     // add attachement  


  
return ( 
    <>
    
    <div className="flex relative mb-5 w-auto">
        <div className="w-1/2 flex flex-row gap-2">
          <h5>Requestor Department:</h5> <h5 className = 'display-inline text-red-950 font-extrabold'>{purchaseDetails?.purchase.RequestorRole}</h5>
        </div>
        <div className="w-1/2 flex flex-row gap-2 place-content-end">
          <h5 className= 'place-self-end'>Requisition Date:</h5><h5 className = 'display-inline text-red-950 font-extrabold'>{formatted}</h5>
        </div>
    </div>
      <div className = "grid grid-row-3 mb-5">  
      <hr className = 'border-t border-gray-300'/>
      <div className = 'flex text-xl '> 
      <h5 className ='display-inline text-black-500 font-extrabold p-5 px-0'> REQUESTOR ID: </h5> 
      <h5 className ='display-inline text-red-700 font-bold p-5'> {purchaseDetails?.purchase?.PurchaseID}</h5>
      </div> 
      <hr className = 'border-t border-gray-300'/>
      </div>     

      <Table data = {purchaseDetails || isfetching === false? purchaseDetails : []} Ending = {formattedEnding} /> 
    </>
)
}