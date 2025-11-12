import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import LineCallback from './LineCallback'
import './index.css'

// 檢查是否為 LINE Callback 路徑
const isLineCallback = window.location.pathname === '/auth/line/callback';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isLineCallback ? <LineCallback /> : <App />}
  </React.StrictMode>,
)
