import {
  getPreferences,
  setPreference,
  exportPreferences,
  importPreferences,
} from '../assets/js/preferences.js';

describe('preferences', () => {
  beforeEach(() => localStorage.clear());

  it('retorna defaults quando vazio', () => {
    expect(getPreferences()).toEqual({ theme: null, lang: 'pt' });
  });

  it('persiste uma preferência', () => {
    setPreference('lang', 'en');
    expect(getPreferences().lang).toBe('en');
  });

  it('faz roundtrip de export/import', () => {
    setPreference('theme', 'light');
    setPreference('lang', 'en');
    const exported = exportPreferences();
    localStorage.clear();
    const restored = importPreferences(exported);
    expect(restored.theme).toBe('light');
    expect(restored.lang).toBe('en');
    expect(getPreferences().theme).toBe('light');
  });

  it('rejeita dados inválidos', () => {
    expect(() => importPreferences(null)).toThrow();
  });
});
