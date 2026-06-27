// Configuração da API a partir de variáveis de ambiente.
// Aceita DATABASE_URL completo ou monta a partir das partes POSTGRES_*/DB_HOST.

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const user = process.env.POSTGRES_USER || 'prompte';
  const pass = process.env.POSTGRES_PASSWORD || '';
  const host = process.env.DB_HOST || 'db';
  const port = process.env.DB_PORT || '5432';
  const db = process.env.POSTGRES_DB || 'prompte';
  return `postgres://${user}:${pass}@${host}:${port}/${db}`;
}

export const config = {
  port: Number(process.env.API_PORT || 8787),
  host: process.env.API_HOST || '0.0.0.0',
  databaseUrl: databaseUrl(),
  nodeEnv: process.env.NODE_ENV || 'development',
};
