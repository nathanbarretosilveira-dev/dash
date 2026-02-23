import React, { useEffect, useState } from 'react';
import './app.css';
import Header from './components/header';
import Dashboard from './components/dashboard';
 
const TV_MODE_STORAGE_KEY = 'dashboard_tv_mode';

function App() {
  const [isTvMode, setIsTvMode] = useState(() => {
    try {
      return window.localStorage.getItem(TV_MODE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(TV_MODE_STORAGE_KEY, isTvMode ? '1' : '0');
    } catch {
      // Ignora falhas de storage em contextos restritos.
    }
  }, [isTvMode]);

  const alternarTvMode = () => setIsTvMode((prev) => !prev);

  return (
    <div className={`app ${isTvMode ? 'tv-mode' : ''}`}>
      <Header isTvMode={isTvMode} onToggleTvMode={alternarTvMode} />
      <main className="main-content">
        <Dashboard />
      </main>
    </div>
  );
}
 
export default App;
