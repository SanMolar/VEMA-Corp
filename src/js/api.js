// src/js/api.js

// Puedes sobreescribir desde HTML si quieres:
// <script>window.__API_BASE__ = 'https://mi-backend.com'</script>
const fromWindow = (typeof window !== 'undefined' && window.__API_BASE__) || null;

// ¿Estás trabajando en local?
const isLocalHost = ['localhost', '127.0.0.1'].includes(location.hostname);

// URLs base por entorno
const DEV_API  = 'http://localhost:3000';
const PROD_API = '/api'; // en Netlify lo proxyaremos a tu backend público

// BASE FINAL (prioridad: window -> local/prod)
export const API_BASE = fromWindow || (isLocalHost ? DEV_API : PROD_API);

// Helpers
export async function postJSON(path, body, { withCredentials = false } = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      credentials: withCredentials ? 'include' : 'same-origin',
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

    return { ok: res.ok, status: res.status, data };
  } catch {
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
