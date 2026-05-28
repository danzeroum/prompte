// metricsClient.js (#5) — consome a Edge Function `metrics` (admin-only).
import { getSupabase } from './supabaseClient.js';

export async function fetchMetrics() {
  const client = await getSupabase();
  if (!client) throw new Error('Supabase não configurado');
  const { data, error } = await client.functions.invoke('metrics', { body: {} });
  if (error) {
    const status = error.context?.status;
    let detail;
    try {
      detail = error.context ? await error.context.clone().json() : undefined;
    } catch {
      detail = undefined;
    }
    const thrown = new Error(detail?.error || error.message || 'Falha ao obter métricas');
    thrown.status = status;
    throw thrown;
  }
  return data;
}
