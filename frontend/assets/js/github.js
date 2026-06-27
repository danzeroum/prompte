// github.js — cliente da conexão GitHub. Conversa só com o backend (mesma
// origem, /api); o token OAuth nunca chega ao navegador. Mantém um cache leve
// do status para a UI consultar sem ir à rede a cada render.
import { request, getSession } from './apiClient.js';

let _status = null; // { enabled, connected, login, scope } | null (desconhecido)

// Estado da conexão. force=true ignora o cache.
export async function getStatus(force = false) {
  if (_status && !force) return _status;
  if (!getSession()?.access) return { enabled: false, connected: false };
  try {
    const { ok, data } = await request('/github/status', { auth: true });
    _status = ok && data ? data : { enabled: false, connected: false };
  } catch {
    _status = { enabled: false, connected: false };
  }
  return _status;
}

// Inicia o fluxo OAuth: pega a URL de autorização e navega o usuário até o GitHub.
// Ao voltar, o callback redireciona para /generator.html?github=connected.
export async function connect() {
  const { ok, data } = await request('/github/authorize', { auth: true });
  if (ok && data?.url) {
    window.location.assign(data.url);
    return true;
  }
  return false;
}

export async function disconnect() {
  await request('/github/disconnect', { method: 'DELETE', auth: true });
  _status = { ...(_status || {}), connected: false, login: null };
  return true;
}

export async function listRepos(q = '') {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const { ok, data } = await request(`/github/repos${qs}`, { auth: true });
  return ok && data ? data.repos || [] : [];
}

export async function listContents(repo, path = '') {
  const qs = `?repo=${encodeURIComponent(repo)}${path ? `&path=${encodeURIComponent(path)}` : ''}`;
  const { ok, data } = await request(`/github/contents${qs}`, { auth: true });
  return ok && data ? data : { items: [] };
}

// Invalida o cache de status (ex.: após login/logout).
export function resetGithubStatus() {
  _status = null;
}
