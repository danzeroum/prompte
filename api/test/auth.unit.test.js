// Testes unitários dos helpers de auth (sem banco).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  signAccess,
  verifyAccess,
  normalizeEmail,
  EMAIL_RE,
} from '../src/auth.js';

test('hash e verify de senha', async () => {
  const h = await hashPassword('segredo123');
  assert.ok(h !== 'segredo123');
  assert.equal(await verifyPassword('segredo123', h), true);
  assert.equal(await verifyPassword('errada', h), false);
});

test('JWT access round-trip carrega sub/email/role', () => {
  const user = { id: '00000000-0000-0000-0000-000000000001', email: 'a@x.com' };
  const p = verifyAccess(signAccess(user));
  assert.equal(p.sub, user.id);
  assert.equal(p.email, 'a@x.com');
  assert.equal(p.role, 'authenticated');
});

test('verifyAccess rejeita token inválido', () => {
  assert.throws(() => verifyAccess('lixo.invalido.token'));
});

test('normalizeEmail e EMAIL_RE', () => {
  assert.equal(normalizeEmail('  A@X.com '), 'a@x.com');
  assert.ok(EMAIL_RE.test('a@b.co'));
  assert.ok(!EMAIL_RE.test('semarroba'));
});
