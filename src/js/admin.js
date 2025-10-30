// src/js/admin.js — versión con diagnóstico y tolerante a formatos

const $tbody = document.getElementById("users-body");
const $empty = document.getElementById("empty");

// 1) Helpers
function row(u) {
  const created = u.created_at || u.createdAt || u.created || null;
  return `
    <tr class="border-t border-slate-100">
      <td class="px-4 py-3 font-medium">${u.email ?? "-"}</td>
      <td class="px-4 py-3">${u.role ?? "-"}</td>
      <td class="px-4 py-3 text-slate-500 text-sm">
        ${created ? new Date(created).toLocaleString() : "-"}
      </td>
    </tr>
  `;
}

function showEmpty(msg = "No hay usuarios registrados.") {
  $tbody.innerHTML = "";
  if ($empty) { $empty.textContent = msg; $empty.classList.remove("hidden"); }
}

function skeleton() {
  $tbody.innerHTML = `
    <tr class="border-t border-slate-100">
      <td class="px-4 py-3"><div class="h-4 w-48 bg-slate-100 rounded animate-pulse"></div></td>
      <td class="px-4 py-3"><div class="h-4 w-20 bg-slate-100 rounded animate-pulse"></div></td>
      <td class="px-4 py-3"><div class="h-4 w-32 bg-slate-100 rounded animate-pulse"></div></td>
    </tr>
  `;
  if ($empty) $empty.classList.add("hidden");
}

// 2) Carga
async function loadUsers() {
  skeleton();

  // Si tienes token, lo mandamos; si no, no pasa nada.
  const token = localStorage.getItem("token");
  const headers = token ? { "Authorization": `Bearer ${token}` } : {};

  // Endpoint: API_BASE sale de src/js/api.js (asegúrate de cargarlo antes)
  const url = `${API_BASE}/users`;
  console.log("[admin] GET", url);

  try {
    const res = await fetch(url, { headers });
    console.log("[admin] status", res.status);

    // Intentamos leer el cuerpo (si no es JSON válido, caerá al catch)
    const json = await res.json().catch(() => null);
    console.log("[admin] json", json);

    if (!res.ok) {
      // 404 = ruta incorrecta (probablemente /api extra o falta)
      // 401/403 = backend pide auth o no autoriza
      showEmpty(`Error HTTP ${res.status}. Revisa la consola.`);
      return;
    }

    // Aceptar varios formatos
    let list = [];
    if (Array.isArray(json)) list = json;
    else if (json && Array.isArray(json.data)) list = json.data;
    else if (json && Array.isArray(json.users)) list = json.users;
    else if (json && Array.isArray(json.rows)) list = json.rows;

    if (!list.length) {
      showEmpty();
      return;
    }

    if ($empty) $empty.classList.add("hidden");
    $tbody.innerHTML = list.map(row).join("");

  } catch (e) {
    console.error("[admin] fallo fetch:", e);
    showEmpty("No se pudo cargar la lista. Revisa la consola.");
  }
}

// 3) Init
loadUsers();
