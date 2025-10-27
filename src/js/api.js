// src/js/api.js

// (opcional) puedes fijar la base desde el HTML:
// <script>window.__API_BASE__ = 'https://tu-backend-publico.com/api'</script>
const fromWindow =
  (typeof window !== 'undefined' && window.__API_BASE__) || null;

const isLocalHost = ['localhost', '127.0.0.1'].includes(location.hostname);

// ⚠️ Si tu backend usa prefijo /api en sus rutas, deja DEV_API con /api al final
const DEV_API  = 'http://localhost:3000/api'; // <-- nota el /api aquí
const PROD_API = '/api';                      // Netlify lo proxyará a tu backend

export const API_BASE = fromWindow || (isLocalHost ? DEV_API : PROD_API);

// Helpers
function buildUrl(path = '') {
  if (typeof path !== 'string') path = String(path ?? '');
  if (!path.startsWith('/')) path = '/' + path; // asegura slash inicial
  const url = `${API_BASE}${path}`;
  console.log('[api] →', url); // quita este log cuando confirmes
  return url;
}

async function parseJSONSafe(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; }
  catch { return { raw: text }; }
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
