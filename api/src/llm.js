// Chamada ao LLM com fallback entre provedores (formato OpenAI-compatível) e
// timeout por provedor. Portado de supabase/functions/prompt-llm.
export async function callLLM(providers, messages, temperature, timeoutMs, log = () => {}) {
  const configured = providers.filter((p) => p.key);
  if (configured.length === 0) {
    throw Object.assign(new Error('Nenhum provedor LLM configurado'), { code: 'no_provider' });
  }
  let lastErr;
  for (const p of configured) {
    try {
      const resp = await fetch(p.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${p.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: p.model, messages, temperature }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resp.ok) {
        lastErr = new Error(`${p.name} ${resp.status}`);
        log('warn', 'provider_failed', { provider: p.name, status: resp.status });
        continue;
      }
      const data = await resp.json();
      log('info', 'provider_ok', { provider: p.name });
      return {
        content: data?.choices?.[0]?.message?.content ?? '',
        model: data?.model ?? p.model,
        provider: p.name,
      };
    } catch (err) {
      lastErr = err;
      log('warn', 'provider_error', { provider: p.name, error: String(err?.message ?? err) });
    }
  }
  throw Object.assign(new Error('Todos os provedores falharam'), { code: 'all_failed', cause: lastErr });
}
