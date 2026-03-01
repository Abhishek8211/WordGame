import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Crown, UserX, Play, Settings, Users } from 'lucide-react';
import useGameStore from '../store/useGameStore.js';
import { getSocket } from '../utils/socket.js';

export default function Lobby() {
  const navigate    = useNavigate();
  const roomCode    = useGameStore((s) => s.roomCode);
  const players     = useGameStore((s) => s.players);
  const isHost      = useGameStore((s) => s.isHost);
  const gridSize    = useGameStore((s) => s.gridSize);
  const playerId    = useGameStore((s) => s.playerId);
  const setPlayers  = useGameStore((s) => s.setPlayers);
  const setGridSize = useGameStore((s) => s.setGridSize);
  const setIsHost   = useGameStore((s) => s.setIsHost);
  const setGrid     = useGameStore((s) => s.setGrid);
  const setCurrentTurn = useGameStore((s) => s.setCurrentTurn);
  const setGameStarted = useGameStore((s) => s.setGameStarted);
  const setScores      = useGameStore((s) => s.setScores);

  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (!roomCode) { navigate('/'); return; }

    const socket = getSocket();

    socket.on('room_update', ({ players, gridSize }) => {
      setPlayers(players);
      setGridSize(gridSize);
      // Update isHost status
      const me = players.find((p) => p.id === socket.id);
      if (me) setIsHost(me.isHost);
    });

    socket.on('kicked', () => {
      navigate('/');
    });

    socket.on('game_started', ({ grid, gridSize, players, currentTurn }) => {
      setGrid(grid);
      setGridSize(gridSize);
      setPlayers(players);
      setCurrentTurn(currentTurn);
      setScores(players.map((p) => ({ id: p.id, name: p.name, score: p.score })));
      setGameStarted(true);
      navigate('/game');
    });

    return () => {
      socket.off('room_update');
      socket.off('kicked');
      socket.off('game_started');
    };
  }, [roomCode]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const kickPlayer = (targetId) => {
    getSocket().emit('kick_player', { roomCode, targetId });
  };

  const changeGridSize = (val) => {
    const size = Number(val);
    setGridSize(size);
    getSocket().emit('set_grid_size', { roomCode, size });
  };

  const startGame = () => {
    if (players.length < 2) return;
    getSocket().emit('start_game', { roomCode });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-lg flex flex-col gap-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            Lobby
          </h1>
          <p className="text-white/40 text-sm mt-1">Share the code · Wait for friends</p>
        </div>

        {/* Room Code Card */}
        <div className="glass-card p-6 flex flex-col items-center gap-4">
          <span className="text-white/50 text-xs uppercase tracking-widest">Room Code</span>
          <div className="flex items-center gap-3">
            <span className="text-5xl font-mono font-extrabold tracking-[0.25em] text-violet-300 select-all">
              {roomCode}
            </span>
            <button
              className="btn-secondary p-2 rounded-xl"
              onClick={copyCode}
              title="Copy code"
            >
              <Copy size={18} />
            </button>
          </div>
          {copied && (
            <motion.span
              className="text-emerald-400 text-xs"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Copied to clipboard!
            </motion.span>
          )}
        </div>

        {/* Players */}
        <div className="glass-card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Users size={16} className="text-violet-400" />
            Players ({players.length}/6)
          </div>
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {players.map((p) => {
                const isMe = p.id === playerId;
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/8"
                  >
                    <div className="flex items-center gap-2">
                      {p.isHost && <Crown size={14} className="text-amber-400" />}
                      <span className={`font-medium ${isMe ? 'text-violet-300' : 'text-white'}`}>
                        {p.name} {isMe && <span className="text-white/30 text-xs">(you)</span>}
                      </span>
                    </div>
                    {isHost && !isMe && (
                      <button
                        className="btn-danger flex items-center gap-1.5"
                        onClick={() => kickPlayer(p.id)}
                      >
                        <UserX size={13} /> Kick
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <motion.div
            className="glass-card p-5 flex flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Settings size={16} className="text-violet-400" />
              Game Settings
            </div>

            {/* Grid size slider */}
            <div>
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>Grid Size</span>
                <span className="font-mono text-violet-300 font-semibold">{gridSize} × {gridSize}</span>
              </div>
              <input
                type="range"
                min={10}
                max={20}
                step={1}
                value={gridSize}
                onChange={(e) => changeGridSize(e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #7c3aed ${((gridSize - 10) / 10) * 100}%, rgba(255,255,255,0.1) 0%)`,
                }}
              />
              <div className="flex justify-between text-xs text-white/25 mt-1">
                <span>10×10</span>
                <span>20×20</span>
              </div>
            </div>

            <button
              className={`btn-primary py-3.5 text-base flex items-center justify-center gap-2 ${
                players.length < 2 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={startGame}
              disabled={players.length < 2}
            >
              <Play size={18} />
              {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
            </button>
          </motion.div>
        )}

        {!isHost && (
          <p className="text-white/30 text-center text-sm animate-pulse">
            Waiting for host to start the game…
          </p>
        )}
      </motion.div>
    </div>
  );
}
