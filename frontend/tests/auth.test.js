import { jest } from '@jest/globals';

const request = jest.fn();
const getSession = jest.fn();
const setSession = jest.fn();
const clearSession = jest.fn();
jest.unstable_mockModule('../assets/js/apiClient.js', () => ({
  request,
  getSession,
  setSession,
  clearSession,
}));

const { isValidEmail, signIn, signUp, initAuth, currentUser, isLoggedIn, onAuthChange } =
  await import('../assets/js/auth.js');

describe('isValidEmail', () => {
  it('valida formatos', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('sem-arroba')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('signIn', () => {
  beforeEach(() => {
    request.mockReset();
    setSession.mockReset();
  });

  it('rejeita e-mail inválido sem chamar a API', async () => {
    const res = await signIn('invalido', 'x');
    expect(res.ok).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it('loga com e-mail e senha válidos e persiste a sessão', async () => {
    request.mockResolvedValue({
      status: 200,
      data: {
        access_token: 'a',
        refresh_token: 'r',
        user: { id: 'u1', email: 'user@example.com' },
      },
    });
    const res = await signIn('user@example.com', 'segredo123');
    expect(res.ok).toBe(true);
    expect(request).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(setSession).toHaveBeenCalled();
  });

  it('credenciais inválidas retornam erro', async () => {
    request.mockResolvedValue({ status: 401, data: { error: 'E-mail ou senha inválidos' } });
    const res = await signIn('user@example.com', 'errada');
    expect(res.ok).toBe(false);
  });
});

describe('signUp', () => {
  beforeEach(() => {
    request.mockReset();
    setSession.mockReset();
  });

  it('cadastra e já loga (201)', async () => {
    request.mockResolvedValue({
      status: 201,
      data: { access_token: 'a', refresh_token: 'r', user: { id: 'u2', email: 'new@example.com' } },
    });
    const res = await signUp('new@example.com', 'segredo123');
    expect(res.ok).toBe(true);
    expect(request).toHaveBeenCalledWith(
      '/auth/signup',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('initAuth', () => {
  beforeEach(() => {
    request.mockReset();
    getSession.mockReset();
  });

  it('popula o usuário a partir de /auth/me e notifica listeners', async () => {
    const user = { email: 'me@example.com', id: 'u1' };
    getSession.mockReturnValue({ access: 'a', refresh: 'r' });
    request.mockResolvedValue({ status: 200, data: { user } });
    const seen = [];
    onAuthChange((u) => seen.push(u));
    await initAuth();
    expect(currentUser()).toEqual(user);
    expect(isLoggedIn()).toBe(true);
    expect(seen[seen.length - 1]).toEqual(user);
  });
});
