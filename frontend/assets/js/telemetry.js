// telemetry.js — telemetria offline-first.
// Eventos são enfileirados em localStorage e enviados em lote à tabela
// `events` do Supabase via flush(). Sem configuração de Supabase (ou offline),
// a fila simplesmente persiste — a ferramenta continua funcionando.

import { getSupabase } from './supabaseClient.js';

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

// type: string (ex.: 'pageview', 'generate', 'copy'); payload: objeto livre.
export function track(type, payload = {}) {
  const event = {
    type,
    sessionId: getSessionId(),
    userId: null, // preenchido quando houver auth (Fase D)
    payload,
    ts: new Date().toISOString(),
  };
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

// Mapeia o evento da fila para a linha da tabela `events`.
function toRow(event) {
  return {
    type: event.type,
    session_id: event.sessionId,
    user_id: event.userId,
    payload: event.payload,
    created_at: event.ts,
  };
}

// Envia a fila para o Supabase em lote. Em caso de sucesso remove os eventos
// enviados (preservando os que chegaram durante o envio). Sem cliente
// configurado, retorna os pendentes sem erro.
let _flushing = false;
export async function flush() {
  if (_flushing) return { sent: 0, pending: readQueue().length };
  const queue = readQueue();
  if (!queue.length) return { sent: 0, pending: 0 };

  const client = await getSupabase();
  if (!client) return { sent: 0, pending: queue.length };

  _flushing = true;
  try {
    const batch = queue.slice();
    const { error } = await client.from('events').insert(batch.map(toRow));
    if (error) return { sent: 0, pending: queue.length, error: error.message };
    // Remove apenas os que foram enviados; mantém eventos novos.
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
