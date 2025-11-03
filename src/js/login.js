// src/js/login.js
import { postJSON as postJSONApi } from "./api.js";
import { saveToken } from "./auth.js";

// ---- Helper POST (usa lo expuesto por api.js o un fallback seguro) ----
const postJSON =
postJSONApi ||
  (_g.api && _g.api.postJSON) ||
  _g.postJSON ||
  (async function (path, body, { withCredentials = false, headers = {} } = {}) {
    // Toma la base desde api.js (window.API_BASE / window.__API_BASE__)
    const base =
      _g.API_BASE ||
      (_g.api && _g.api.API_BASE) ||
      _g.__API_BASE__ ||
      "";

    // Si no hay base, avisa para evitar que pegue al servidor estático (405)
    if (!base) {
      console.error(
        "[login] API_BASE está vacío. Define window.__API_BASE__ antes de cargar api.js (p.ej. https://tu-ngrok.ngrok-free.dev/api)"
      );
    }

    const buildUrl =
      _g.buildUrl ||
      (_g.api && _g.api.buildUrl) ||
      (p => `${base}${p.startsWith("/") ? p : `/${p}`}`);

    try {
      const res = await fetch(buildUrl(path), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body ?? {}),
        credentials: withCredentials ? "include" : "same-origin",
      });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: null };
    }
  });

// ---- DOM ----
const form = document.getElementById("formLogin");
const msg  = document.getElementById("msg"); // ✅ te faltaba

function setSectorLocal(sector) {
  const allowed = new Set(["general", "escuela", "gobierno", "empresa"]);
  const s = String(sector || "general").toLowerCase();
  localStorage.setItem("vema_sector", allowed.has(s) ? s : "general");
}

// ---- Submit ----
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "";

    const email = form.email?.value?.trim();
    const password = form.password?.value;

    if (!email || !password) {
      if (msg) msg.textContent = "Completa correo y contraseña.";
      return;
    }

    const { ok, status, data } = await postJSON("/login", { email, password });

    if (!ok) {
      if (status === 404 && data?.code === "usuario_no_encontrado") {
        if (msg) msg.textContent = "Usuario no encontrado."; return;
      }
      if (status === 401 && data?.code === "password_invalida") {
        if (msg) msg.textContent = "Contraseña incorrecta."; return;
      }
      if (status === 403 && data?.code === "usuario_inactivo") {
        if (msg) msg.textContent = "Tu usuario está inactivo."; return;
      }
      if (status === 0) {
        if (msg) msg.textContent = "No hay conexión con el servidor.";
        return;
      }
      if (msg) msg.textContent = "No se pudo iniciar sesión.";
      return;
    }

    // Login OK
    if (data?.token) saveToken(data.token);
    setSectorLocal(data?.user?.sector || "general");
    window.location.href = "./home.html";
  });
}
