import { postJSON } from "./api.js";
import { saveToken } from "./auth.js";

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

    const { ok, status, data } = await postJSON("/login", { email, password });

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
