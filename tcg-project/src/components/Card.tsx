import axios from "axios";
import { useEffect, useState } from "react"
import { CardChart } from "./CardChart";


export function Card({c})
{   

    const [price,setPrice] = useState(0);
    const [diff, setDiff] = useState(0);

    useEffect(()=>{
        async function fetchPrice(){
            try {
                const {data} = await axios.get(`http://localhost:8000/price/${c.card_id}`);
                const today_price = data[0].price_usd;
                const last_day_price = data[1].price_usd;

                setPrice(Number(today_price));
                const difference =  today_price - last_day_price;
                
                setDiff(Number(difference));
            } catch (error) {
                console.log(error);
            }
           
        }
        fetchPrice();
    },[]);


    return (
        <>
          <div className='relative  text-black m-4 flex flex-row gap-y-2  p-4 rounded-xl border-black border bg-white '>
                <div>
                  <img src={c.image_uris?.normal}  className='' alt={c.name}/>
                  <p className="font-bold text-xl m-auto">
                    {c.name}
                  </p>
                  <p className="">
                    {c.mana_cost}
                  </p>
                  <p>
                    {c.foil ? 'foil' : 'not foil'}
                  </p>
                  <p className="m-5">
                    SET: {c.set_name}
                  </p>
                  <p className="text-blue-500 self-end">
                    {price.toFixed(2)} $USD
                  </p>
                  <a href={`/card/${c.card_id}`}>
                      view card info
                  </a>
                  <div className="flex justify-between items-center">
                    <p className={`${diff>0?`text-green-500` : `text-red-500`}`}>{diff>0 ? '+'+diff.toFixed(2) : diff.toFixed(2)}</p>
                  </div>   
                </div> 
                       
          </div>
         
              
        </>
    )
}