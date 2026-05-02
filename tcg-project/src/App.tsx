import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import { Charts } from './pages/Charts'
import { CardInfo } from './pages/CardInfo'






function App() {

  
  const server_url = import.meta.env.SERVER_URL;
  //resolver cartas que não tem imagem, (face_card)
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/charts' element={<Charts/>} />
        <Route path='/card/:card_id' element={<CardInfo/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
