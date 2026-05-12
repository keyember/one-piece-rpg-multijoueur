import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../auth/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Non authentifié.' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
    return;
  }

  req.user = payload;
  next();
}
