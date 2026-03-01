const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { createRoom, getRoom, removeRoom, addPlayerToRoom, removePlayerFromRoom, getRoomByPlayer } = require('./src/roomManager');
const { validateWord } = require('./src/wordValidator');
const { placeLetter, checkWordsFormed, initGrid } = require('./src/gameLogic');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ─── REST health check ────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  // ── CREATE ROOM ─────────────────────────────────────────────────────────────
  socket.on('create_room', ({ playerName }, callback) => {
    const roomCode = generateRoomCode();
    const player = { id: socket.id, name: playerName, score: 0, isHost: true };
    createRoom(roomCode, player, 10);
    socket.join(roomCode);
    console.log(`[ROOM] ${playerName} created room ${roomCode}`);
    callback({ success: true, roomCode, player });
  });

  // ── JOIN ROOM ────────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    const room = getRoom(roomCode);
    if (!room) return callback({ success: false, error: 'Room not found.' });
    if (room.gameStarted) return callback({ success: false, error: 'Game already in progress.' });
    if (room.players.length >= 6) return callback({ success: false, error: 'Room is full (max 6 players).' });

    const player = { id: socket.id, name: playerName, score: 0, isHost: false };
    addPlayerToRoom(roomCode, player);
    socket.join(roomCode);
    console.log(`[ROOM] ${playerName} joined room ${roomCode}`);

    // Notify everyone in the room
    io.to(roomCode).emit('room_update', { players: room.players, gridSize: room.gridSize });
    callback({ success: true, roomCode, player, players: room.players, gridSize: room.gridSize });
  });

  // ── KICK PLAYER (Host only) ──────────────────────────────────────────────────
  socket.on('kick_player', ({ roomCode, targetId }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const host = room.players.find((p) => p.id === socket.id);
    if (!host || !host.isHost) return;

    removePlayerFromRoom(roomCode, targetId);
    io.to(targetId).emit('kicked');
    const targetSocket = io.sockets.sockets.get(targetId);
    if (targetSocket) targetSocket.leave(roomCode);

    io.to(roomCode).emit('room_update', { players: room.players, gridSize: room.gridSize });
  });

  // ── SET GRID SIZE (Host only) ────────────────────────────────────────────────
  socket.on('set_grid_size', ({ roomCode, size }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const host = room.players.find((p) => p.id === socket.id);
    if (!host || !host.isHost) return;
    if (size < 10 || size > 20) return;

    room.gridSize = size;
    io.to(roomCode).emit('room_update', { players: room.players, gridSize: room.gridSize });
  });

  // ── START GAME (Host only) ───────────────────────────────────────────────────
  socket.on('start_game', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const host = room.players.find((p) => p.id === socket.id);
    if (!host || !host.isHost) return;
    if (room.players.length < 2) return;

    room.grid = initGrid(room.gridSize);
    room.gameStarted = true;
    room.currentTurnIndex = 0;
    room.wordsFound = [];

    io.to(roomCode).emit('game_started', {
      grid: room.grid,
      gridSize: room.gridSize,
      players: room.players,
      currentTurn: room.players[0].id,
    });
  });

  // ── PLACE LETTER ─────────────────────────────────────────────────────────────
  socket.on('place_letter', ({ roomCode, row, col, letter }, callback) => {
    const room = getRoom(roomCode);
    if (!room || !room.gameStarted) return callback({ success: false, error: 'Game not active.' });

    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer.id !== socket.id) return callback({ success: false, error: 'Not your turn.' });
    if (room.grid[row][col] !== '') return callback({ success: false, error: 'Cell already occupied.' });

    const upperLetter = letter.toUpperCase().trim()[0];
    if (!upperLetter || !/^[A-Z]$/.test(upperLetter)) return callback({ success: false, error: 'Invalid letter.' });

    // Place letter server-side (Source of Truth)
    room.grid[row][col] = upperLetter;

    // Check for newly formed words
    const newWords = checkWordsFormed(room.grid, row, col, room.gridSize);
    let pointsEarned = 1; // Always 1 point for placing a letter

    const validNewWords = [];
    for (const wordResult of newWords) {
      if (!room.wordsFound.includes(wordResult.word) && validateWord(wordResult.word)) {
        room.wordsFound.push(wordResult.word);
        pointsEarned += wordResult.word.length; // N points for N-length word extension
        validNewWords.push(wordResult);
      }
    }

    // Update score
    currentPlayer.score += pointsEarned;

    // Advance turn
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
    const nextPlayer = room.players[room.currentTurnIndex];

    // Broadcast authoritative grid update to entire room
    io.to(roomCode).emit('grid_update', {
      grid: room.grid,
      row,
      col,
      letter: upperLetter,
      placedBy: currentPlayer.id,
      newWords: validNewWords,
      scores: room.players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
      currentTurn: nextPlayer.id,
    });

    callback({ success: true });
  });

  // ── CHAT MESSAGE ─────────────────────────────────────────────────────────────
  socket.on('chat_message', ({ roomCode, message }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const sender = room.players.find((p) => p.id === socket.id);
    if (!sender) return;

    io.to(roomCode).emit('chat_message', {
      senderId: socket.id,
      senderName: sender.name,
      message: message.slice(0, 200),
      timestamp: Date.now(),
    });
  });

  // ── DISCONNECT ───────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Client disconnected: ${socket.id}`);
    const roomCode = getRoomByPlayer(socket.id);
    if (!roomCode) return;

    const room = getRoom(roomCode);
    if (!room) return;

    const wasHost = room.players.find((p) => p.id === socket.id)?.isHost;
    removePlayerFromRoom(roomCode, socket.id);

    if (room.players.length === 0) {
      removeRoom(roomCode);
      return;
    }

    // Reassign host if needed
    if (wasHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }

    // If game in progress and insufficient players, end game
    if (room.gameStarted && room.players.length < 2) {
      room.gameStarted = false;
      io.to(roomCode).emit('game_ended', {
        reason: 'Not enough players.',
        scores: room.players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
      });
    } else {
      io.to(roomCode).emit('room_update', { players: room.players, gridSize: room.gridSize });
    }
  });
});

// ── Utils ─────────────────────────────────────────────────────────────────────
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  // Ensure uniqueness
  return getRoom(code) ? generateRoomCode() : code;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`WordGrid server running on port ${PORT}`));
