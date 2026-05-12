import { Server } from 'socket.io';
import { verifyAccessToken } from '../auth/jwt';

/**
 * Middleware Socket.io : vérifie le JWT au handshake.
 * Le client doit envoyer : { auth: { token: '<accessToken>' } }
 * Connexion refusée si token absent ou invalide.
 */
export function applySocketAuth(io: Server): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== 'string') {
      return next(new Error('AUTH_REQUIRED'));
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return next(new Error('AUTH_INVALID'));
    }

    // Attacher l'utilisateur au socket pour usage dans les handlers
    (socket as any).user = payload;
    next();
  });
}
