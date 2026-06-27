// telemetry.js — telemetria offline-first.
// Eventos são enfileirados em localStorage e enviados em lote para /api/events.
// Offline (rede caída), a fila persiste — a ferramenta continua funcionando.

import { request } from './apiClient.js';

const QUEUE_KEY = 'pe-telemetry-queue';
const SESSION_KEY = 'pe-session-id';
const MAX_QUEUE = 200;

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (crypto.randomUUID && crypto.randomUUID()) ||
        `s-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'no-session';
  }
}

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function track(type, payload = {}) {
  const event = { type, sessionId: getSessionId(), payload, ts: new Date().toISOString() };
  try {
    const queue = readQueue();
    queue.push(event);
    if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* sem storage: descarta */
  }
  return event;
}

export function getQueue() {
  return readQueue();
}

export function clearQueue() {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    /* noop */
  }
}

// Envia a fila para /api/events em lote. O user_id é derivado pelo servidor a
// partir do JWT (auth:true anexa o Bearer se houver sessão). Em sucesso, remove
// só os enviados (preserva os que chegaram durante o envio).
let _flushing = false;
export async function flush() {
  if (_flushing) return { sent: 0, pending: readQueue().length };
  const queue = readQueue();
  if (!queue.length) return { sent: 0, pending: 0 };

  _flushing = true;
  try {
    const batch = queue.map((e) => ({ type: e.type, session_id: e.sessionId, payload: e.payload }));
    let res;
    try {
      res = await request('/events', { method: 'POST', auth: true, body: { events: batch } });
    } catch {
      return { sent: 0, pending: queue.length };
    }
    if (!res.ok) return { sent: 0, pending: queue.length, error: res.data && res.data.error };
    const remaining = readQueue().slice(batch.length);
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } catch {
      /* noop */
    }
    return { sent: batch.length, pending: remaining.length };
  } finally {
    _flushing = false;
  }
}
