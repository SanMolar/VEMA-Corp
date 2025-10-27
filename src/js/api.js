// src/js/api.js

// (Opcional) puedes sobreescribir la URL desde el HTML antes de cargar este archivo:
// <script>window.__API_BASE__ = 'https://tu-backend-publico.com'</script>
const fromWindow =
  (typeof window !== 'undefined' && window.__API_BASE__) || null;

// ¿Estamos en local?
const isLocalHost = ['localhost', '127.0.0.1'].includes(location.hostname);

// Base por entorno
const DEV_API  = 'http://localhost:3000'; // backend local
const PROD_API = '/api';                   // en Netlify se proxyará al backend público

// URL final (prioridad: window -> local -> prod)
export const API_BASE = fromWindow || (isLocalHost ? DEV_API : PROD_API);

// --- Helpers de fetch ---
async function parseJSONSafe(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; }
  catch { return { raw: text }; }
}

export async function postJSON(path, body, { withCredentials = false } = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      credentials: withCredentials ? 'include' : 'same-origin',
    });
    const data = await parseJSONSafe(res);
    return { ok: res.ok, status: res.status, data };
  } catch {
    // error de red / CORS / proxy
    return { ok: false, status: 0, data: null };
  }
}

export async function getJSON(path, { withCredentials = false } = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      credentials: withCredentials ? 'include' : 'same-origin',
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}
