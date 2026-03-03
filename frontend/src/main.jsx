import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Reset CSS básico
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
