// api.js
export const API_BASE =
  (import.meta?.env && import.meta.env.VITE_API_URL) || "http://localhost:3000";

export async function postJSON(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null }; // fallo de red / CORS / mixed content
  }
}
