import { jest } from '@jest/globals';

const request = jest.fn();
jest.unstable_mockModule('../assets/js/apiClient.js', () => ({ request }));

const { hashRequest, getCachedResponse } = await import('../assets/js/promptCache.js');

const hasSubtle = !!(
  globalThis.crypto &&
  globalThis.crypto.subtle &&
  globalThis.crypto.subtle.digest
);
const maybe = hasSubtle ? it : it.skip;

describe('promptCache', () => {
  beforeEach(() => request.mockReset());

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

  maybe('getCachedResponse retorna a resposta em hit (200)', async () => {
    request.mockResolvedValue({ status: 200, data: { response: { content: 'oi', model: 'm' } } });
    expect(await getCachedResponse({ messages: [], temperature: 0 })).toEqual({
      content: 'oi',
      model: 'm',
    });
  });

  maybe('getCachedResponse retorna null em miss (404)', async () => {
    request.mockResolvedValue({ status: 404, data: { error: 'miss' } });
    expect(await getCachedResponse({ messages: [], temperature: 0 })).toBeNull();
  });

  it('getCachedResponse retorna null se a rede/hash falhar', async () => {
    request.mockRejectedValue(new Error('network'));
    expect(await getCachedResponse({ messages: [], temperature: 0 })).toBeNull();
  });
});
