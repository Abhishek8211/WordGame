/**
 * In-memory room store.
 * rooms: Map<roomCode, RoomObject>
 * playerRoomMap: Map<socketId, roomCode>
 */
const rooms = new Map();
const playerRoomMap = new Map();

function createRoom(roomCode, hostPlayer, options = {}) {
  const gridSize = options.gridSize ?? 10;
  const turnDuration = options.turnDuration ?? 30;

  rooms.set(roomCode, {
    code: roomCode,
    players: [hostPlayer],
    gridSize,
    turnDuration,
    grid: null,
    gameStarted: false,
    currentTurnIndex: 0,
    wordsFound: [],
    bonusCells: [],
    activity: [],
    turnEndsAt: null,
    turnTimer: null,
    stats: null,
  });
  playerRoomMap.set(hostPlayer.id, roomCode);
  return rooms.get(roomCode);
}

function getRoom(roomCode) {
  return rooms.get(roomCode) || null;
}

function removeRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (room) {
    if (room.turnTimer) {
      clearTimeout(room.turnTimer);
    }
    room.players.forEach((p) => playerRoomMap.delete(p.id));
  }
  rooms.delete(roomCode);
}

function addPlayerToRoom(roomCode, player) {
  const room = rooms.get(roomCode);
  if (!room) return false;
  room.players.push(player);
  playerRoomMap.set(player.id, roomCode);
  return true;
}

function removePlayerFromRoom(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const removedIndex = room.players.findIndex((p) => p.id === playerId);
  if (removedIndex === -1) {
    return null;
  }

  const removedPlayer = room.players[removedIndex];
  const removedCurrentTurn = removedIndex === room.currentTurnIndex;

  room.players.splice(removedIndex, 1);
  playerRoomMap.delete(playerId);

  if (room.players.length === 0) {
    room.currentTurnIndex = 0;
    return { removedPlayer, removedIndex, removedCurrentTurn };
  }

  if (removedIndex < room.currentTurnIndex) {
    room.currentTurnIndex -= 1;
  }

  if (room.currentTurnIndex >= room.players.length) {
    room.currentTurnIndex = 0;
  }

  return { removedPlayer, removedIndex, removedCurrentTurn };
}

function clearRoomTurnTimer(room) {
  if (!room || !room.turnTimer) {
    if (room) room.turnEndsAt = null;
    return;
  }

  clearTimeout(room.turnTimer);
  room.turnTimer = null;
  room.turnEndsAt = null;
}

function getRoomByPlayer(playerId) {
  return playerRoomMap.get(playerId) || null;
}

module.exports = {
  createRoom,
  getRoom,
  removeRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  clearRoomTurnTimer,
  getRoomByPlayer,
};
