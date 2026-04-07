'use client'

import Table from "@/components/table";
import axios from "axios";
import { useCallback, useEffect, useState } from "react"

const Elist = () => { 
    const [list , setList] = useState([]); 
    const [total , setTotal] = useState(); 
    const fetchDatalist = useCallback(async()=>{
        const response = await axios.get('/api/tables/elists'); 
        console.log(response); 
        setList(response.data.elist)
    })

    useEffect(()=>{ 
     fetchDatalist(); 
    }, [])
  return (
   <>
      <Table list={list}  head ={['Date', 'Digit 1','Digit 2', 'Digit 3', 'Values']}title = {'Elist'} total = {total}
       />
   </>
  )
}

export default Elist