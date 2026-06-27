// Configuração da API a partir de variáveis de ambiente.
// Aceita DATABASE_URL completo ou monta a partir das partes POSTGRES_*/DB_HOST.

const isProd = (process.env.NODE_ENV || 'development') === 'production';

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const user = process.env.POSTGRES_USER || 'prompte';
  const pass = process.env.POSTGRES_PASSWORD || '';
  const host = process.env.DB_HOST || 'db';
  const port = process.env.DB_PORT || '5432';
  const db = process.env.POSTGRES_DB || 'prompte';
  return `postgres://${user}:${pass}@${host}:${port}/${db}`;
}

// Em produção o JWT_SECRET é obrigatório; em dev usamos um default inseguro.
function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  if (isProd) throw new Error('JWT_SECRET é obrigatório em produção');
  return 'dev-insecure-secret-change-me';
}

export const config = {
  port: Number(process.env.API_PORT || 8787),
  host: process.env.API_HOST || '0.0.0.0',
  databaseUrl: databaseUrl(),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: jwtSecret(),
  accessTtl: process.env.JWT_ACCESS_TTL || '1h',
  refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS || 30),
  passwordMinLength: Number(process.env.PASSWORD_MIN_LENGTH || 8),
  adminEmails: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  // Conexão GitHub (OAuth App do BuildToValue). Sem clientId/secret a feature
  // fica desligada (rotas respondem 503) — o resto da API segue normal.
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    // URL absoluta do callback (deve bater com a registrada na OAuth App).
    // Ex.: https://prompte.buildtovalue.cloud/api/github/callback
    callbackUrl: process.env.GITHUB_CALLBACK_URL || '',
    // Para onde o callback redireciona o navegador ao terminar (página do gerador).
    appBaseUrl: (process.env.GITHUB_APP_BASE_URL || '').replace(/\/$/, ''),
    // 'repo' lê repositórios privados; 'public_repo' só públicos.
    scope: process.env.GITHUB_SCOPE || 'repo',
    apiBase: process.env.GITHUB_API_URL || 'https://api.github.com',
    authBase: process.env.GITHUB_AUTH_URL || 'https://github.com/login/oauth',
    // Chave dedicada p/ cifrar o token em repouso (fallback: JWT_SECRET).
    tokenKey: process.env.GITHUB_TOKEN_KEY || '',
  },
  llm: {
    requestTimeoutMs: Number(process.env.LLM_TIMEOUT_MS || 20000),
    cacheTtlMs: Number(process.env.LLM_CACHE_TTL_MS || 3600000),
    rateWindow: process.env.LLM_RATE_WINDOW || '10 minutes',
    limitAnon: Number(process.env.LLM_LIMIT_ANON || 15),
    limitAuth: Number(process.env.LLM_LIMIT_AUTH || 60),
    // URLs são sobrescrevíveis (útil em testes/self-host). Sem key, o provedor é ignorado.
    providers: [
      {
        name: 'deepseek',
        url: process.env.DEEPSEEK_URL || 'https://api.deepseek.com/v1/chat/completions',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        key: process.env.DEEPSEEK_API_KEY || '',
      },
      {
        name: 'openai',
        url: process.env.OPENAI_URL || 'https://api.openai.com/v1/chat/completions',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        key: process.env.OPENAI_API_KEY || '',
      },
    ],
  },
};
