import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Lobby from "./pages/Lobby.jsx";
import GamePage from "./pages/GamePage.jsx";
import Background from "./components/Background.jsx";
import useGameStore from "./store/useGameStore.js";

export default function App() {
  const theme = useGameStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="relative min-h-screen overflow-hidden bg-slate-100 dark:bg-[#07131f]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10rem] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-cyan-400/16 blur-3xl dark:bg-cyan-400/12" />
          <div className="absolute right-[-8rem] top-[6rem] h-[24rem] w-[24rem] rounded-full bg-amber-300/18 blur-3xl dark:bg-amber-300/10" />
          <div className="absolute bottom-[-10rem] left-[15%] h-[26rem] w-[26rem] rounded-full bg-emerald-400/14 blur-3xl dark:bg-emerald-400/10" />
        </div>

        <Background />

        <div className="relative z-10">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </div>
  );
}
