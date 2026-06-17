import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Hide the boot loader once React has mounted.
requestAnimationFrame(() => {
  const boot = document.getElementById('boot')
  if (boot) {
    boot.classList.add('hidden')
    setTimeout(() => boot.remove(), 900)
  }
})
