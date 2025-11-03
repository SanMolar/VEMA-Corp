// /src/js/admin.js
import { getJSON, postJSON } from './api.js';

/* -------------------- Utils -------------------- */
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));

function toast(msg, type = 'ok') {
  const box = $('#toast');
  if (!box) return;
  const el = document.createElement('div');
  el.className =
    'rounded-lg px-3 py-2 text-sm shadow ' +
    (type === 'ok'
      ? 'bg-green-600 text-white'
      : 'bg-rose-600 text-white');
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

/* ----------------- Skeleton ON/OFF -------------- */
// NOTA: Los <tr> skeleton llevan data-skel en el HTML y NO se borran del DOM.
function showSkeleton(show = true) {
  $$('#users-body [data-skel]').forEach(tr => {
    tr.hidden = !show; // sin tocar style; no revienta si no hay nodos
  });
}

/* --------------- Pintado de usuarios ------------- */
// Importante: quitamos SOLO filas de datos previas (.row-user),
// nunca tocamos los <tr data-skel>.
function renderUsers(users = []) {
  const tbody = $('#users-body');
  // limpia filas anteriores de datos
  $$('.row-user', tbody).forEach(el => el.remove());

  const frag = document.createDocumentFragment();

  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.className = 'row-user border-t border-slate-100';

    tr.innerHTML = `
      <td class="px-4 py-3">${u.email}</td>
      <td class="px-4 py-3">
        <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
          u.role === 'ADMIN'
            ? 'bg-green-100 text-green-700'
            : 'bg-slate-100 text-slate-700'
        }">${u.role}</span>
      </td>
      <td class="px-4 py-3">
        <button
          class="btn-role rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          data-id="${u.id}"
          data-email="${u.email}"
          data-role="${u.role}"
        >
          Cambiar rol
        </button>
      </td>
    `;
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);

  // Vacío
  $('#empty')?.classList.toggle('hidden', (users?.length || 0) > 0);
}

/* ------------------- Carga ---------------------- */
let state = { page: 1, q: '' };

async function loadUsers(page = state.page, q = state.q) {
  state.page = page;
  state.q = q;

  showSkeleton(true);
  try {
    const resp = await getJSON(
      `/api/users?page=${page}&limit=8&q=${encodeURIComponent(q)}`
    );
    renderUsers(resp?.data || []);
    $('#pagInfo').textContent = `Página ${page}`;
  } catch (e) {
    console.error(e);
    toast('Error cargando usuarios', 'err');
  } finally {
    showSkeleton(false);
  }
}

/* --------------- Cambiar rol -------------------- */
async function changeRole(userId, currentRole, email) {
  const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
  if (!confirm(`¿Cambiar el rol de ${email} a ${nextRole}?`)) return;

  // deshabilita el botón mientras guarda
  const btn = document.querySelector(`.btn-role[data-id="${CSS.escape(String(userId))}"]`);
  const old = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }

  try {
    const r = await postJSON('/api/users/role', { id: userId, role: nextRole });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    toast('Rol actualizado', 'ok');
    await loadUsers(); // recarga la tabla
  } catch (e) {
    console.error(e);
    toast('Error al actualizar el rol', 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = old ?? 'Cambiar rol'; }
  }
}

/* --------------- Eventos ------------------------ */
// Delegación para botones "Cambiar rol"
$('#users-body').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-role');
  if (!btn) return;
  const id    = Number(btn.dataset.id);
  const email = btn.dataset.email || '';
  const role  = btn.dataset.role  || 'USER';
  changeRole(id, role, email);
});

// Buscar
$('#buscar')?.addEventListener('click', () => {
  const q = ($('#q')?.value || '').trim();
  loadUsers(1, q);
});

// Paginación simple
$('#prev')?.addEventListener('click', () => {
  if (state.page > 1) loadUsers(state.page - 1, state.q);
});
$('#next')?.addEventListener('click', () => {
  loadUsers(state.page + 1, state.q);
});

// Inicial
document.addEventListener('DOMContentLoaded', () => {
  loadUsers(1, '');
});
