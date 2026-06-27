// adminGate.test.js — valida o gate de visibilidade do link Admin/Métricas:
// oculto por padrão, revelado só para admin (probe na função metrics), e cache.

import { jest } from '@jest/globals';
import { gateAdminLink } from '../assets/js/adminGate.js';

function setupDom() {
  document.body.innerHTML = '<a class="sb-item" href="/admin.html" hidden>Admin</a>';
  return document.querySelector('a[href="/admin.html"]');
}

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('gateAdminLink', () => {
  it('mantém oculto sem usuário autenticado', () => {
    const link = setupDom();
    let cb;
    gateAdminLink({ onAuthChange: (fn) => (cb = fn), fetchMetrics: jest.fn() });
    expect(link.hasAttribute('hidden')).toBe(true);
    cb(null);
    expect(link.hasAttribute('hidden')).toBe(true);
  });

  it('revela quando o probe de metrics tem sucesso (admin)', async () => {
    const link = setupDom();
    let cb;
    const fetchMetrics = jest.fn().mockResolvedValue({});
    gateAdminLink({ onAuthChange: (fn) => (cb = fn), fetchMetrics });
    await cb({ email: 'admin@x.com' });
    expect(fetchMetrics).toHaveBeenCalled();
    expect(link.hasAttribute('hidden')).toBe(false);
    expect(localStorage.getItem('pe:isAdmin')).toBe('1');
  });

  it('mantém oculto quando o probe falha (403 / não-admin)', async () => {
    const link = setupDom();
    let cb;
    const err = new Error('forbidden');
    err.status = 403;
    gateAdminLink({
      onAuthChange: (fn) => (cb = fn),
      fetchMetrics: jest.fn().mockRejectedValue(err),
    });
    await cb({ email: 'user@x.com' });
    expect(link.hasAttribute('hidden')).toBe(true);
    expect(localStorage.getItem('pe:isAdmin')).toBeNull();
  });

  it('revela otimisticamente no load quando há cache de admin', () => {
    localStorage.setItem('pe:isAdmin', '1');
    const link = setupDom();
    gateAdminLink({ onAuthChange: () => {}, fetchMetrics: jest.fn() });
    expect(link.hasAttribute('hidden')).toBe(false);
  });

  it('logout limpa o cache e oculta o link', async () => {
    localStorage.setItem('pe:isAdmin', '1');
    const link = setupDom();
    let cb;
    gateAdminLink({ onAuthChange: (fn) => (cb = fn), fetchMetrics: jest.fn() });
    expect(link.hasAttribute('hidden')).toBe(false); // otimista
    await cb(null); // logout
    expect(link.hasAttribute('hidden')).toBe(true);
    expect(localStorage.getItem('pe:isAdmin')).toBeNull();
  });
});
