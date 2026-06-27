// Proxy de LLM — porta a Edge Function prompt-llm: cache → checa provedor →
// rate limit (janela deslizante, auth-aware) → fallback de provedor → grava cache.
import { config } from '../config.js';
import { query } from '../db.js';
import { optionalAuth } from '../auth.js';
import { requestHash } from '../hash.js';
import { callLLM } from '../llm.js';

const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';

export default async function llmRoutes(app) {
  app.post('/api/llm', { preHandler: optionalAuth }, async (req, reply) => {
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return reply.code(400).send({ error: '`messages` deve ser um array não vazio' });
    }
    let temperature = typeof req.body?.temperature === 'number' ? req.body.temperature : 0.3;
    temperature = Math.min(2, Math.max(0, temperature));

    const hash = requestHash(messages, temperature);

    // 1) Cache (hits não consomem rate limit nem custo).
    const cached = await query(
      'select response from prompt_cache where hash = $1 and expires_at > now()',
      [hash],
    );
    if (cached.rows[0]) return reply.send({ ...cached.rows[0].response, cache_hit: true });

    // 2) Há provedor configurado?
    if (!config.llm.providers.some((p) => p.key)) {
      return reply
        .code(503)
        .send({ error: 'LLM não configurada: defina DEEPSEEK_API_KEY (ou OPENAI_API_KEY)' });
    }

    // 3) Rate limit (auth-aware).
    const authed = !!req.user?.id;
    const id = authed ? `llm:user:${req.user.id}` : `llm:ip:${clientIp(req)}`;
    const max = authed ? config.llm.limitAuth : config.llm.limitAnon;
    const rl = await query('select allowed, reset_at from consume_rate_limit($1,$2,$3::interval)', [
      id,
      max,
      config.llm.rateWindow,
    ]);
    const limit = rl.rows[0];
    if (limit && limit.allowed === false) {
      const retry = Math.max(1, Math.ceil((new Date(limit.reset_at).getTime() - Date.now()) / 1000));
      return reply
        .code(429)
        .header('Retry-After', String(retry))
        .send({ error: 'Limite de requisições atingido. Tente mais tarde.', reset_at: limit.reset_at });
    }

    // 4) Cache miss → chama LLM com fallback.
    let result;
    try {
      result = await callLLM(
        config.llm.providers,
        messages,
        temperature,
        config.llm.requestTimeoutMs,
        (lvl, msg, extra) => app.log[lvl]?.({ msg, ...extra }),
      );
    } catch (err) {
      return reply.code(502).send({ error: 'LLM indisponível', detail: err.code || 'error' });
    }

    // 5) Grava no cache (TTL 1h).
    await query(
      `insert into prompt_cache (hash, response, expires_at) values ($1,$2,$3)
         on conflict (hash) do update set response = excluded.response, expires_at = excluded.expires_at`,
      [hash, JSON.stringify(result), new Date(Date.now() + config.llm.cacheTtlMs)],
    );

    return reply.send({ ...result, cache_hit: false });
  });
}
