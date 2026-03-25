import { create } from "zustand";

const useGameStore = create((set, get) => ({
  // ── Auth/Identity ─────────────────────────────────────────────────────────
  playerName: "",
  playerId: null,
  setPlayerName: (name) => set({ playerName: name }),
  setPlayerId: (id) => set({ playerId: id }),

  // ── Room ─────────────────────────────────────────────────────────────────
  roomCode: "",
  players: [], // [{ id, name, score, isHost }]
  isHost: false,
  gridSize: 10,
  turnDuration: 30,
  setRoomCode: (code) => set({ roomCode: code }),
  setPlayers: (players) => set({ players }),
  setIsHost: (v) => set({ isHost: v }),
  setGridSize: (size) => set({ gridSize: size }),
  setTurnDuration: (seconds) => set({ turnDuration: seconds }),

  // ── Game ─────────────────────────────────────────────────────────────────
  gameStarted: false,
  grid: [], // 2D array of strings
  currentTurn: null, // socket id of current player
  turnEndsAt: null,
  wordsFound: [], // [{ word, cells }]
  chat: [], // [{ senderId, senderName, message, timestamp }]
  scores: [], // [{ id, name, score }]
  bonusCells: [], // [{ row, col, multiplier }]
  activity: [],
  gameStats: null,
  gameOverReason: "",
  lastWordFlash: null, // { word, cells } for animation

  setGameStarted: (v) => set({ gameStarted: v }),
  setGrid: (grid) => set({ grid }),
  setCurrentTurn: (id) => set({ currentTurn: id }),
  setTurnEndsAt: (time) => set({ turnEndsAt: time }),
  setWordsFound: (wordsFound) => set({ wordsFound }),
  addWordFound: (word) => set((s) => ({ wordsFound: [...s.wordsFound, word] })),
  setScores: (scores) => set({ scores }),
  setBonusCells: (bonusCells) => set({ bonusCells }),
  setActivity: (activity) => set({ activity }),
  addActivityItem: (entry) =>
    set((s) => ({ activity: [...s.activity.slice(-23), entry] })),
  setGameStats: (gameStats) => set({ gameStats }),
  setGameOverReason: (gameOverReason) => set({ gameOverReason }),
  addChatMessage: (msg) => set((s) => ({ chat: [...s.chat.slice(-200), msg] })),
  setLastWordFlash: (w) => set({ lastWordFlash: w }),

  updateGridCell: (row, col, letter) =>
    set((s) => {
      const grid = s.grid.map((r) => [...r]);
      grid[row][col] = letter;
      return { grid };
    }),

  // ── UI ───────────────────────────────────────────────────────────────────
  theme: "dark",
  chatOpen: false,
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),

  // ── Reset ────────────────────────────────────────────────────────────────
  resetGame: () =>
    set({
      gameStarted: false,
      grid: [],
      currentTurn: null,
      turnEndsAt: null,
      wordsFound: [],
      chat: [],
      scores: [],
      bonusCells: [],
      activity: [],
      gameStats: null,
      gameOverReason: "",
      lastWordFlash: null,
    }),
  resetAll: () =>
    set({
      playerName: "",
      playerId: null,
      roomCode: "",
      players: [],
      isHost: false,
      gridSize: 10,
      turnDuration: 30,
      gameStarted: false,
      grid: [],
      currentTurn: null,
      turnEndsAt: null,
      wordsFound: [],
      chat: [],
      scores: [],
      bonusCells: [],
      activity: [],
      gameStats: null,
      gameOverReason: "",
      lastWordFlash: null,
      chatOpen: false,
    }),
}));

export default useGameStore;
