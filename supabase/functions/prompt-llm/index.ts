// Edge Function: prompt-llm (Fases C, D, e melhorias #1/#6/#7/#10)
// Proxy seguro para LLM com cache no Postgres, rate limiting (janela deslizante),
// fallback entre provedores, cache HTTP e logs estruturados com requestId.

import { createClient } from 'jsr:@supabase/supabase-js@2';

// #7 — provedores em ordem de prioridade (formato OpenAI-compatível).
const PROVIDERS = [
  {
    name: 'deepseek',
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    keyEnv: 'DEEPSEEK_API_KEY',
  },
  {
    name: 'openai',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    keyEnv: 'OPENAI_API_KEY',
  },
];

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=60';
const REQUEST_TIMEOUT_MS = 20000;
const RATE_WINDOW = '10 minutes';
const LIMIT_ANON = 15;
const LIMIT_AUTH = 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'x-request-id',
};

// #10 — logger estruturado (JSON) correlacionado por requestId.
function makeLog(requestId: string) {
  return (level: 'info' | 'warn' | 'error', msg: string, extra: Record<string, unknown> = {}) => {
    console.log(JSON.stringify({ level, msg, requestId, ts: new Date().toISOString(), ...extra }));
  };
}

function json(body: unknown, status = 200, requestId = '', extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-request-id': requestId, ...extra },
  });
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function decodeJwt(req: Request): { role?: string; sub?: string } {
  try {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const payload = token.split('.')[1];
    if (!payload) return {};
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || 'unknown';
}

// #7 — tenta cada provedor configurado em ordem; faz fallback em erro/timeout.
async function callLLM(
  messages: unknown,
  temperature: number,
  log: ReturnType<typeof makeLog>,
): Promise<{ content: string; model: string; provider: string }> {
  const configured = PROVIDERS.filter((p) => Deno.env.get(p.keyEnv));
  if (configured.length === 0) {
    throw Object.assign(new Error('Nenhum provedor LLM configurado'), { code: 'no_provider' });
  }
  let lastErr: unknown;
  for (const p of configured) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const resp = await fetch(p.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${Deno.env.get(p.keyEnv)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: p.model, messages, temperature }),
        signal: controller.signal,
      });
      if (!resp.ok) {
        const detail = (await resp.text()).slice(0, 300);
        log('warn', 'provider_failed', { provider: p.name, status: resp.status, detail });
        lastErr = new Error(`${p.name} ${resp.status}`);
        continue;
      }
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content ?? '';
      log('info', 'provider_ok', { provider: p.name });
      return { content, model: data?.model ?? p.model, provider: p.name };
    } catch (err) {
      log('warn', 'provider_error', { provider: p.name, error: String((err as Error)?.message ?? err) });
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw Object.assign(new Error('Todos os provedores falharam'), { code: 'all_failed', cause: lastErr });
}

Deno.serve(async (req: Request) => {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const log = makeLog(requestId);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, requestId);

  let body: { messages?: unknown; temperature?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400, requestId);
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: '`messages` deve ser um array não vazio' }, 400, requestId);
  }
  let temperature = typeof body.temperature === 'number' ? body.temperature : 0.3;
  temperature = Math.min(2, Math.max(0, temperature));

  const hash = await sha256Hex(stableStringify({ messages, temperature }));
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // 1) Cache (hits não consomem rate limit nem custo).
  const { data: cached } = await supabase
    .from('prompt_cache')
    .select('response, expires_at')
    .eq('hash', hash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (cached?.response) {
    log('info', 'cache_hit', { hash });
    return json({ ...cached.response, cache_hit: true }, 200, requestId, { 'Cache-Control': CACHE_CONTROL });
  }

  // 2) Há provedor configurado?
  if (PROVIDERS.every((p) => !Deno.env.get(p.keyEnv))) {
    log('error', 'no_provider');
    return json({ error: 'LLM não configurada: defina DEEPSEEK_API_KEY (ou OPENAI_API_KEY)' }, 503, requestId);
  }

  // 3) Rate limiting (janela deslizante, auth-aware).
  const { role, sub } = decodeJwt(req);
  const isAuthed = role === 'authenticated' && !!sub;
  const id = isAuthed ? `llm:user:${sub}` : `llm:ip:${clientIp(req)}`;
  const max = isAuthed ? LIMIT_AUTH : LIMIT_ANON;
  const { data: rl, error: rlError } = await supabase.rpc('consume_rate_limit', {
    p_id: id,
    p_max: max,
    p_window: RATE_WINDOW,
  });
  const limit = Array.isArray(rl) ? rl[0] : rl;
  if (!rlError && limit && limit.allowed === false) {
    const resetAt = limit.reset_at as string;
    const retryAfter = Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000));
    log('warn', 'rate_limited', { id, max });
    return json({ error: 'Limite de requisições atingido. Tente mais tarde.', reset_at: resetAt }, 429, requestId, {
      'Retry-After': String(retryAfter),
    });
  }

  // 4) Cache miss -> chama LLM com fallback.
  let result: { content: string; model: string; provider: string };
  try {
    result = await callLLM(messages, temperature, log);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    log('error', 'llm_failed', { code, error: String((err as Error)?.message ?? err) });
    return json({ error: 'LLM indisponível', detail: code ?? 'error' }, 502, requestId);
  }

  // 5) Grava no cache.
  await supabase.from('prompt_cache').upsert(
    { hash, response: result, expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString() },
    { onConflict: 'hash' },
  );

  return json({ ...result, cache_hit: false }, 200, requestId, { 'Cache-Control': CACHE_CONTROL });
});
