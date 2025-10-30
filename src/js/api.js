// src/js/api.js (NO módulos: sin "export", todo queda en window)
(function () {
  // (Opcional) puedes fijar la base desde el HTML antes de cargar este archivo:
  // <script>window.__API_BASE__ = 'https://tu-backend-publico.com/api'</script>
  const fromWindow =
    (typeof window !== 'undefined' && window.__API_BASE__) || null;

  // 👇 NUEVO: tomar VITE_API_URL si Vite lo inyecta
  const fromVite =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || null;

  // ¿Estamos en local?
  const isLocalHost = ['localhost', '127.0.0.1'].includes(location.hostname);

  // 👇 DEV: si tu backend local usa /api, déjalo así; si no, quita /api
  const DEV_API  = 'http://localhost:3000/api';

  // 👇 En producción, si NO usas proxy de Netlify, esto no se usará (prioriza fromVite)
  const PROD_API = '/api';

  // URL base final (prioridad: window -> Vite -> entorno)
  const API_BASE = fromWindow || fromVite || (isLocalHost ? DEV_API : PROD_API);

  // ---- Helpers ----
  function buildUrl(path = '') {
    if (typeof path !== 'string') path = String(path ?? '');
    if (!path.startsWith('/')) path = '/' + path; // asegura slash inicial
    const url = `${API_BASE}${path}`;
    return url;
  }

  async function parseJSONSafe(res) {
    const text = await res.text();
    try { return text ? JSON.parse(text) : null; }
    catch { return { raw: text }; }
  }

  async function postJSON(path, body, { withCredentials = false, headers = {} } = {}) {
    try {
      const res = await fetch(buildUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body ?? {}),
        credentials: withCredentials ? 'include' : 'same-origin',
      });
      const data = await parseJSONSafe(res);
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: null };
    }
  }

  async function getJSON(path, { withCredentials = false, headers = {} } = {}) {
    try {
      const res = await fetch(buildUrl(path), {
        method: 'GET',
        headers,
        credentials: withCredentials ? 'include' : 'same-origin',
      });
      const data = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: null };
    }
  }

  if (typeof window !== 'undefined') {
    window.API_BASE = API_BASE;
    window.buildUrl = buildUrl;
    window.postJSON = postJSON;
    window.getJSON  = getJSON;
    window.api = { API_BASE, buildUrl, postJSON, getJSON };
  }
})();
