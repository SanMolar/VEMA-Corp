// api.js
export const API_BASE = "http://localhost:3000";

export async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // cuerpo vacío o error de parseo
  }
  return { ok: res.ok, status: res.status, data };
}
