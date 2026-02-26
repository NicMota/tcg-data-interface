import { useEffect, useState } from 'react'
import axios from 'axios';
import { Card } from '../components/Card';





function Home() {

  const [cards,setCards] = useState([])
  
  useEffect(()=>
  {
    var fetchCards = async ()=>{
      const {data} = await axios.get('http://localhost:8000/cards');
      setCards(data);
      console.log(data)
    }

    fetchCards();
  },[])

  //resolver cartas que não tem imagem, (face_card)
  return (
    <div className='flex flex-col flex-1 bg-blue-200 '>
      <div className='w-screen flex bg-black h-24'>
        <h1 className='my-auto p-4 text-white text-2xl font-thin tracking-widest italic font-serif'>MAGIC TCG TRACKER</h1>
      </div>
      <div className='flex w-screen h-24 bg-blue-100 '>
        <input type='text' placeholder='Search'className='outline-none bg-white text-black py-2 px-4 text-2xl font-thin rounded-4xl border border-black w-1/3 m-4'/>
        
      </div>
      <div className=' grid py-24 gap-8 grid-cols-4 grid-rows-5'>
        {
          cards.map((card,i)=>(
            <Card c={card} key={i}/>
          ))
        }
      </div>
    </div>
  )
}

export default Home
