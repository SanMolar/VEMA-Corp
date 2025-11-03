// src/js/api.js
export const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) || // p.ej. "https://tu-dominio.ngrok-free.dev/api"
  (['localhost','127.0.0.1'].includes(location.hostname) ? 'http://localhost:3000' : '');

function buildUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export async function postJSON(path, body, { withCredentials = false, headers = {} } = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body ?? {}),
    credentials: withCredentials ? 'include' : 'same-origin',
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}
