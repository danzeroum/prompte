// Rotas de autenticação (e-mail + senha).
import { config } from '../config.js';
import { query } from '../db.js';
import {
  EMAIL_RE,
  normalizeEmail,
  hashPassword,
  verifyPassword,
  signAccess,
  createSession,
  validateSession,
  revokeSession,
  authenticate,
} from '../auth.js';

export default async function authRoutes(app) {
  // Cadastro: cria usuário e já devolve sessão (auto-login).
  app.post('/api/auth/signup', async (req, reply) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? '');
    if (!EMAIL_RE.test(email)) return reply.code(400).send({ error: 'e-mail inválido' });
    if (password.length < config.passwordMinLength) {
      return reply.code(400).send({ error: `senha deve ter ao menos ${config.passwordMinLength} caracteres` });
    }
    const password_hash = await hashPassword(password);
    let user;
    try {
      const { rows } = await query(
        'insert into users (email, password_hash) values ($1,$2) returning id, email',
        [email, password_hash],
      );
      user = rows[0];
    } catch (e) {
      if (e.code === '23505') return reply.code(409).send({ error: 'e-mail já cadastrado' });
      throw e;
    }
    const refresh_token = await createSession(user.id);
    return reply.code(201).send({ user, access_token: signAccess(user), refresh_token });
  });

  // Login: valida senha e devolve access + refresh.
  app.post('/api/auth/login', async (req, reply) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? '');
    const { rows } = await query(
      'select id, email, password_hash from users where lower(email) = $1',
      [email],
    );
    const u = rows[0];
    if (!u || !(await verifyPassword(password, u.password_hash))) {
      return reply.code(401).send({ error: 'e-mail ou senha inválidos' });
    }
    const user = { id: u.id, email: u.email };
    const refresh_token = await createSession(user.id);
    return { user, access_token: signAccess(user), refresh_token };
  });

  // Refresh: troca um refresh token válido por um novo access token.
  app.post('/api/auth/refresh', async (req, reply) => {
    const s = await validateSession(String(req.body?.refresh_token ?? ''));
    if (!s) return reply.code(401).send({ error: 'sessão inválida' });
    const { rows } = await query('select id, email from users where id = $1', [s.user_id]);
    const user = rows[0];
    if (!user) return reply.code(401).send({ error: 'sessão inválida' });
    return { access_token: signAccess(user) };
  });

  // Logout: revoga o refresh token.
  app.post('/api/auth/logout', async (req) => {
    await revokeSession(String(req.body?.refresh_token ?? ''));
    return { ok: true };
  });

  // Usuário atual (Bearer).
  app.get('/api/auth/me', { preHandler: authenticate }, async (req) => ({ user: req.user }));
}
