// Auth e-mail+senha: hashing (bcrypt), JWT de acesso e refresh tokens em DB.
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { query } from './db.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normalizeEmail = (e) => String(e || '').trim().toLowerCase();

export function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}
export function verifyPassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

// Access token: JWT stateless com claims sub/email/role (compatível com o que a
// Edge Function lia: role 'authenticated' destrava o limite maior de rate limit).
export function signAccess(user) {
  return jwt.sign({ email: user.email, role: 'authenticated' }, config.jwtSecret, {
    subject: user.id,
    expiresIn: config.accessTtl,
  });
}
export function verifyAccess(token) {
  return jwt.verify(token, config.jwtSecret); // lança se inválido/expirado
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Refresh token opaco: guardamos só o hash no banco.
export async function createSession(userId) {
  const refresh = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + config.refreshTtlDays * 86400000);
  await query(
    'insert into auth_sessions (user_id, refresh_token_hash, expires_at) values ($1,$2,$3)',
    [userId, sha256(refresh), expires],
  );
  return refresh;
}
export async function validateSession(refresh) {
  if (!refresh) return null;
  const { rows } = await query(
    'select user_id, expires_at, revoked_at from auth_sessions where refresh_token_hash = $1',
    [sha256(refresh)],
  );
  const s = rows[0];
  if (!s || s.revoked_at || new Date(s.expires_at) < new Date()) return null;
  return s;
}
export async function revokeSession(refresh) {
  if (!refresh) return;
  await query(
    'update auth_sessions set revoked_at = now() where refresh_token_hash = $1 and revoked_at is null',
    [sha256(refresh)],
  );
}

// preHandler do Fastify: exige Bearer válido e popula req.user.
export async function authenticate(req, reply) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try {
    const p = verifyAccess(token);
    req.user = { id: p.sub, email: p.email, role: p.role };
  } catch {
    return reply.code(401).send({ error: 'não autenticado' });
  }
}

// Variante opcional: popula req.user se houver token válido, sem barrar anônimos.
export async function optionalAuth(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return;
  try {
    const p = verifyAccess(token);
    req.user = { id: p.sub, email: p.email, role: p.role };
  } catch {
    /* anônimo */
  }
}
