 const TOKEN_KEY = "vema_token";

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Lee el token y obtiene el rol
export function getRoleFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
    return payload.role || null;
  } catch {
    return null;
  }
}

// Muestra enlace "Usuarios" solo a ADMIN
export function setupAdminNav() {
  const role = getRoleFromToken();
  const el = document.getElementById("nav-admin");
  if (el) el.style.display = role === "ADMIN" ? "inline-block" : "none";
}
