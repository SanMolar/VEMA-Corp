// Protege la ruta: solo ADMIN
const token = localStorage.getItem("token");
if (!token) location.href = "/pages/login.html";

import { getRoleFromToken, setupAdminNav } from "./auth.js";
setupAdminNav();
if (getRoleFromToken() !== "ADMIN") location.href = "/pages/home.html";

// Helpers
const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
};

let page = 1, limit = 10, q = "";
const $tbody = document.getElementById("users-body");
const $q = document.getElementById("q");
const $buscar = document.getElementById("buscar");
const $prev = document.getElementById("prev");
const $next = document.getElementById("next");
const $pagInfo = document.getElementById("pagInfo");

async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`, { headers });
  if (!res.ok) { alert("Error al listar usuarios"); return; }
  const { data, total } = await res.json();
  renderRows(data);
  $pagInfo.textContent = `Página ${page} — ${data.length} / ${total}`;
  $prev.disabled = page === 1;
  $next.disabled = page * limit >= total;
}

function renderRows(users) {
  $tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.email}</td>
      <td>
        <select data-id="${u.id}">
          <option ${u.role==='USER'?'selected':''}>USER</option>
          <option ${u.role==='MANAGER'?'selected':''}>MANAGER</option>
          <option ${u.role==='ADMIN'?'selected':''}>ADMIN</option>
        </select>
      </td>
      <td><button class="btn-guardar" data-id="${u.id}">Guardar</button></td>
    </tr>
  `).join("");
}

$tbody.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-guardar")) return;
  const id = e.target.getAttribute("data-id");
  const select = $tbody.querySelector(`select[data-id="${id}"]`);
  const role = select.value;

  const res = await fetch(`${API_BASE}/users/${id}/role`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ role })
  });
  if (res.status === 409) return alert("No puedes dejar sin admins");
  if (!res.ok) return alert("Error al cambiar rol");
  await fetchUsers();
});

$buscar.addEventListener("click", () => { q = $q.value.trim(); page = 1; fetchUsers(); });
$prev.addEventListener("click", () => { page = Math.max(1, page - 1); fetchUsers(); });
$next.addEventListener("click", () => { page += 1; fetchUsers(); });

fetchUsers();
