'use client'

const Table = (props) => {
  return (
    <>
     {JSON.stringify(props)}
     <div className="flex items-center justify-center relative overflow-auto "> 
        {/* Title */}
         <table className="border border-gray-300  ">
             <thead className="bg-black text-white border-3 border-darkRed">
                <tr>
                    {props.head?.map((header , index)=>(
                        <th key={index} className="border border-gray-300 text-left  xl:px-20 lg:px-20 sm:w-fit sm:px-4 text-sm font-bold" >
                          {header}  
                        </th>
                    ))}
                </tr>
             </thead>
         <tbody>
            {props.list?.map((item ,i)=>(
                <tr key={i} className="border-b border-gray-300">
                   <td className="lg:px-20 sm:px-2 py-2">{item.createdAt?.split('T')[0]}</td>
                   <td className="lg:px-20  sm:px-2 py-2">{item.digit1}</td>
                   <td className="lg:px-20  sm:px-2 py-2">{item.digit2}</td>
                   <td className="lg:px-20  sm:px-2 py-2">{item.digit3}</td>
                   <td className="lg:px-20 sm:px-2  py-2">{item.data}</td>
                </tr>
            ))}
         </tbody>
         </table>
     </div>
    </>
  )
}

export default Table