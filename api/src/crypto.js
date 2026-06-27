// Cifragem simétrica de segredos em repouso (tokens OAuth do GitHub).
// AES-256-GCM: autenticada (deteta adulteração) e com IV aleatório por gravação.
// A chave de 32 bytes é derivada (scrypt) de GITHUB_TOKEN_KEY, ou — para não
// travar o self-host — de JWT_SECRET como fallback. Defina GITHUB_TOKEN_KEY em
// produção para isolar a chave de cifragem do segredo do JWT.
import crypto from 'node:crypto';
import { config } from './config.js';

// Sal fixo da derivação: o segredo (passphrase) é que carrega a entropia. Trocar
// o segredo invalida os blobs antigos (esperado — o usuário só reconecta o GitHub).
const SALT = 'prompte:github-token:v1';
let _key;
function key() {
  if (_key) return _key;
  const secret = config.github.tokenKey || config.jwtSecret;
  _key = crypto.scryptSync(secret, SALT, 32);
  return _key;
}

// encrypt(plaintext) → "iv.tag.ciphertext" (cada parte em base64).
export function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join('.');
}

// decrypt("iv.tag.ciphertext") → plaintext. Lança se o blob foi adulterado.
export function decrypt(blob) {
  const [ivB64, tagB64, ctB64] = String(blob).split('.');
  if (!ivB64 || !tagB64 || !ctB64) throw new Error('blob cifrado inválido');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString(
    'utf8',
  );
}
