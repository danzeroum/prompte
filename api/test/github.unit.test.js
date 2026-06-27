// Testes unitários da conexão GitHub: cifragem do token e state OAuth.
// Definimos o ambiente ANTES de importar os módulos (config lê process.env no load).
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.GITHUB_CLIENT_ID = 'client-id';
process.env.GITHUB_CLIENT_SECRET = 'client-secret';
process.env.GITHUB_CALLBACK_URL = 'https://app.example/api/github/callback';
process.env.GITHUB_TOKEN_KEY = 'token-encryption-key';

const { encrypt, decrypt } = await import('../src/crypto.js');
const { isEnabled, signState, verifyState, authorizeUrl } = await import('../src/github.js');
const jwt = (await import('jsonwebtoken')).default;

test('crypto: encrypt/decrypt faz round-trip', () => {
  const secret = 'gho_exampletoken1234567890';
  const blob = encrypt(secret);
  assert.notEqual(blob, secret); // não vaza em texto puro
  assert.equal(blob.split('.').length, 3); // iv.tag.ciphertext
  assert.equal(decrypt(blob), secret);
});

test('crypto: dois encrypts do mesmo valor diferem (IV aleatório)', () => {
  assert.notEqual(encrypt('abc'), encrypt('abc'));
});

test('crypto: blob adulterado falha na verificação de integridade', () => {
  const blob = encrypt('segredo');
  const [iv, tag, ct] = blob.split('.');
  const tampered = [iv, tag, Buffer.from('outro').toString('base64')].join('.');
  assert.throws(() => decrypt(tampered));
});

test('github: isEnabled true quando clientId+secret+callback presentes', () => {
  assert.equal(isEnabled(), true);
});

test('github: signState/verifyState faz round-trip do userId', () => {
  const uid = '11111111-2222-3333-4444-555555555555';
  assert.equal(verifyState(signState(uid)), uid);
});

test('github: verifyState rejeita token sem typ gh_state', () => {
  const bad = jwt.sign({ typ: 'other' }, process.env.JWT_SECRET, { subject: 'x' });
  assert.throws(() => verifyState(bad));
});

test('github: authorizeUrl carrega client_id, redirect_uri, scope e state', () => {
  const url = new URL(authorizeUrl('the-state'));
  assert.equal(url.searchParams.get('client_id'), 'client-id');
  assert.equal(url.searchParams.get('redirect_uri'), process.env.GITHUB_CALLBACK_URL);
  assert.equal(url.searchParams.get('scope'), 'repo');
  assert.equal(url.searchParams.get('state'), 'the-state');
});
