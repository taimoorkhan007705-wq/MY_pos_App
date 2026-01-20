import React, { useEffect } from 'react';
import UserPOS from './component/user/UserPOS';
import { initDB } from './services/db';
import './App.css';

function App() {
  useEffect(() => {
    // Only init once
    initDB().catch(err => console.error("Database failed", err));
  }, []);

  return <UserPOS />;
}

export default App;