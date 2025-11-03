// src/js/api.js

/**
 * Base pública del backend.
 * - En local: http://localhost:3000
 * - En prod: usa '' y un proxy /api en tu hosting (Netlify/Vercel) o setea window.__API_BASE__
 */
export const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) ||
  (['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:3000' : '');

/**
 * Construye URLs absolutas al backend respetando API_BASE.
 * @param {string} path - Ruta del endpoint (con o sin "/")
 * @returns {string}
 */
export function buildUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

/**
 * GET JSON helper.
 * @param {string} path - p.ej. "/api/users?page=1&limit=10"
 * @param {{ withCredentials?: boolean, headers?: Record<string,string> }} [opts]
 * @returns {Promise<any>}
 */
export async function getJSON(path, { withCredentials = false, headers = {} } = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'GET',
    headers,
    credentials: withCredentials ? 'include' : 'same-origin',
  });

  // Lanza un error con info útil si no es 2xx
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${path} -> ${res.status} ${res.statusText} ${text ? `| ${text}` : ''}`.trim());
  }

  // Intenta parsear JSON, si viene vacío regresa null
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

/**
 * POST JSON helper (misma firma que ya usabas).
 * @param {string} path - p.ej. "/api/login"
 * @param {any} body - Cuerpo a serializar
 * @param {{ withCredentials?: boolean, headers?: Record<string,string> }} [opts]
 * @returns {Promise<{ok:boolean,status:number,data:any}>}
 */
export async function postJSON(path, body, { withCredentials = false, headers = {} } = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body ?? {}),
    credentials: withCredentials ? 'include' : 'same-origin',
  });

  // Intenta parsear JSON; si falla, devuelve null pero conservando ok/status
  let data = null;
  try {
    data = await res.json();
  } catch {
    // puede venir vacío o no-JSON; lo dejamos como null
  }

  return { ok: res.ok, status: res.status, data };
}

/**
 * PUT JSON helper (opcional, por si lo necesitas).
 */
export async function putJSON(path, body, { withCredentials = false, headers = {} } = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body ?? {}),
    credentials: withCredentials ? 'include' : 'same-origin',
  });
  const txt = await res.text();
  const data = txt ? JSON.parse(txt) : null;
  return { ok: res.ok, status: res.status, data };
}

/**
 * DELETE JSON helper (opcional).
 */
export async function deleteJSON(path, { withCredentials = false, headers = {} } = {}) {
  const res = await fetch(buildUrl(path), {
    method: 'DELETE',
    headers,
    credentials: withCredentials ? 'include' : 'same-origin',
  });
  const txt = await res.text();
  const data = txt ? JSON.parse(txt) : null;
  return { ok: res.ok, status: res.status, data };
}

if (typeof window !== 'undefined') {
  // Mantén un objeto global api por si hay vistas legacy que lo usan
  window.api = window.api || {};
  Object.assign(window.api, {
    API_BASE,
    buildUrl,
    getJSON,
    postJSON,
    putJSON,
    deleteJSON,
  });

  // Alias globales por si alguna vista los llama directo
  window.API_BASE ??= API_BASE;
  window.buildUrl ??= buildUrl;
  window.getJSON ??= getJSON;
  window.postJSON ??= postJSON;
  window.putJSON ??= putJSON;
  window.deleteJSON ??= deleteJSON;
}