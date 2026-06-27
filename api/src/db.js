// Pool de conexões Postgres (node-postgres).
import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });

// Sem este handler, um erro numa conexão idle (ex.: Postgres reinicia) derruba o
// processo. Logamos e seguimos — as queries em voo falham e são tratadas localmente.
pool.on('error', (err) => {
  console.error('[pg pool] erro em conexão idle:', err.message);
});

// Helper de query: query(text, params) → Promise<{ rows }>.
export const query = (text, params) => pool.query(text, params);
