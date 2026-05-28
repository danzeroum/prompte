// supabaseClient.js — inicialização preguiçosa do cliente Supabase.
// As credenciais vêm de variáveis de ambiente do Vite (públicas por design:
// a publishable/anon key é feita para ser exposta no cliente). Sem elas,
// retorna null e a aplicação segue funcionando offline-first.

let _client;
let _resolved = false;

export function supabaseConfig() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  return {
    url: env.VITE_SUPABASE_URL || '',
    key: env.VITE_SUPABASE_ANON_KEY || '',
  };
}

export function isConfigured() {
  const { url, key } = supabaseConfig();
  return Boolean(url && key);
}

// Retorna o cliente Supabase, ou null se não configurado. O import do SDK é
// dinâmico para não pesar no bundle/ambientes onde não há configuração.
export async function getSupabase() {
  if (_resolved) return _client;
  _resolved = true;
  _client = null;
  const { url, key } = supabaseConfig();
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  // persistSession/autoRefresh ligados para suportar login (Fase D.2): a sessão
  // do usuário fica no localStorage e o JWT é usado automaticamente nas chamadas
  // (functions.invoke), destravando o limite maior de rate limiting.
  _client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _client;
}
