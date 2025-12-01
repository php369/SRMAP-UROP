import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize theme on app start
import { initializeTheme, setupSystemThemeListener } from './utils/themeInitializer'

// Initialize theme immediately to prevent FOUC
initializeTheme()

// Set up system theme preference listener
setupSystemThemeListener()

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode> // Disabled to prevent duplicate auth requests in development
    <App />
  // </React.StrictMode>,
)
