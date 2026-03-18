'use client'
import { useState } from "react";

const Table = (props) => { 
  const [tableHeader] = useState([ 
    'No.', 'ITEM DESCRIPTION', 'REQUIRED BALANCE',
    'ENDING INVENTORY', 'QUANTITY', 
    'UNIT', 'UNIT PRICE', 'TOTAL'
  ]);
   
  return (
    <> 
      <div className='table-container w-full '>
        <table className="border border-gray-300 w-full">
          <thead  className="bg-black text-white border-2"> 
            <tr> 
              {tableHeader.map((header, index) => (
                <th key={index} className='border-b border-gray-300 text-left px-4 py-2'>
                  {header}
                  {header === "ENDING INVENTORY" && (
                    <div className='w-auto'>   <input className="bg-gray-300 text-red-500"  type = 'date' defaultValue = {
                        props.data.purchase?.purchaseItems[0].EndingInventoryDate ? props.data.purchase.purchaseItems[0].EndingInventoryDate.split('T')[0] : ""
                    } /> </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
            <tbody>
                {props.data?.purchase?.purchaseItems.map((item, index) => (
                    <tr key={index} className='border-b border-gray-300'>
                        <td className='px-4 py-2'>{item.id}

                        </td>
                        <td className='px-4 py-2'>
                          <input className="bg-gray-200 border border-gray-300 outline-1 outline-gray-200"  type="text" defaultValue={item.ItemName} readOnly= {true} />
                        </td>
                        <td className='px-4 py-2'>{item.RequiredBalance}
                           {/* <input className="bg-gray-200 border border-gray-300 outline-1 outline-gray-200"  type="text" defaultValue={item.RequiredBalance} readOnly= {true} /> */}
                        </td>
                        <td className='px-4 py-2'>
                           <input className="bg-gray-200 border border-gray-300 outline-1 outline-gray-200"  type="text" defaultValue={item.EndingInventory || 0} readOnly= {true} />
                        </td>
                        <td className='px-4 py-2'>
                            <input className="bg-gray-200 border border-gray-300 outline-1 outline-gray-200"  type="text" defaultValue={item.Quantity} readOnly= {true} />
                        </td>
                        <td className='px-4 py-2'>{item.Unit}
                        </td>
                        <td className='px-4 py-2'>
                           <input className="bg-gray-200 border border-gray-300 outline-1 outline-gray-200"  type="text" defaultValue={item.UnitPrice} readOnly= {true} />
                        </td>
                        <td className='px-4 py-2 '>
                           <h4 className="px-2 py-1 w-auto my-1 bg-[#911707] text-white" >{item.Quantity * item.UnitPrice || 0}</h4>    
                        </td> 
                 </tr>             
                ))}
            </tbody>
        </table>
      </div>
    </>
  ); 
};

export default Table;