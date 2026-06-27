// API de dados: prompts salvos, coleções, telemetria e leitura de cache.
// Autorização por ownership: tudo escopado ao user_id do JWT (substitui a RLS).
import { query } from '../db.js';
import { authenticate, optionalAuth } from '../auth.js';

const asTags = (v) => (Array.isArray(v) ? v.map(String).slice(0, 50) : []);
const asUuidOrNull = (v) => (typeof v === 'string' && v.length ? v : null);

export default async function dataRoutes(app) {
  // ───────────────────────── Prompts salvos (auth) ─────────────────────────
  app.get('/api/prompts', { preHandler: authenticate }, async (req) => {
    const { rows } = await query(
      `select id, template, title, content, created_at, collection, tags, favorite
         from saved_prompts where user_id = $1 order by created_at desc`,
      [req.user.id],
    );
    return { prompts: rows };
  });

  app.post('/api/prompts', { preHandler: authenticate }, async (req, reply) => {
    const b = req.body ?? {};
    if (!b.content || typeof b.content !== 'string') {
      return reply.code(400).send({ error: 'content é obrigatório' });
    }
    const { rows } = await query(
      `insert into saved_prompts (user_id, template, title, content, collection, tags, favorite)
         values ($1,$2,$3,$4,$5,$6,$7)
       returning id, template, title, content, created_at, collection, tags, favorite`,
      [
        req.user.id,
        b.template ?? null,
        b.title ?? null,
        b.content,
        asUuidOrNull(b.collection),
        asTags(b.tags),
        Boolean(b.favorite),
      ],
    );
    return reply.code(201).send({ prompt: rows[0] });
  });

  const PROMPT_FIELDS = { title: 1, content: 1, template: 1, collection: 1, tags: 1, favorite: 1 };
  app.patch('/api/prompts/:id', { preHandler: authenticate }, async (req, reply) => {
    const b = req.body ?? {};
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(b)) {
      if (!PROMPT_FIELDS[k]) continue;
      vals.push(k === 'tags' ? asTags(v) : k === 'collection' ? asUuidOrNull(v) : v);
      sets.push(`${k} = $${vals.length}`);
    }
    if (!sets.length) return reply.code(400).send({ error: 'nada para atualizar' });
    vals.push(req.params.id, req.user.id);
    const { rowCount } = await query(
      `update saved_prompts set ${sets.join(', ')}
         where id = $${vals.length - 1} and user_id = $${vals.length}`,
      vals,
    );
    if (!rowCount) return reply.code(404).send({ error: 'não encontrado' });
    return { ok: true };
  });

  app.delete('/api/prompts/:id', { preHandler: authenticate }, async (req, reply) => {
    const { rowCount } = await query('delete from saved_prompts where id = $1 and user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    if (!rowCount) return reply.code(404).send({ error: 'não encontrado' });
    return { ok: true };
  });

  // ───────────────────────── Coleções (auth) ─────────────────────────
  app.get('/api/collections', { preHandler: authenticate }, async (req) => {
    const { rows } = await query(
      'select id, name from collections where user_id = $1 order by created_at asc',
      [req.user.id],
    );
    return { collections: rows };
  });

  app.post('/api/collections', { preHandler: authenticate }, async (req, reply) => {
    const name = String(req.body?.name ?? '').trim();
    if (!name) return reply.code(400).send({ error: 'name é obrigatório' });
    const { rows } = await query(
      'insert into collections (user_id, name) values ($1,$2) returning id, name',
      [req.user.id, name],
    );
    return reply.code(201).send({ collection: rows[0] });
  });

  app.patch('/api/collections/:id', { preHandler: authenticate }, async (req, reply) => {
    const name = String(req.body?.name ?? '').trim();
    if (!name) return reply.code(400).send({ error: 'name é obrigatório' });
    const { rowCount } = await query(
      'update collections set name = $1 where id = $2 and user_id = $3',
      [name, req.params.id, req.user.id],
    );
    if (!rowCount) return reply.code(404).send({ error: 'não encontrado' });
    return { ok: true };
  });

  app.delete('/api/collections/:id', { preHandler: authenticate }, async (req, reply) => {
    // saved_prompts.collection vira null via FK (on delete set null).
    const { rowCount } = await query('delete from collections where id = $1 and user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    if (!rowCount) return reply.code(404).send({ error: 'não encontrado' });
    return { ok: true };
  });

  // ───────────────────────── Telemetria (anon ou auth) ─────────────────────────
  app.post('/api/events', { preHandler: optionalAuth }, async (req, reply) => {
    const raw = Array.isArray(req.body) ? req.body : (req.body?.events ?? []);
    if (!Array.isArray(raw) || raw.length === 0) return { sent: 0 };
    const batch = raw.slice(0, 200).filter(
      (e) => e && typeof e.type === 'string' && typeof e.session_id === 'string' && e.payload && typeof e.payload === 'object' && !Array.isArray(e.payload),
    );
    if (!batch.length) return reply.code(400).send({ error: 'nenhum evento válido' });
    const uid = req.user?.id ?? null; // user_id vem do JWT (anti-spoofing), nunca do cliente
    const values = [];
    const params = [];
    batch.forEach((e, i) => {
      const o = i * 4;
      values.push(`($${o + 1},$${o + 2},$${o + 3},$${o + 4})`);
      params.push(e.type, e.session_id, uid, JSON.stringify(e.payload));
    });
    await query(
      `insert into events (type, session_id, user_id, payload) values ${values.join(',')}`,
      params,
    );
    return { sent: batch.length };
  });

  // ───────────────────────── Cache (público, só frescas) ─────────────────────────
  app.get('/api/cache/:hash', async (req, reply) => {
    const { rows } = await query(
      'select response from prompt_cache where hash = $1 and expires_at > now()',
      [req.params.hash],
    );
    if (!rows[0]) return reply.code(404).send({ error: 'miss' });
    return { response: rows[0].response };
  });
}
