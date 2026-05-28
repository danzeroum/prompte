// telemetry.js — STUB de telemetria (Fase A do roadmap usará Supabase).
// Hoje apenas enfileira eventos em localStorage, sem nenhuma chamada de rede,
// preservando o caráter offline-first da ferramenta. O formato do evento já é
// o contrato que a tabela `events` do Supabase espera.

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

// Placeholder da Fase A: aqui entrará o flush via supabase-js para a tabela `events`.
export async function flush() {
  // TODO(Fase A): enviar readQueue() ao Supabase e limpar em caso de sucesso.
  return { sent: 0, pending: readQueue().length };
}
