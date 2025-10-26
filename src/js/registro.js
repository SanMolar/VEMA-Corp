import { postJSON } from "./api.js";
import { saveToken } from "./auth.js";

const form = document.getElementById("formRegister");
const msg  = document.getElementById("msg"); // opcional <p id="msg">

// Para recordar el sector en el front
function setSectorLocal(sector) {
  const allowed = new Set(["general", "escuela", "gobierno", "empresa"]);
  const s = String(sector || "general").toLowerCase();
  localStorage.setItem("vema_sector", allowed.has(s) ? s : "general");
}

// Pre-llenar email si viene en query
const params = new URLSearchParams(window.location.search);
const preEmail = params.get("email");

if (form) {
  if (preEmail && form.email) form.email.value = preEmail;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "";

    const email = form.email?.value?.trim();
    const password = form.password?.value;
    const confirm = form.confirm_password?.value;

    // Lee el sector desde los radios (name="tipo")
    const sel = document.querySelector('input[name="tipo"]:checked');
    const rawSector = sel ? sel.value : "general"; // "escuela" | "gobierno" | "empresa"
    const sector = String(rawSector || "general").toLowerCase();

    if (typeof confirm !== "undefined" && password !== confirm) {
      if (msg) msg.textContent = "Las contraseñas no coinciden.";
      return;
    }

    if (!email || !password) {
      if (msg) msg.textContent = "Completa correo y contraseña.";
      return;
    }

    // Enviamos también el sector al backend
    const { ok, status, data } = await postJSON("/api/register", { email, password, sector });

    if (!ok) {
      if (status === 409 && data?.code === "email_ya_registrado") {
        if (msg) msg.textContent = "Este correo ya está registrado. Ve a iniciar sesión.";
        return;
      }
      if (msg) msg.textContent = "No se pudo crear la cuenta.";
      return;
    }

    // Registro OK: guardar token y sector y redirigir
    if (data?.token) {
      saveToken(data.token);
      setSectorLocal(data?.user?.sector || sector || "general");
      window.location.href = "./home.html";
    } else {
      // fallback en caso de que no devuelva token
      setSectorLocal(sector);
      window.location.href = "./login.html";
    }
  });
}
