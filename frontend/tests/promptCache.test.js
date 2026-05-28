import { hashRequest, getCachedResponse } from '../assets/js/promptCache.js';

const hasSubtle = !!(globalThis.crypto && globalThis.crypto.subtle && globalThis.crypto.subtle.digest);
const maybe = hasSubtle ? it : it.skip;

describe('promptCache', () => {
  maybe('hashRequest é determinístico e independe da ordem das chaves', async () => {
    const a = await hashRequest({ temperature: 0.3, messages: [{ role: 'user', content: 'oi' }] });
    const b = await hashRequest({ messages: [{ role: 'user', content: 'oi' }], temperature: 0.3 });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  maybe('requisições diferentes geram hashes diferentes', async () => {
    const a = await hashRequest({ messages: [{ content: 'x' }], temperature: 0.3 });
    const b = await hashRequest({ messages: [{ content: 'y' }], temperature: 0.3 });
    expect(a).not.toBe(b);
  });

  it('getCachedResponse retorna null sem Supabase configurado', async () => {
    expect(await getCachedResponse({ messages: [], temperature: 0 })).toBeNull();
  });
});
