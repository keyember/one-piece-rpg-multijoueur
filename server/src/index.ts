import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './game/GameManager';
import { registerSocketHandlers } from './socket/handlers';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const gameManager = new GameManager();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', players: gameManager.getPlayerCount() });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Joueur connecté : ${socket.id}`);
  registerSocketHandlers(io, socket, gameManager);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🏴‍☠️ Serveur One Piece RPG lancé sur http://localhost:${PORT}`);
});
