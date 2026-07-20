import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import { Charts } from './pages/Charts'
import { CardInfo } from './pages/CardInfo'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import { Admin } from './pages/adm/Admin'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'


function App() {

  return (
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path='/' element={<Landing/>}/>
            <Route path='/login' element={<Login/>} />
            <Route path='/register' element={<Register/>} />
            <Route path='/cards' element={
              <ProtectedRoute><Home/></ProtectedRoute>
            } />
            <Route path='/charts' element={
              <ProtectedRoute><Charts/></ProtectedRoute>
            } />
            <Route path='/card/:card_id' element={
              <ProtectedRoute><CardInfo/></ProtectedRoute>
            } />
            <Route path='/admin' element={
              <AdminRoute><Admin/></AdminRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
