// adminGate.js — controla a visibilidade do link "Admin / Métricas" (#M-UX-D).
// O link nasce com `hidden` no HTML e só é revelado para administradores reais.
// Como o frontend não conhece a lista de admins (segredo `ADMIN_EMAILS` no
// servidor), a única forma de saber é sondar a Edge Function `metrics`, que
// responde 403 para não-admins. Cacheamos o resultado em localStorage para
// revelar otimisticamente em loads seguintes sem forçar o SDK do Supabase
// (respeita o lazy-load #M12). O servidor continua protegendo o admin.html.

import { onAuthChange as realOnAuthChange } from './auth.js';
import { fetchMetrics as realFetchMetrics } from './metricsClient.js';

const CACHE_KEY = 'pe:isAdmin';
const LINK_SELECTOR = 'a[href="/admin.html"]';

function setVisible(visible, root = document) {
  root.querySelectorAll(LINK_SELECTOR).forEach((a) => {
    if (visible) a.removeAttribute('hidden');
    else a.setAttribute('hidden', '');
  });
}

function readCache() {
  try {
    return localStorage.getItem(CACHE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCache(isAdmin) {
  try {
    if (isAdmin) localStorage.setItem(CACHE_KEY, '1');
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    /* noop */
  }
}

// Dependências injetáveis para teste (onAuthChange/fetchMetrics/root).
export function gateAdminLink(deps = {}) {
  const onAuthChange = deps.onAuthChange || realOnAuthChange;
  const fetchMetrics = deps.fetchMetrics || realFetchMetrics;
  const root = deps.root || document;

  // Revela otimisticamente se já validamos admin numa sessão anterior.
  setVisible(readCache(), root);

  onAuthChange(async (user) => {
    if (!user) {
      writeCache(false);
      setVisible(false, root);
      return;
    }
    try {
      await fetchMetrics(); // 403/erro => não é admin
      writeCache(true);
      setVisible(true, root);
    } catch {
      writeCache(false);
      setVisible(false, root);
    }
  });
}
