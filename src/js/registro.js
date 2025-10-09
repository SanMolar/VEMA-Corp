// registro.js
import { postJSON } from "./api.js";
import { saveToken } from "./auth.js";

const form = document.getElementById("formRegister");
const msg = document.getElementById("msg"); // si tienes un <p id="msg">

// Pre-llenar email si venimos de login
const params = new URLSearchParams(window.location.search);
const preEmail = params.get("email");

if (form) {
  if (preEmail && form.email) form.email.value = preEmail;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg && (msg.textContent = "");

    const email = form.email.value.trim();
    const password = form.password.value;

    // (Opcional) confirmar contraseña si tienes confirm_password
    const confirm = form.confirm_password?.value;
    if (typeof confirm !== "undefined" && password !== confirm) {
      msg && (msg.textContent = "Las contraseñas no coinciden.");
      return;
    }

    if (!email || !password) {
      msg && (msg.textContent = "Completa correo y contraseña.");
      return;
    }

    const { ok, status, data } = await postJSON("/api/register", { email, password });

    if (!ok) {
      if (status === 409 && data?.code === "email_ya_registrado") {
        msg && (msg.textContent = "Este correo ya está registrado. Ve a iniciar sesión.");
        return;
      }
      msg && (msg.textContent = "No se pudo crear la cuenta.");
      return;
    }

    // Registro OK: auto-login (ya te devuelve token) o redirige a login
    if (data?.token) {
      saveToken(data.token);
      window.location.href = "./home.html"; // o dashboard privado si luego lo agregas
    } else {
      window.location.href = "./index.html"; // fallback
    }
  });
}
