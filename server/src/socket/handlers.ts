import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, MoveInput, ChatMessage } from '../../../shared/types';
import { GameManager } from '../game/GameManager';

export function registerSocketHandlers(
  io: Server,
  socket: Socket,
  gameManager: GameManager
): void {

  // Joueur rejoint la partie
  socket.on(SOCKET_EVENTS.PLAYER_JOIN, (name: string) => {
    const player = gameManager.addPlayer(socket.id, name || `Pirate_${socket.id.slice(0, 4)}`);

    // Envoyer l'état actuel au nouveau joueur
    socket.emit(SOCKET_EVENTS.GAME_STATE, {
      players: gameManager.getAllPlayers(),
    });

    // Notifier les autres joueurs
    socket.broadcast.emit(SOCKET_EVENTS.PLAYER_JOINED, player);
  });

  // Joueur se déplace
  socket.on(SOCKET_EVENTS.PLAYER_MOVE, (input: MoveInput) => {
    const player = gameManager.movePlayer(socket.id, input);
    if (player) {
      socket.broadcast.emit(SOCKET_EVENTS.PLAYER_MOVED, player);
    }
  });

  // Message chat
  socket.on(SOCKET_EVENTS.PLAYER_CHAT, (message: string) => {
    const player = gameManager.getPlayer(socket.id);
    if (!player) return;

    const chatMsg: ChatMessage = {
      playerId: socket.id,
      playerName: player.name,
      message,
      timestamp: Date.now(),
    };
    io.emit(SOCKET_EVENTS.CHAT_MESSAGE, chatMsg);
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log(`[Socket] Joueur déconnecté : ${socket.id}`);
    gameManager.removePlayer(socket.id);
    socket.broadcast.emit(SOCKET_EVENTS.PLAYER_LEFT, socket.id);
  });
}
