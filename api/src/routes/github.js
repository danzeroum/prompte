// Rotas da conexão GitHub. O navegador nunca vê o token: a API o guarda cifrado
// e faz as chamadas à API do GitHub em nome do usuário (mesma origem, /api).
import { config } from '../config.js';
import { authenticate } from '../auth.js';
import {
  isEnabled,
  signState,
  verifyState,
  authorizeUrl,
  exchangeCode,
  storeAccount,
  getAccount,
  getToken,
  disconnect,
  ghApi,
} from '../github.js';

const gh = config.github;

// Base para onde o callback devolve o navegador (página do gerador).
function appBase() {
  if (gh.appBaseUrl) return gh.appBaseUrl;
  try {
    return new URL(gh.callbackUrl).origin;
  } catch {
    return '';
  }
}

// Resolve o token do usuário ou responde o erro adequado. Retorna o token ou null
// (e já enviou a resposta). 401 do GitHub = token revogado → limpamos a conexão.
async function requireToken(req, reply) {
  const token = await getToken(req.user.id);
  if (!token) {
    reply.code(409).send({ error: 'github não conectado', code: 'not_connected' });
    return null;
  }
  return token;
}

export default async function githubRoutes(app) {
  // Estado da conexão (sempre disponível; informa se a feature está ligada).
  app.get('/api/github/status', { preHandler: authenticate }, async (req) => {
    if (!isEnabled()) return { enabled: false, connected: false };
    const acc = await getAccount(req.user.id);
    return {
      enabled: true,
      connected: Boolean(acc),
      login: acc?.github_login || null,
      scope: acc?.scope || null,
    };
  });

  // Inicia o OAuth: devolve a URL de autorização com um state assinado.
  app.get('/api/github/authorize', { preHandler: authenticate }, async (req, reply) => {
    if (!isEnabled()) return reply.code(503).send({ error: 'github não configurado' });
    return { url: authorizeUrl(signState(req.user.id)) };
  });

  // Callback do GitHub (navegação do navegador, sem Bearer). Valida o state,
  // troca o código, busca a identidade e persiste o token cifrado.
  app.get('/api/github/callback', async (req, reply) => {
    const base = appBase();
    const back = (status) => reply.redirect(`${base}/generator.html?github=${status}`);
    if (!isEnabled()) return back('disabled');
    const { code, state } = req.query || {};
    if (!code || !state) return back('error');
    let userId;
    try {
      userId = verifyState(state);
    } catch {
      return back('error');
    }
    try {
      const { accessToken, scope } = await exchangeCode(code);
      const me = await ghApi(accessToken, '/user');
      if (!me.ok || !me.data?.login) return back('error');
      await storeAccount(userId, {
        accessToken,
        login: me.data.login,
        githubId: me.data.id,
        scope,
      });
      return back('connected');
    } catch (err) {
      app.log.error({ err }, 'github callback falhou');
      return back('error');
    }
  });

  // Remove a conexão (apaga o token).
  app.delete('/api/github/disconnect', { preHandler: authenticate }, async (req) => {
    await disconnect(req.user.id);
    return { ok: true };
  });

  // Lista repositórios do usuário (dono, colaborador, org). Filtro opcional ?q=.
  app.get('/api/github/repos', { preHandler: authenticate }, async (req, reply) => {
    const token = await requireToken(req, reply);
    if (!token) return;
    const r = await ghApi(
      token,
      '/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
    );
    if (r.status === 401) {
      await disconnect(req.user.id);
      return reply.code(409).send({ error: 'token revogado', code: 'not_connected' });
    }
    if (!r.ok || !Array.isArray(r.data)) {
      return reply.code(502).send({ error: 'falha ao listar repositórios' });
    }
    const q = String(req.query?.q || '').toLowerCase();
    const repos = r.data
      .filter((x) => !q || x.full_name.toLowerCase().includes(q))
      .slice(0, 50)
      .map((x) => ({
        full_name: x.full_name,
        name: x.name,
        owner: x.owner?.login,
        private: x.private,
        default_branch: x.default_branch,
        pushed_at: x.pushed_at,
      }));
    return { repos };
  });

  // Lista o conteúdo de um diretório (ou metadados de um arquivo) de um repo.
  app.get('/api/github/contents', { preHandler: authenticate }, async (req, reply) => {
    const token = await requireToken(req, reply);
    if (!token) return;
    const repo = String(req.query?.repo || '');
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
      return reply.code(400).send({ error: 'repo inválido (use owner/nome)' });
    }
    const path = String(req.query?.path || '').replace(/^\/+|\/+$/g, '');
    const ref = req.query?.ref ? `?ref=${encodeURIComponent(req.query.ref)}` : '';
    const encPath = path.split('/').map(encodeURIComponent).join('/');
    const r = await ghApi(token, `/repos/${repo}/contents/${encPath}${ref}`);
    if (r.status === 401) {
      await disconnect(req.user.id);
      return reply.code(409).send({ error: 'token revogado', code: 'not_connected' });
    }
    if (r.status === 404) return reply.code(404).send({ error: 'caminho não encontrado' });
    if (!r.ok) return reply.code(502).send({ error: 'falha ao ler conteúdo' });
    const items = (Array.isArray(r.data) ? r.data : [r.data]).map((x) => ({
      name: x.name,
      path: x.path,
      type: x.type, // 'dir' | 'file'
      size: x.size,
    }));
    // Diretórios primeiro, depois arquivos; cada grupo em ordem alfabética.
    items.sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1,
    );
    return { repo, path, items };
  });
}
