// promptHistory.js — histórico local dos últimos prompts gerados (#M14).
// Guarda no localStorage (offline-first, sem rede) os últimos MAX itens com
// template, conteúdo e timestamp, para consulta/reuso pelo usuário.

const KEY = 'pe-prompt-history';
const MAX = 20;

export function getPromptHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

// Adiciona um prompt ao topo do histórico (mais recente primeiro). Ignora
// conteúdo vazio. Retorna a lista atualizada.
export function addPromptToHistory(template, content) {
  const text = String(content || '').trim();
  if (!text) return getPromptHistory();
  const entry = { template: String(template || ''), content: text, ts: new Date().toISOString() };
  const list = [entry, ...getPromptHistory()].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* sem storage: ignora */
  }
  return list;
}

export function clearPromptHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
