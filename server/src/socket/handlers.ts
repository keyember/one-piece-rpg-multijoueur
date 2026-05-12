import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, MoveInput, ChatMessage } from '../../../shared/types';
import { GameManager } from '../game/GameManager';

// Constantes de validation
const MAX_NAME_LENGTH = 20;
const MIN_NAME_LENGTH = 1;
const MAX_COORD = 5000;
const MAX_SPEED_PER_TICK = 20; // pixels max entre deux updates (anti-teleport)
const MOVE_RATE_MS = 50;       // 1 update max toutes les 50ms (20/sec)
const CHAT_RATE_MS = 1000;     // 1 message max par seconde
const MAX_CHAT_LENGTH = 200;

function sanitizeName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim().replace(/[<>"'&]/g, ''); // strip HTML basique
  if (trimmed.length < MIN_NAME_LENGTH || trimmed.length > MAX_NAME_LENGTH) return null;
  return trimmed;
}

function validateMove(input: unknown): MoveInput | null {
  if (typeof input !== 'object' || input === null) return null;
  const { x, y, direction } = input as Record<string, unknown>;
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null; // NaN / Infinity
  if (Math.abs(x) > MAX_COORD || Math.abs(y) > MAX_COORD) return null;
  if (!['up', 'down', 'left', 'right'].includes(direction as string)) return null;
  return { x, y, direction: direction as MoveInput['direction'] };
}

export function registerSocketHandlers(
  io: Server,
  socket: Socket,
  gameManager: GameManager
): void {
  let lastMoveAt = 0;
  let lastChatAt = 0;
  let joinedOnce = false;

  // Joueur rejoint la partie
  socket.on(SOCKET_EVENTS.PLAYER_JOIN, (rawName: unknown) => {
    // Un joueur ne peut rejoindre qu'une seule fois par connexion
    if (joinedOnce) return;
    joinedOnce = true;

    const name = sanitizeName(rawName) ?? `Pirate_${socket.id.slice(0, 4)}`;
    const player = gameManager.addPlayer(socket.id, name);

    socket.emit(SOCKET_EVENTS.GAME_STATE, {
      players: gameManager.getAllPlayers(),
    });

    socket.broadcast.emit(SOCKET_EVENTS.PLAYER_JOINED, player);
  });

  // Joueur se déplace
  socket.on(SOCKET_EVENTS.PLAYER_MOVE, (rawInput: unknown) => {
    const now = Date.now();
    // Rate limiting
    if (now - lastMoveAt < MOVE_RATE_MS) return;
    lastMoveAt = now;

    const input = validateMove(rawInput);
    if (!input) return;

    // Anti-teleport : vérifier que le déplacement est cohérent
    const currentPlayer = gameManager.getPlayer(socket.id);
    if (!currentPlayer) return;
    const dist = Math.hypot(input.x - currentPlayer.x, input.y - currentPlayer.y);
    if (dist > MAX_SPEED_PER_TICK * 10) return; // tolérance x10 pour la latence

    const player = gameManager.movePlayer(socket.id, input);
    if (player) {
      socket.broadcast.emit(SOCKET_EVENTS.PLAYER_MOVED, player);
    }
  });

  // Message chat
  socket.on(SOCKET_EVENTS.PLAYER_CHAT, (rawMessage: unknown) => {
    const now = Date.now();
    if (now - lastChatAt < CHAT_RATE_MS) return;
    lastChatAt = now;

    if (typeof rawMessage !== 'string') return;
    const message = rawMessage.trim().replace(/[<>"'&]/g, '').slice(0, MAX_CHAT_LENGTH);
    if (!message) return;

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
    console.log(`[Socket] Déconnexion : ${socket.id}`);
    gameManager.removePlayer(socket.id);
    socket.broadcast.emit(SOCKET_EVENTS.PLAYER_LEFT, socket.id);
  });
}
