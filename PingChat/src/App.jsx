import { useState } from 'react'
import { ChatContext } from './context/ChatContext'
import './App.css'
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom'

import MainPanel from './Pages/MainPanel/MainPanel'
import Login from './Pages/Auth/Login'

function App() {
  const api='https://pingchat-1.onrender.com/';
  const  [store,setStore]=useState()
  const [showSearchResult,setShowSearchResult]=useState(false)
  
  const updateStore=(data)=>{
    setStore(data)
  }

  return (
    <div>
      <ChatContext.Provider value={{api,store,updateStore,showSearchResult,setShowSearchResult}}>
        <Router>
          <Routes>
            <Route path='/' element={<Login/>}/>
            <Route path='/mainpanel' element={<MainPanel/>}/>



          </Routes>
        </Router>
      </ChatContext.Provider>
    </div>
  )
}

export default App
