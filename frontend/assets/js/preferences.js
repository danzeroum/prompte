// preferences.js — preferências do usuário persistidas em localStorage.
// Hoje guarda tema e idioma; é o ponto de extensão para sincronização
// futura com o backend (Supabase, Fase D do roadmap).

export const PREFS_KEY = 'pe-prefs';

const DEFAULTS = {
  theme: null, // null = seguir o sistema (prefers-color-scheme)
  lang: 'pt',
};

export function getPreferences() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setPreference(key, value) {
  const prefs = getPreferences();
  prefs[key] = value;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* localStorage indisponível (modo privado): ignora silenciosamente */
  }
  return prefs;
}

// Exporta as preferências como objeto serializável (para download em JSON).
export function exportPreferences() {
  return { version: 1, exportedAt: new Date().toISOString(), prefs: getPreferences() };
}

// Restaura preferências a partir de um objeto importado. Aceita tanto o
// envelope { prefs: {...} } quanto o objeto de prefs cru. Retorna as prefs aplicadas.
export function importPreferences(data) {
  const incoming = data && data.prefs ? data.prefs : data;
  if (!incoming || typeof incoming !== 'object') {
    throw new Error('Arquivo de preferências inválido');
  }
  const merged = { ...DEFAULTS };
  if (incoming.theme === 'light' || incoming.theme === 'dark' || incoming.theme === null) {
    merged.theme = incoming.theme;
  }
  if (typeof incoming.lang === 'string') merged.lang = incoming.lang;
  localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
  return merged;
}
