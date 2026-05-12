import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface JwtPayload {
  userId: string;
  username: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  return token;
}

export async function rotateRefreshToken(
  oldToken: string
): Promise<{ userId: string; newRefreshToken: string } | null> {
  const tokenHash = crypto.createHash('sha256').update(oldToken).digest('hex');

  const result = await db.query(
    'DELETE FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW() RETURNING user_id',
    [tokenHash]
  );

  if (result.rowCount === 0) return null;

  const userId = result.rows[0].user_id;
  const newRefreshToken = await createRefreshToken(userId);
  return { userId, newRefreshToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}
