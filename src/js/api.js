// src/js/api.js

const fromWindow =
  (typeof window !== 'undefined' && window.__API_BASE__) || null;

const isLocalHost = ['localhost', '127.0.0.1'].includes(location.hostname);
const DEV_API  = 'http://localhost:3000';
const PROD_API = '/api';
export const API_BASE = fromWindow || (isLocalHost ? DEV_API : PROD_API);

// Quita prefijo /api si alguien lo pasa por error y asegura el slash inicial
function normalizePath(path = '') {
  if (typeof path !== 'string') path = String(path ?? '');
  if (path.startsWith('http')) return path;       // URL absoluta → respeta
  if (path.startsWith('/api/')) path = path.slice(4); // evita /api/api/...
  if (!path.startsWith('/')) path = '/' + path;
  return path;
}

// (opcional) ayuda a depurar qué URL estás llamando
function buildUrl(path) {
  const p = normalizePath(path);
  const url = `${API_BASE}${p}`;
  console.log('[api] →', url); // quítalo cuando confirmes
  return url;
}

async function parseJSONSafe(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return { raw: text }; }
}

export async function postJSON(path, body, { withCredentials = false } = {}) {
  try {
    const res = await fetch(buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      credentials: withCredentials ? 'include' : 'same-origin',
    });
    const data = await parseJSONSafe(res);
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export async function getJSON(path, { withCredentials = false } = {}) {
  try {
    const res = await fetch(buildUrl(path), {
      method: 'GET',
      credentials: withCredentials ? 'include' : 'same-origin',
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}
