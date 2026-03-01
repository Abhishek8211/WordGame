/**
 * In-memory room store.
 * rooms: Map<roomCode, RoomObject>
 * playerRoomMap: Map<socketId, roomCode>
 */
const rooms = new Map();
const playerRoomMap = new Map();

function createRoom(roomCode, hostPlayer, gridSize = 10) {
  rooms.set(roomCode, {
    code: roomCode,
    players: [hostPlayer],
    gridSize,
    grid: null,
    gameStarted: false,
    currentTurnIndex: 0,
    wordsFound: [],
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
  if (!room) return;
  room.players = room.players.filter((p) => p.id !== playerId);
  playerRoomMap.delete(playerId);

  // Fix turn index if out of bounds
  if (room.currentTurnIndex >= room.players.length) {
    room.currentTurnIndex = 0;
  }
}

function getRoomByPlayer(playerId) {
  return playerRoomMap.get(playerId) || null;
}

module.exports = { createRoom, getRoom, removeRoom, addPlayerToRoom, removePlayerFromRoom, getRoomByPlayer };
