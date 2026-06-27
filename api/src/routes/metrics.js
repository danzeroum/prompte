// Métricas do dashboard admin — porta a Edge Function metrics.
import { config } from '../config.js';
import { query } from '../db.js';
import { authenticate } from '../auth.js';

export default async function metricsRoutes(app) {
  app.get('/api/metrics', { preHandler: authenticate }, async (req, reply) => {
    const email = (req.user?.email || '').toLowerCase();
    if (!email || !config.adminEmails.includes(email)) {
      return reply.code(403).send({ error: 'Acesso restrito a administradores.' });
    }
    const { rows } = await query('select get_metrics() as m');
    return rows[0].m;
  });
}
