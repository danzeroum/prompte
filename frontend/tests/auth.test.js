import { jest } from '@jest/globals';

const getSupabase = jest.fn();
jest.unstable_mockModule('../assets/js/supabaseClient.js', () => ({ getSupabase }));

const { isValidEmail, signInWithEmail, initAuth, currentUser, isLoggedIn, onAuthChange } =
  await import('../assets/js/auth.js');

function fakeClient(overrides = {}) {
  return {
    auth: {
      signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
      signOut: jest.fn().mockResolvedValue({}),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(),
      ...overrides,
    },
  };
}

describe('isValidEmail', () => {
  it('valida formatos', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('sem-arroba')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('signInWithEmail', () => {
  beforeEach(() => getSupabase.mockReset());

  it('rejeita e-mail inválido sem chamar o Supabase', async () => {
    const res = await signInWithEmail('invalido');
    expect(res.ok).toBe(false);
    expect(getSupabase).not.toHaveBeenCalled();
  });

  it('envia o magic link para e-mail válido', async () => {
    const client = fakeClient();
    getSupabase.mockResolvedValue(client);
    const res = await signInWithEmail('user@example.com');
    expect(res.ok).toBe(true);
    expect(client.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com' }),
    );
  });

  it('sem Supabase configurado retorna erro', async () => {
    getSupabase.mockResolvedValue(null);
    const res = await signInWithEmail('user@example.com');
    expect(res.ok).toBe(false);
  });
});

describe('initAuth', () => {
  beforeEach(() => getSupabase.mockReset());

  it('popula o usuário a partir da sessão e notifica listeners', async () => {
    const user = { email: 'me@example.com', id: 'u1' };
    getSupabase.mockResolvedValue(
      fakeClient({ getSession: jest.fn().mockResolvedValue({ data: { session: { user } } }) }),
    );
    const seen = [];
    onAuthChange((u) => seen.push(u));
    await initAuth();
    expect(currentUser()).toEqual(user);
    expect(isLoggedIn()).toBe(true);
    expect(seen[seen.length - 1]).toEqual(user);
  });
});
