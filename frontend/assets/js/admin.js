// admin.js (#5) — renderiza o painel de métricas em admin.html.
// O chrome (tema, i18n, topbar, login) vem de app.js; aqui só tratamos o painel,
// reagindo ao estado de autenticação.

import { onAuthChange } from './auth.js';
import { fetchMetrics } from './metricsClient.js';

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}

function card(label, value) {
  return `<div class="pe-metric"><div class="pe-metric-value">${esc(value)}</div><div class="pe-metric-label">${esc(label)}</div></div>`;
}

function renderMetrics(m) {
  const hitRate = m.llm_total ? Math.round((m.cache_hits / m.llm_total) * 100) : 0;
  const cards = [
    card('Eventos totais', m.total_events ?? 0),
    card('Chamadas LLM', m.llm_total ?? 0),
    card('Cache hit rate', `${hitRate}%`),
    card('Rate limited', m.rate_limited ?? 0),
    card('Erros LLM', m.errors ?? 0),
  ].join('');

  const byType = Object.entries(m.by_type || {})
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join('');
  const perDay = (m.per_day || [])
    .map((d) => `<tr><td>${esc(d.day)}</td><td>${esc(d.count)}</td></tr>`)
    .join('');

  return `
    <div class="pe-metrics-grid">${cards}</div>
    <div class="pe-metrics-tables">
      <div><h3>Eventos por tipo</h3><table class="pe-metric-table"><tbody>${byType || '<tr><td colspan="2">—</td></tr>'}</tbody></table></div>
      <div><h3>Eventos por dia (14d)</h3><table class="pe-metric-table"><tbody>${perDay || '<tr><td colspan="2">—</td></tr>'}</tbody></table></div>
    </div>
    <p class="pe-metric-foot">Atualizado: ${esc(m.generated_at || '')}</p>
  `;
}

function mount() {
  const host = document.getElementById('pe-metrics');
  if (!host) return;
  onAuthChange(async (user) => {
    if (!user) {
      host.innerHTML = '<p>Entre como administrador (menu ⚙️ → Conta) para ver as métricas.</p>';
      return;
    }
    host.innerHTML = '<p>Carregando métricas…</p>';
    try {
      host.innerHTML = renderMetrics(await fetchMetrics());
    } catch (e) {
      host.innerHTML = `<p>${e.status === 403 ? 'Acesso restrito a administradores.' : 'Erro: ' + esc(e.message)}</p>`;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
