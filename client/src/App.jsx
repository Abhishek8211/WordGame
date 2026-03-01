import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Lobby from './pages/Lobby.jsx';
import GamePage from './pages/GamePage.jsx';
import Background from './components/Background.jsx';
import useGameStore from './store/useGameStore.js';

export default function App() {
  const theme = useGameStore((s) => s.theme);

  // Apply dark/light class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-950 dark:bg-gray-950 light:bg-slate-100 relative overflow-hidden">
        {/* Anti-gravity background layer */}
        <Background />

        {/* Page content */}
        <div className="relative z-10">
          <BrowserRouter>
            <Routes>
              <Route path="/"       element={<Home />} />
              <Route path="/lobby"  element={<Lobby />} />
              <Route path="/game"   element={<GamePage />} />
              <Route path="*"       element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </div>
  );
}
