'use client'

import Table from "@/components/table";
import axios from "axios";
import { useCallback, useEffect, useState } from "react"

const Alist = () => {
    const [ list, setlist] = useState([]); 
    const [total , setTotal] = useState();   
    const fetchDataList = useCallback(async()=>{
        const response = await axios.get(`/api/tables/alists`); 
        setlist(response.data.alist);
        setTotal(response.data.total);  
    },[list])
    useEffect(()=>{ 
       fetchDataList(); 
    },[])
    
  return (
    <>
      <Table list={list} head={['Date','Digit 1', 'Digit 2', 'Digit 3', 'Values']} title ={ "Alist"} total = {total}
     /> 
    </>
  )
}

export default Alist