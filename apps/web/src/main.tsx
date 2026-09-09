import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Prueba de conectividad con la API (Integration Frontend-Backend)
fetch('/api/events')
  .then((res) => res.json())
  .then((data) => console.log('✅ API connection successful:', data))
  .catch((err) => console.error('❌ API connection failed:', err))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

