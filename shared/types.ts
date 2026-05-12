// Types partagés entre le client et le serveur

export interface PlayerData {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  stats: PlayerStats;
  crew?: string; // Nom du crew (ex: "Chapeau de Paille")
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  strength: number;
  defense: number;
  speed: number;
  devilFruit?: DevilFruit;
}

export interface DevilFruit {
  name: string;
  type: 'Paramecia' | 'Zoan' | 'Logia';
  ability: string;
}

export interface MoveInput {
  x: number;
  y: number;
  direction: PlayerData['direction'];
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface GameState {
  players: Record<string, PlayerData>;
}

// Events Socket.io
export const SOCKET_EVENTS = {
  // Client → Serveur
  PLAYER_JOIN: 'player:join',
  PLAYER_MOVE: 'player:move',
  PLAYER_CHAT: 'player:chat',

  // Serveur → Client
  GAME_STATE: 'game:state',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_MOVED: 'player:moved',
  CHAT_MESSAGE: 'chat:message',
} as const;
