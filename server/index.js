const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const {
  createRoom,
  getRoom,
  removeRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  clearRoomTurnTimer,
  getRoomByPlayer,
} = require("./src/roomManager");
const { validateWord } = require("./src/wordValidator");
const {
  checkWordsFormed,
  createInitialStats,
  generateBonusCells,
  getCellMultiplier,
  getStatsSnapshot,
  initGrid,
  isGridFull,
} = require("./src/gameLogic");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const DEFAULT_TURN_DURATION = 30;
const MIN_TURN_DURATION = 10;
const MAX_TURN_DURATION = 60;

function getScores(room) {
  return room.players.map((player) => ({
    id: player.id,
    name: player.name,
    score: player.score,
  }));
}

function appendActivity(room, entry) {
  room.activity = [...room.activity.slice(-24), entry];
  return entry;
}

function createActivityEntry(type, payload) {
  return {
    id: uuidv4(),
    type,
    createdAt: Date.now(),
    ...payload,
  };
}

function advanceTurn(room) {
  room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
  return room.players[room.currentTurnIndex];
}

function emitRoomUpdate(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;

  io.to(roomCode).emit("room_update", {
    players: room.players,
    gridSize: room.gridSize,
    turnDuration: room.turnDuration,
  });
}

function endGame(roomCode, reason) {
  const room = getRoom(roomCode);
  if (!room) return;

  room.gameStarted = false;
  clearRoomTurnTimer(room);

  io.to(roomCode).emit("game_ended", {
    reason,
    scores: getScores(room),
    stats: room.stats ? getStatsSnapshot(room.stats) : null,
    activity: room.activity,
    bonusCells: room.bonusCells,
  });
}

function scheduleTurnTimer(roomCode) {
  const room = getRoom(roomCode);
  if (!room || !room.gameStarted || room.players.length < 2) return;

  clearRoomTurnTimer(room);
  room.turnEndsAt = Date.now() + room.turnDuration * 1000;
  room.turnTimer = setTimeout(() => {
    const liveRoom = getRoom(roomCode);
    if (!liveRoom || !liveRoom.gameStarted || liveRoom.players.length < 2) {
      return;
    }

    const skippedPlayer = liveRoom.players[liveRoom.currentTurnIndex];
    const activityEntry = appendActivity(
      liveRoom,
      createActivityEntry("skip", {
        playerId: skippedPlayer.id,
        playerName: skippedPlayer.name,
        reason: "timer",
      }),
    );

    const nextPlayer = advanceTurn(liveRoom);
    scheduleTurnTimer(roomCode);

    io.to(roomCode).emit("turn_update", {
      currentTurn: nextPlayer.id,
      turnEndsAt: liveRoom.turnEndsAt,
      scores: getScores(liveRoom),
      stats: getStatsSnapshot(liveRoom.stats),
      activityEntry,
    });
  }, room.turnDuration * 1000);
}

// ─── REST health check ────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok" }));

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  // ── CREATE ROOM ─────────────────────────────────────────────────────────────
  socket.on("create_room", ({ playerName }, callback) => {
    const roomCode = generateRoomCode();
    const player = { id: socket.id, name: playerName, score: 0, isHost: true };
    createRoom(roomCode, player, {
      gridSize: 10,
      turnDuration: DEFAULT_TURN_DURATION,
    });
    socket.join(roomCode);
    console.log(`[ROOM] ${playerName} created room ${roomCode}`);
    callback({
      success: true,
      roomCode,
      player,
      gridSize: 10,
      turnDuration: DEFAULT_TURN_DURATION,
    });
  });

  // ── JOIN ROOM ────────────────────────────────────────────────────────────────
  socket.on("join_room", ({ roomCode, playerName }, callback) => {
    const room = getRoom(roomCode);
    if (!room) return callback({ success: false, error: "Room not found." });
    if (room.gameStarted)
      return callback({ success: false, error: "Game already in progress." });
    if (room.players.length >= 6)
      return callback({
        success: false,
        error: "Room is full (max 6 players).",
      });

    const player = { id: socket.id, name: playerName, score: 0, isHost: false };
    addPlayerToRoom(roomCode, player);
    socket.join(roomCode);
    console.log(`[ROOM] ${playerName} joined room ${roomCode}`);

    // Notify everyone in the room
    io.to(roomCode).emit("room_update", {
      players: room.players,
      gridSize: room.gridSize,
      turnDuration: room.turnDuration,
    });
    callback({
      success: true,
      roomCode,
      player,
      players: room.players,
      gridSize: room.gridSize,
      turnDuration: room.turnDuration,
    });
  });

  // ── KICK PLAYER (Host only) ──────────────────────────────────────────────────
  socket.on("kick_player", ({ roomCode, targetId }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const host = room.players.find((p) => p.id === socket.id);
    if (!host || !host.isHost || room.gameStarted) return;

    removePlayerFromRoom(roomCode, targetId);
    io.to(targetId).emit("kicked");
    const targetSocket = io.sockets.sockets.get(targetId);
    if (targetSocket) targetSocket.leave(roomCode);

    emitRoomUpdate(roomCode);
  });

  // ── SET GRID SIZE (Host only) ────────────────────────────────────────────────
  socket.on("set_grid_size", ({ roomCode, size }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const host = room.players.find((p) => p.id === socket.id);
    if (!host || !host.isHost || room.gameStarted) return;
    if (size < 10 || size > 20) return;

    room.gridSize = size;
    emitRoomUpdate(roomCode);
  });

  socket.on("set_turn_duration", ({ roomCode, seconds }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const host = room.players.find((p) => p.id === socket.id);
    if (!host || !host.isHost || room.gameStarted) return;

    if (seconds < MIN_TURN_DURATION || seconds > MAX_TURN_DURATION) return;

    room.turnDuration = seconds;
    emitRoomUpdate(roomCode);
  });

  // ── START GAME (Host only) ───────────────────────────────────────────────────
  socket.on("start_game", ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const host = room.players.find((p) => p.id === socket.id);
    if (!host || !host.isHost) return;
    if (room.players.length < 2) return;

    room.players.forEach((player) => {
      player.score = 0;
    });
    room.grid = initGrid(room.gridSize);
    room.gameStarted = true;
    room.currentTurnIndex = Math.floor(Math.random() * room.players.length);
    room.wordsFound = [];
    room.bonusCells = generateBonusCells(room.gridSize);
    room.activity = [];
    room.stats = createInitialStats(room.gridSize);

    const startingPlayer = room.players[room.currentTurnIndex];
    appendActivity(
      room,
      createActivityEntry("system", {
        text: `${startingPlayer.name} opens the round. Bonus tiles are live.`,
      }),
    );
    scheduleTurnTimer(roomCode);

    io.to(roomCode).emit("game_started", {
      grid: room.grid,
      gridSize: room.gridSize,
      players: room.players,
      currentTurn: startingPlayer.id,
      turnDuration: room.turnDuration,
      turnEndsAt: room.turnEndsAt,
      bonusCells: room.bonusCells,
      activity: room.activity,
      stats: getStatsSnapshot(room.stats),
    });
  });

  // ── PLACE LETTER ─────────────────────────────────────────────────────────────
  socket.on("place_letter", ({ roomCode, row, col, letter }, callback) => {
    const room = getRoom(roomCode);
    if (!room || !room.gameStarted)
      return callback({ success: false, error: "Game not active." });

    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer.id !== socket.id)
      return callback({ success: false, error: "Not your turn." });
    if (room.grid[row][col] !== "")
      return callback({ success: false, error: "Cell already occupied." });

    const upperLetter = letter.toUpperCase().trim()[0];
    if (!upperLetter || !/^[A-Z]$/.test(upperLetter))
      return callback({ success: false, error: "Invalid letter." });

    // Place letter server-side (Source of Truth)
    room.grid[row][col] = upperLetter;
    const multiplier = getCellMultiplier(room.bonusCells, row, col);

    // Check for newly formed words
    const newWords = checkWordsFormed(room.grid, row, col, room.gridSize);
    let movePoints = 1;

    const validNewWords = [];
    for (const wordResult of newWords) {
      if (
        !room.wordsFound.includes(wordResult.word) &&
        validateWord(wordResult.word)
      ) {
        room.wordsFound.push(wordResult.word);
        movePoints += wordResult.word.length;
        validNewWords.push(wordResult);

        const wordPoints = wordResult.word.length * multiplier;
        const currentBest = room.stats.bestWord;
        if (
          !currentBest ||
          wordPoints > currentBest.points ||
          (wordPoints === currentBest.points &&
            wordResult.word.length > currentBest.word.length)
        ) {
          room.stats.bestWord = {
            word: wordResult.word,
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            points: wordPoints,
            multiplier,
          };
        }
      }
    }

    const pointsEarned = movePoints * multiplier;

    // Update score
    currentPlayer.score += pointsEarned;

    room.stats.filledCells += 1;
    room.stats.totalMoves += 1;
    room.stats.totalWords = room.wordsFound.length;

    const activityEntry = appendActivity(
      room,
      createActivityEntry("move", {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        row,
        col,
        letter: upperLetter,
        points: pointsEarned,
        multiplier,
        words: validNewWords.map((word) => word.word),
      }),
    );

    const basePayload = {
      grid: room.grid,
      row,
      col,
      letter: upperLetter,
      placedBy: currentPlayer.id,
      newWords: validNewWords,
      scores: getScores(room),
      stats: getStatsSnapshot(room.stats),
      activityEntry,
      pointsEarned,
      bonusMultiplier: multiplier,
    };

    if (isGridFull(room.grid)) {
      io.to(roomCode).emit("grid_update", {
        ...basePayload,
        currentTurn: null,
        turnEndsAt: null,
      });
      endGame(roomCode, "Board complete.");
      callback({ success: true, gameEnded: true });
      return;
    }

    // Advance turn
    const nextPlayer = advanceTurn(room);
    scheduleTurnTimer(roomCode);

    // Broadcast authoritative grid update to entire room
    io.to(roomCode).emit("grid_update", {
      ...basePayload,
      currentTurn: nextPlayer.id,
      turnEndsAt: room.turnEndsAt,
    });

    callback({ success: true });
  });

  socket.on("skip_turn", ({ roomCode }, callback) => {
    const room = getRoom(roomCode);
    if (!room || !room.gameStarted) {
      callback?.({ success: false, error: "Game not active." });
      return;
    }

    const currentPlayer = room.players[room.currentTurnIndex];
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      callback?.({ success: false, error: "Not your turn." });
      return;
    }

    const activityEntry = appendActivity(
      room,
      createActivityEntry("skip", {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        reason: "player",
      }),
    );

    const nextPlayer = advanceTurn(room);
    scheduleTurnTimer(roomCode);

    io.to(roomCode).emit("turn_update", {
      currentTurn: nextPlayer.id,
      turnEndsAt: room.turnEndsAt,
      scores: getScores(room),
      stats: getStatsSnapshot(room.stats),
      activityEntry,
    });

    callback?.({ success: true });
  });

  // ── CHAT MESSAGE ─────────────────────────────────────────────────────────────
  socket.on("chat_message", ({ roomCode, message }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const sender = room.players.find((p) => p.id === socket.id);
    if (!sender) return;

    io.to(roomCode).emit("chat_message", {
      senderId: socket.id,
      senderName: sender.name,
      message: message.slice(0, 200),
      timestamp: Date.now(),
    });
  });

  // ── DISCONNECT ───────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`[-] Client disconnected: ${socket.id}`);
    const roomCode = getRoomByPlayer(socket.id);
    if (!roomCode) return;

    const room = getRoom(roomCode);
    if (!room) return;

    const leavingPlayer = room.players.find((p) => p.id === socket.id);
    const wasHost = leavingPlayer?.isHost;
    const removal = removePlayerFromRoom(roomCode, socket.id);

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
      appendActivity(
        room,
        createActivityEntry("system", {
          text: `${leavingPlayer?.name ?? "A player"} disconnected. Match ended.`,
        }),
      );
      endGame(roomCode, "Not enough players to continue.");
      return;
    }

    emitRoomUpdate(roomCode);

    if (room.gameStarted) {
      const activityEntry = appendActivity(
        room,
        createActivityEntry("system", {
          text: `${removal?.removedPlayer?.name ?? "A player"} left the room.`,
        }),
      );

      if (removal?.removedCurrentTurn) {
        scheduleTurnTimer(roomCode);
      }

      io.to(roomCode).emit("turn_update", {
        currentTurn: room.players[room.currentTurnIndex]?.id ?? null,
        turnEndsAt: room.turnEndsAt,
        scores: getScores(room),
        stats: getStatsSnapshot(room.stats),
        activityEntry,
      });
    }
  });
});

// ── Utils ─────────────────────────────────────────────────────────────────────
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  // Ensure uniqueness
  return getRoom(code) ? generateRoomCode() : code;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () =>
  console.log(`WordGrid server running on port ${PORT}`),
);
