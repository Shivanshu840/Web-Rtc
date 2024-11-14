import { useState } from 'react'
import './App.css'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import { Sender2 } from './components/Sender2'
import { Receiver2 } from './components/Receiver2'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sender" element={<Sender2 />} />
        <Route path="/receiver" element={<Receiver2 />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App