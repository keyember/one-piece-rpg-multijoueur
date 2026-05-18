import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { GameManager } from './game/GameManager';
import { registerSocketHandlers } from './socket/handlers';
import { applySocketAuth } from './socket/socketAuth';
import { authRouter } from './auth/routes';
import { oauthRouter } from './auth/oauth';
import { runMigrations } from './db/migrate';

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
if (!CLIENT_ORIGIN) {
  console.error('[FATAL] CLIENT_ORIGIN env variable is not set. Exiting.');
  process.exit(1);
}
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('[FATAL] JWT_SECRET or JWT_REFRESH_SECRET is not set. Exiting.');
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
  maxHttpBufferSize: 1e4,
});

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(passport.initialize());

app.use('/auth', authRouter);
app.use('/auth', oauthRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

applySocketAuth(io);

const gameManager = new GameManager();

io.on('connection', (socket) => {
  const user = (socket as any).user;
  console.log(`[Socket] Connexion : ${user.username} (${socket.id})`);
  registerSocketHandlers(io, socket, gameManager);
});

const PORT = process.env.PORT || 3000;

runMigrations()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`🏴‍☠️ Serveur lancé sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[FATAL] Échec des migrations:', err);
    process.exit(1);
  });
