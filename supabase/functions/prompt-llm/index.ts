// Edge Function: prompt-llm (Fases C + D)
// Proxy seguro para a LLM (DeepSeek) com cache no Postgres e rate limiting.
// Fluxo: valida -> hash -> cache (service_role) -> miss? checa key -> rate limit
//        -> chama DeepSeek -> grava cache (TTL 1h) -> responde.
// A API key fica em Deno.env (secret DEEPSEEK_API_KEY), nunca no cliente.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
const REQUEST_TIMEOUT_MS = 20000;

// Rate limiting (janela fixa de 10 min): anônimo vs autenticado.
const RATE_WINDOW = '10 minutes';
const LIMIT_ANON = 15;
const LIMIT_AUTH = 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
  });
}

// JSON estável (chaves ordenadas) — DEVE casar com o hashRequest do cliente.
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

// Decodifica o payload do JWT (sem verificar — verify_jwt já garante validade).
function decodeJwt(req: Request): { role?: string; sub?: string } {
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '');
    const payload = token.split('.')[1];
    if (!payload) return {};
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  return fwd.split(',')[0]?.trim() || 'unknown';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { messages?: unknown; temperature?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: '`messages` deve ser um array não vazio' }, 400);
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
    return json({ ...cached.response, cache_hit: true });
  }

  // 2) Sem key configurada, não há o que chamar.
  const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
  if (!apiKey) {
    return json({ error: 'LLM não configurada: defina o secret DEEPSEEK_API_KEY' }, 503);
  }

  // 3) Rate limiting (auth-aware): usuário autenticado tem limite maior.
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
    return json(
      { error: 'Limite de requisições atingido. Tente mais tarde.', reset_at: resetAt },
      429,
      { 'Retry-After': String(retryAfter) },
    );
  }

  // 4) Cache miss -> chama a DeepSeek.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let llmData: { choices?: { message?: { content?: string } }[]; model?: string };
  try {
    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages, temperature }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const detail = await resp.text();
      return json({ error: 'Falha na LLM', status: resp.status, detail: detail.slice(0, 500) }, 502);
    }
    llmData = await resp.json();
  } catch (err) {
    return json({ error: 'LLM indisponível', detail: String((err as Error)?.message ?? err) }, 502);
  } finally {
    clearTimeout(timer);
  }

  const content = llmData?.choices?.[0]?.message?.content ?? '';
  const responsePayload = { content, model: llmData?.model ?? MODEL };

  // 5) Grava no cache (upsert; service_role ignora RLS).
  await supabase.from('prompt_cache').upsert(
    {
      hash,
      response: responsePayload,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    },
    { onConflict: 'hash' },
  );

  return json({ ...responsePayload, cache_hit: false });
});
