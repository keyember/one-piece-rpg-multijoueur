import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './game/GameManager';
import { registerSocketHandlers } from './socket/handlers';

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
if (!CLIENT_ORIGIN) {
  console.error('[FATAL] CLIENT_ORIGIN env variable is not set. Exiting.');
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Limiter la taille des payloads Socket.io
  maxHttpBufferSize: 1e4, // 10 KB max par message
});

// CORS Express également strict
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' }));

const gameManager = new GameManager();

// Health check interne uniquement (pas de données sensibles)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Connexion : ${socket.id}`);
  registerSocketHandlers(io, socket, gameManager);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🏴‍☠️ Serveur lancé sur le port ${PORT}`);
});
