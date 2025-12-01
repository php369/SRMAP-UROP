import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize theme on app start
import { initializeTheme, setupSystemThemeListener } from './utils/themeInitializer'

// Service Worker registration
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration'

// Initialize theme immediately to prevent FOUC
initializeTheme()

// Set up system theme preference listener
setupSystemThemeListener()

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode> // Disabled to prevent duplicate auth requests in development
    <App />
  // </React.StrictMode>,
)

// Register service worker for offline support
if (import.meta.env.PROD) {
  serviceWorkerRegistration.register({
    onSuccess: () => {
      console.log('✅ App is ready for offline use');
    },
    onUpdate: (registration) => {
      console.log('🔄 New version available! Please refresh.');
      // You can show a toast notification here
      if (confirm('A new version is available! Reload to update?')) {
        serviceWorkerRegistration.skipWaiting();
      }
    },
    onOffline: () => {
      console.log('📡 You are offline. Some features may be limited.');
      // You can show an offline indicator here
    },
    onOnline: () => {
      console.log('🌐 You are back online!');
      // You can hide the offline indicator here
    },
  });

  // Setup online/offline listeners
  serviceWorkerRegistration.setupOnlineOfflineListeners({
    onOffline: () => {
      document.body.classList.add('offline');
    },
    onOnline: () => {
      document.body.classList.remove('offline');
    },
  });
}
