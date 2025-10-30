// src/js/login.js
import { saveToken } from "./auth.js";

// ── Fallback robusto para postJSON (NO rompe nada de lo tuyo) ──
const _g = typeof window !== "undefined" ? window : globalThis;
const postJSON =
  (_g.api && _g.api.postJSON) ||
  _g.postJSON ||
  // 🔁 Fallback mínimo por si api.js no cargó a tiempo
  (async function (path, body, { withCredentials = false, headers = {} } = {}) {
    const base = _g.API_BASE || (_g.api && _g.api.API_BASE) || "";
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

// (Opcional) avisa en consola si se está usando el fallback
if (!(_g.api?.postJSON || _g.postJSON)) {
  console.warn("[login] postJSON usando fallback (verifica que /src/js/api.js cargue antes)");
}

const form = document.getElementById("formLogin");
const msg  = document.getElementById("msg"); // opcional <p id="msg">

function setSectorLocal(sector) {
  const allowed = new Set(["general", "escuela", "gobierno", "empresa"]);
  const s = String(sector || "general").toLowerCase();
  localStorage.setItem("vema_sector", allowed.has(s) ? s : "general");
}

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

    // Llama al helper (nativo o fallback)
    const { ok, status, data } = await postJSON("/login", { email, password });
    // Si usas cookies/sesiones y necesitas enviar credenciales:
    // const { ok, status, data } = await postJSON("/login", { email, password }, { withCredentials: true });

    if (!ok) {
      if (status === 404 && data?.code === "usuario_no_encontrado") {
        if (msg) msg.textContent = "Usuario no encontrado.";
        return;
      }
      if (status === 401 && data?.code === "password_invalida") {
        if (msg) msg.textContent = "Contraseña incorrecta.";
        return;
      }
      if (status === 403 && data?.code === "usuario_inactivo") {
        if (msg) msg.textContent = "Tu usuario está inactivo.";
        return;
      }
      if (msg) msg.textContent = "No se pudo iniciar sesión.";
      return;
    }

    // Login OK
    if (data?.token) {
      saveToken(data.token);
    }

    // Guarda el sector en localStorage (para precios/vistas)
    setSectorLocal(data?.user?.sector || "general");

    // Redirige a la home (o dashboard)
    window.location.href = "./home.html";
  });
}
