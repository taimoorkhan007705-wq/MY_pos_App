import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserPOS from './component/user/UserPOS';
import { initDB, saveProducts, syncWithServer } from './services/db';
import { products } from './data/products';
import { NetworkProvider } from './context/NetworkContext';
import './App.css';

function App() {
  useEffect(() => {
    initializeApp();

    // Auto-sync when online
    const handleOnline = () => {
      console.log('🌐 Back online - syncing...');
      syncWithServer();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 User App Starting...');
      
      await initDB();
      console.log('✅ Database initialized');

      // Load products
      await saveProducts(products);
      console.log('✅ Products loaded');

      // Sync if online
      if (navigator.onLine) {
        try {
          await syncWithServer();
          console.log('✅ Synced with server');
        } catch (error) {
          console.log('⚠️ Sync failed, using local data');
        }
      }

      // Register service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(() => console.log('✅ Service Worker registered'))
          .catch(err => console.error('❌ SW failed:', err));
      }

    } catch (error) {
      console.error('❌ Initialization failed:', error);
    }
  };

  return (
    <NetworkProvider>
      <Router>
        <Routes>
          {/* User Routes Only */}
          <Route path="/" element={<UserPOS />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </NetworkProvider>
  );
}

export default App;