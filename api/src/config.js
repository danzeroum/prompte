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
};
