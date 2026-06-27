// Servidor Fastify. Rotas sob o prefixo /api (igual em dev e atrás do Caddy).
import Fastify from 'fastify';
import { config } from './config.js';
import { pool } from './db.js';

export function build() {
  const app = Fastify({ logger: { level: config.nodeEnv === 'production' ? 'info' : 'debug' } });

  // Healthcheck: confirma que a API sobe e o banco responde.
  app.get('/api/health', async (_req, reply) => {
    try {
      await pool.query('select 1');
      return { ok: true, ts: new Date().toISOString() };
    } catch (err) {
      app.log.error({ err }, 'health: db indisponível');
      return reply.code(503).send({ ok: false, error: 'db unavailable' });
    }
  });

  return app;
}

// Sobe o servidor quando executado diretamente (não em testes).
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const app = build();
  app.listen({ port: config.port, host: config.host }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}
