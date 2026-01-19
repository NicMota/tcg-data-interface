import { useEffect, useState } from 'react'
import './App.css'
import axios from 'axios'





function App() {

  const [cards,setCards] = useState([])
  
  useEffect(()=>
  {
    var fetchCards = async ()=>{
      const {data} = await axios.get('http://localhost:8000/cards');
      setCards([data.cards]);
      console.log(data.cards)
    }

    fetchCards();
  },[])


  return (
    <div className='flex h-screen w-screen bg-green-100'>
      {cards.map((c,i)=>
        (<div key ={i} className='block text-black w-50 h-50 bg-white'>
          pinto
        </div>)
      )}
    </div>
  )
}

export default App
