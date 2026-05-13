import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// @ts-ignore
import DiscordStrategy from 'passport-discord';
import { db } from '../db';
import { signAccessToken, createRefreshToken } from './jwt';

export const oauthRouter = Router();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN!;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth/refresh',
};

console.log('[OAuth] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'OK' : 'UNDEFINED');
console.log('[OAuth] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'OK' : 'UNDEFINED');
console.log('[OAuth] GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL ?? 'UNDEFINED');
console.log('[OAuth] DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID ? 'OK' : 'UNDEFINED');
console.log('[OAuth] DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET ? 'OK' : 'UNDEFINED');
console.log('[OAuth] DISCORD_CALLBACK_URL:', process.env.DISCORD_CALLBACK_URL ?? 'UNDEFINED');

async function findOrCreateOAuthUser(
  provider: string,
  providerId: string,
  email: string,
  username: string
): Promise<{ id: string; username: string }> {
  const oauthResult = await db.query(
    'SELECT u.id, u.username FROM oauth_accounts o JOIN users u ON u.id = o.user_id WHERE o.provider = $1 AND o.provider_id = $2',
    [provider, providerId]
  );
  if (oauthResult.rows[0]) return oauthResult.rows[0];

  const userResult = await db.query(
    'SELECT id, username FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  let userId: string;
  let finalUsername: string;

  if (userResult.rows[0]) {
    userId = userResult.rows[0].id;
    finalUsername = userResult.rows[0].username;
  } else {
    let safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20);
    const taken = await db.query('SELECT id FROM users WHERE username = $1', [safeUsername]);
    if (taken.rowCount! > 0) safeUsername = `${safeUsername}_${Date.now().toString().slice(-4)}`;
    const newUser = await db.query(
      'INSERT INTO users (email, username) VALUES ($1, $2) RETURNING id, username',
      [email.toLowerCase(), safeUsername]
    );
    userId = newUser.rows[0].id;
    finalUsername = newUser.rows[0].username;
  }

  await db.query(
    'INSERT INTO oauth_accounts (user_id, provider, provider_id) VALUES ($1, $2, $3)',
    [userId, provider, providerId]
  );

  return { id: userId, username: finalUsername };
}

// --- Discord ---
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: process.env.DISCORD_CALLBACK_URL!,
        scope: ['identify', 'email'],
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: Function) => {
        try {
          const user = await findOrCreateOAuthUser('discord', profile.id, profile.email, profile.username);
          done(null, user);
        } catch (err) { done(err); }
      }
    )
  );

  oauthRouter.get('/discord', passport.authenticate('discord'));
  oauthRouter.get(
    '/discord/callback',
    passport.authenticate('discord', { session: false, failureRedirect: `${CLIENT_ORIGIN}?error=oauth` }),
    async (req: any, res) => {
      const user = req.user as { id: string; username: string };
      const accessToken = signAccessToken({ userId: user.id, username: user.username });
      const refreshToken = await createRefreshToken(user.id);
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      res.redirect(`${CLIENT_ORIGIN}?token=${accessToken}`);
    }
  );
}

// --- Google ---
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? '';
          const user = await findOrCreateOAuthUser('google', profile.id, email, profile.displayName);
          done(null, user);
        } catch (err) { done(err as Error); }
      }
    )
  );

  oauthRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  oauthRouter.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${CLIENT_ORIGIN}?error=oauth` }),
    async (req: any, res) => {
      const user = req.user as { id: string; username: string };
      const accessToken = signAccessToken({ userId: user.id, username: user.username });
      const refreshToken = await createRefreshToken(user.id);
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      res.redirect(`${CLIENT_ORIGIN}?token=${accessToken}`);
    }
  );
}
