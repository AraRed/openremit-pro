import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

/**
 * 🎯 WHY: This is the entry point for our React app
 *
 * 🔧 HOW:
 * 1. React.StrictMode helps find bugs in development
 * 2. ReactDOM.createRoot uses React 18's concurrent features
 * 3. We mount our <App /> component to the #root div in index.html
 *
 * 💼 INTERVIEW: "This uses React 18's createRoot API which enables
 *    concurrent rendering features like automatic batching and
 *    transitions for better performance."
 */

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
