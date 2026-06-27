// metricsClient.js (#5) — consome /api/metrics (admin-only).
import { request } from './apiClient.js';

export async function fetchMetrics() {
  const { status, data } = await request('/metrics', { auth: true });
  if (status === 200) return data;
  const thrown = new Error((data && data.error) || 'Falha ao obter métricas');
  thrown.status = status;
  throw thrown;
}
