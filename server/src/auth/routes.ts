import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db';
import {
  signAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from './jwt';

export const authRouter = Router();

const BCRYPT_ROUNDS = 12;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth/refresh',
};

// Validation basique
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
}

function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

// POST /auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Champs manquants.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email invalide.' });
  }
  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Pseudo invalide (3-20 caractères, lettres/chiffres/_-).' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Mot de passe trop court (8 caractères minimum).' });
  }

  try {
    const exists = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username]
    );
    if (exists.rowCount! > 0) {
      return res.status(409).json({ error: 'Email ou pseudo déjà utilisé.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await db.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username',
      [email.toLowerCase(), username, passwordHash]
    );

    const user = result.rows[0];
    const accessToken = signAccessToken({ userId: user.id, username: user.username });
    const refreshToken = await createRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return res.status(201).json({ accessToken, username: user.username });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Champs manquants.' });
  }

  try {
    const result = await db.query(
      'SELECT id, username, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    // Timing-safe : on hash même si l'utilisateur n'existe pas
    const dummyHash = '$2b$12$invalidhashfortimingprotection000000000000000000000000';
    const hashToCheck = user?.password_hash ?? dummyHash;
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!user || !valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const accessToken = signAccessToken({ userId: user.id, username: user.username });
    const refreshToken = await createRefreshToken(user.id);

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return res.json({ accessToken, username: user.username });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const oldToken = req.cookies?.refreshToken;
  if (!oldToken) {
    return res.status(401).json({ error: 'Non authentifié.' });
  }

  try {
    const result = await rotateRefreshToken(oldToken);
    if (!result) {
      res.clearCookie('refreshToken', { path: '/auth/refresh' });
      return res.status(401).json({ error: 'Session expirée.' });
    }

    const userResult = await db.query(
      'SELECT username FROM users WHERE id = $1',
      [result.userId]
    );
    const username = userResult.rows[0]?.username;

    const accessToken = signAccessToken({ userId: result.userId, username });
    res.cookie('refreshToken', result.newRefreshToken, COOKIE_OPTIONS);
    return res.json({ accessToken, username });
  } catch (err) {
    console.error('[Auth] Refresh error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /auth/logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await revokeRefreshToken(token).catch(() => {});
  }
  res.clearCookie('refreshToken', { path: '/auth/refresh' });
  return res.json({ message: 'Déconnecté.' });
});
