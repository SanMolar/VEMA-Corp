// login.js
import { postJSON } from "./api.js";
import { saveToken } from "./auth.js";

// Ajusta si tu login no es index.html
const form = document.getElementById("formLogin");
const msg = document.getElementById("msg"); // opcional si lo tienes

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg && (msg.textContent = "");

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      msg && (msg.textContent = "Completa correo y contraseña.");
      return;
    }

    const { ok, status, data } = await postJSON("/api/login", { email, password });

    if (!ok) {
      // Decidir según "code" que manda el backend
      if (status === 404 && data?.code === "usuario_no_encontrado") {
        // Manda a registro
        window.location.href = "./registro.html?email=" + encodeURIComponent(email);
        return;
      }
      if (status === 401 && data?.code === "password_invalida") {
        msg && (msg.textContent = "Contraseña incorrecta.");
        return;
      }
      msg && (msg.textContent = "No se pudo iniciar sesión.");
      return;
    }

    // Login OK: guarda token y redirige
    if (data?.token) saveToken(data.token);
    window.location.href = "./home.html"; // o tu ruta privada/dashboard cuando lo tengas
  });
}
