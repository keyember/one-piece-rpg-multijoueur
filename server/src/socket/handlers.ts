import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, MoveInput, ChatMessage } from 'shared/types';
import { GameManager } from '../game/GameManager';
import { JwtPayload } from '../auth/jwt';

const MAX_COORD = 5000;
const MAX_SPEED_PER_TICK = 20;
const MOVE_RATE_MS = 50;
const CHAT_RATE_MS = 1000;
const MAX_CHAT_LENGTH = 200;

function validateMove(input: unknown): MoveInput | null {
  if (typeof input !== 'object' || input === null) return null;
  const { x, y, direction } = input as Record<string, unknown>;
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (Math.abs(x) > MAX_COORD || Math.abs(y) > MAX_COORD) return null;
  if (!['up', 'down', 'left', 'right'].includes(direction as string)) return null;
  return { x, y, direction: direction as MoveInput['direction'] };
}

export function registerSocketHandlers(
  io: Server,
  socket: Socket,
  gameManager: GameManager
): void {
  const user = (socket as any).user as JwtPayload;

  let lastMoveAt = 0;
  let lastChatAt = 0;

  const player = gameManager.addPlayer(socket.id, user.username);
  socket.emit(SOCKET_EVENTS.GAME_STATE, { players: gameManager.getAllPlayers() });
  socket.broadcast.emit(SOCKET_EVENTS.PLAYER_JOINED, player);

  socket.on(SOCKET_EVENTS.PLAYER_MOVE, (rawInput: unknown) => {
    const now = Date.now();
    if (now - lastMoveAt < MOVE_RATE_MS) return;
    lastMoveAt = now;

    const input = validateMove(rawInput);
    if (!input) return;

    const currentPlayer = gameManager.getPlayer(socket.id);
    if (!currentPlayer) return;
    const dist = Math.hypot(input.x - currentPlayer.x, input.y - currentPlayer.y);
    if (dist > MAX_SPEED_PER_TICK * 10) return;

    const updated = gameManager.movePlayer(socket.id, input);
    if (updated) socket.broadcast.emit(SOCKET_EVENTS.PLAYER_MOVED, updated);
  });

  socket.on(SOCKET_EVENTS.PLAYER_CHAT, (rawMessage: unknown) => {
    const now = Date.now();
    if (now - lastChatAt < CHAT_RATE_MS) return;
    lastChatAt = now;

    if (typeof rawMessage !== 'string') return;
    const message = rawMessage.trim().replace(/[<>"'&]/g, '').slice(0, MAX_CHAT_LENGTH);
    if (!message) return;

    const chatMsg: ChatMessage = {
      playerId: socket.id,
      playerName: user.username,
      message,
      timestamp: Date.now(),
    };
    io.emit(SOCKET_EVENTS.CHAT_MESSAGE, chatMsg);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Déconnexion : ${user.username}`);
    gameManager.removePlayer(socket.id);
    socket.broadcast.emit(SOCKET_EVENTS.PLAYER_LEFT, socket.id);
  });
}
