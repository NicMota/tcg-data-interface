import axios from "axios";
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import { CardChart } from "../components/CardChart";
import axs from "../axios";


export function CardInfo(){
    
   

    const {card_id} = useParams();
    const [card,setCard] = useState<any>({});
    const [priceData,setPriceData] = useState<any>({});
   

    useEffect(()=>{
        async function fetchData(){
            const {data} = await axs.get(`/cards/${card_id}`);
            console.log(data);
            setCard(data.card_info);
            const price_data = {
                prices:[],
                dates:[]
            }
            data.prices.forEach(e => {
                
                price_data.prices.push(e.price_usd);
                price_data.dates.push(new Date(e.date).toLocaleDateString() );
            });
            setPriceData(price_data);
        }
        fetchData();
    },[]);

    return(
        
         <div className='flex flex-col flex-1 bg-blue-200 h-screen'>
            <div className='w-screen flex bg-black h-24'>
                <h1 className='my-auto p-4 text-white text-2xl font-thin tracking-widest italic font-serif'>MAGIC TCG TRACKER</h1>
            </div>
            <a href="/" className="font-bold cursor-pointer m-10">voltar</a>
            {/* card info div */}
            <div className="flex items-center justify-around">
                <div className="p-4  flex flex-col size-fit gap-y-4m-auto">
                    <img src={card.image_uris?.normal}  className='rounded-3xl' alt={card.name}/>
                    <p className="font-bold italic text-2xl m-auto"> {card.name}</p>
                </div>
              
                <div className="border size-fit bg-white m-10 ">
                    <CardChart price_info={priceData} />
                </div>
             
            </div>
              
        </div>
    )
}