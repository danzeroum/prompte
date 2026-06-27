// Lógica da conexão GitHub: OAuth (state assinado, troca de código), persistência
// cifrada do token e um wrapper para chamar a API do GitHub em nome do usuário.
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { query } from './db.js';
import { encrypt, decrypt } from './crypto.js';

const gh = config.github;

// Feature só liga com OAuth App configurada (clientId + secret + callback).
export function isEnabled() {
  return Boolean(gh.clientId && gh.clientSecret && gh.callbackUrl);
}

// State anti-CSRF: JWT curto (10 min) amarrado ao usuário que iniciou o fluxo.
export function signState(userId) {
  return jwt.sign({ typ: 'gh_state' }, config.jwtSecret, { subject: userId, expiresIn: '10m' });
}
export function verifyState(token) {
  const p = jwt.verify(token, config.jwtSecret);
  if (p.typ !== 'gh_state') throw new Error('state inválido');
  return p.sub;
}

export function authorizeUrl(state) {
  const u = new URL(`${gh.authBase}/authorize`);
  u.searchParams.set('client_id', gh.clientId);
  u.searchParams.set('redirect_uri', gh.callbackUrl);
  u.searchParams.set('scope', gh.scope);
  u.searchParams.set('state', state);
  u.searchParams.set('allow_signup', 'false');
  return u.toString();
}

// Troca o código de autorização por um access token.
export async function exchangeCode(code) {
  const res = await fetch(`${gh.authBase}/access_token`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: gh.clientId,
      client_secret: gh.clientSecret,
      code,
      redirect_uri: gh.callbackUrl,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'falha ao trocar o código OAuth');
  }
  return { accessToken: data.access_token, scope: data.scope || gh.scope };
}

// Persiste (upsert) o token cifrado + identidade do usuário no GitHub.
export async function storeAccount(userId, { accessToken, login, githubId, scope }) {
  await query(
    `insert into github_accounts (user_id, github_login, github_id, access_token, scope, updated_at)
       values ($1,$2,$3,$4,$5, now())
     on conflict (user_id) do update
       set github_login = excluded.github_login,
           github_id    = excluded.github_id,
           access_token = excluded.access_token,
           scope        = excluded.scope,
           updated_at   = now()`,
    [userId, login, githubId || null, encrypt(accessToken), scope || null],
  );
}

// Linha pública da conta (sem o token) — para /status.
export async function getAccount(userId) {
  const { rows } = await query(
    'select github_login, github_id, scope, connected_at from github_accounts where user_id = $1',
    [userId],
  );
  return rows[0] || null;
}

export async function getToken(userId) {
  const { rows } = await query('select access_token from github_accounts where user_id = $1', [
    userId,
  ]);
  if (!rows[0]) return null;
  try {
    return decrypt(rows[0].access_token);
  } catch {
    return null; // blob corrompido / chave trocada → tratado como desconectado
  }
}

export async function disconnect(userId) {
  await query('delete from github_accounts where user_id = $1', [userId]);
}

// Chama a API do GitHub com o token do usuário. Resolve { ok, status, data }.
// 401 sinaliza token revogado/expirado — o caller decide remover a conexão.
export async function ghApi(token, path, { method = 'GET', headers = {} } = {}) {
  const url = path.startsWith('http') ? path : `${gh.apiBase}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'prompte-app',
      ...headers,
    },
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* sem corpo */
  }
  return { ok: res.ok, status: res.status, data };
}
