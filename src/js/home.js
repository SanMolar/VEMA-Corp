/* src/js/home.js — precios por sector + modo single/bulk + MP */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const money = (n) => Number(n || 0).toLocaleString("es-MX");
const API_BASE = "http://localhost:3000";

/* --------- Estado de sesión/sector --------- */
// Guarda este sector en login/registro: localStorage.setItem("vema_sector", sector)
const sector = (localStorage.getItem("vema_sector") || "general").toLowerCase();
// Modo de compra: 'single' o 'bulk'
let mode = "single";

/* ----------------------------- Elementos ------------------------------- */
const els = {
  // Badge de tipo de cuenta (opcional en tu HTML)
  accountBadge: $("#account-badge"),

  // Toggle de modo (solo empresa/gobierno)
  bulkControls: $("#bulk-controls"),
  btnSingle: $("#btn-single"),
  btnBulk: $("#btn-bulk"),

  // Precio principal (lo vamos a sobreescribir con preview)
  priceSpans: $$("[data-product-price]"),

  // Carrito y drawer
  cartBtns: $$("#btn-cart, [data-open-cart]"),
  cartBadge: $("#cart-badge"),
  cartDrawer: $("#cart-drawer"),
  cartBackdrop: $("#cart-backdrop"),
  cartClose: $("#cart-close"),
  cartList: $("#cart-list"),
  cartSubtotal: $("#cart-subtotal"),
  cartTotal: $("#cart-total"),
  cartClear: $("#cart-clear"),
  cartCheckout: $("#cart-checkout"),

  qty: $("#qty"),
  qtyDec: $("#qty-dec"),
  qtyInc: $("#qty-inc"),
  addBtns: $$("#add-to-cart, [data-add-to-cart]"),

  // Galería
  galleryMain: $("#gallery-main"),
  thumbs: $$(".thumb"),

  // Checkout
  checkout: $("#checkout"),
  checkoutClose: $("#checkout-close"),
  checkoutForm: $("#checkout-form"),
  summaryList: $("#summary-list"),
  summarySubtotal: $("#summary-subtotal"),
  summaryTotal: $("#summary-total"),
  checkoutSuccess: $("#checkout-success"),
};

function setAccountBadge() {
  if (!els.accountBadge) return;
  const map = { escuela: "Escuela", gobierno: "Gobierno", empresa: "Empresa", general: "General" };
  els.accountBadge.textContent = `Tipo de cuenta: ${map[sector] || "General"}`;
}

/* ------------------------------ Estado -------------------------------- */
const CART_KEY = "vema_cart";
let cart = loadCart();

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* ---------- Preview de precios (sector + modo) ---------- */
async function pricingPreview(lines) {
  const res = await fetch(`${API_BASE}/api/pricing-preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sector, mode, cart: lines }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    const msg = data?.message || data?.error || "No se pudo obtener precios.";
    throw new Error(msg);
  }
  return data.pricing;
}

async function updateMainPrice() {
  // qty del selector principal (página producto):
  let qty = Number(els.qty && els.qty.value ? els.qty.value : 1);
  if (!Number.isFinite(qty) || qty < 1) qty = 1;

  // Reglas de UI:
  if (sector === "escuela") qty = 1; // fuerza 1
  if (els.qty) els.qty.value = qty;

  const lines = [{ id: "hidrocheck", qty }];
  const pricing = await pricingPreview(lines);

  const item = pricing.items?.[0];
  const unit = item?.unit_net ?? 0;
  els.priceSpans.forEach((s) => (s.textContent = money(unit)));
}

async function updateCartPricingUI() {
  if (!els.cartList) return;
  const lines = cart.map((c) => ({ id: c.id, qty: c.qty }));
  if (!lines.length) {
    els.cartSubtotal && (els.cartSubtotal.textContent = money(0));
    els.cartTotal && (els.cartTotal.textContent = money(0));
    return;
  }
  try {
    const pricing = await pricingPreview(lines);
    const total = pricing.totals?.total ?? 0;
    els.cartSubtotal && (els.cartSubtotal.textContent = money(total));
    els.cartTotal && (els.cartTotal.textContent = money(total));
  } catch {
    // ignore
  }
}

/* --------------------------- Render carrito ---------------------------- */
function renderCart() {
  if (!els.cartList) return;

  els.cartList.innerHTML = "";
  if (cart.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "Tu carrito está vacío. Agrega productos para continuar.";
    els.cartList.appendChild(empty);
  } else {
    cart.forEach((item, idx) => {
      const row = document.createElement("div");
      row.innerHTML = `
        <img src="${item.image || '/imagenes/hidrocheck-main.jpg'}" alt="${item.name}">
        <div>
          <div>${item.name}</div>
          <div class="text-xs text-slate-500">Cantidad: ${item.qty}</div>
        </div>
        <div>
          <button data-act="dec" data-i="${idx}">−</button>
          <input data-act="qty" data-i="${idx}" value="${item.qty}" min="1" />
          <button data-act="inc" data-i="${idx}">+</button>
        </div>
        <div class="w-24 text-right"></div>
        <button data-act="remove" data-i="${idx}" title="Quitar">✕</button>
      `;
      els.cartList.appendChild(row);
    });
  }

  const count = cart.reduce((a, b) => a + b.qty, 0);
  els.cartBadge && (els.cartBadge.textContent = count);

  saveCart();
  updateCartPricingUI();
}

/* ------------------------- Operaciones carrito ------------------------- */
function setCartQtyExact(productId, qty, name, image) {
  const idx = cart.findIndex((x) => x.id === productId);
  if (idx >= 0) {
    cart[idx].qty = qty;
    if (name) cart[idx].name = name;
    if (image) cart[idx].image = image;
  } else {
    cart.push({ id: productId, name: name || "Producto", image: image || "", qty });
  }
}

function addCurrentProductToCart() {
  let qty = Number(els.qty && els.qty.value ? els.qty.value : 1);
  if (!Number.isFinite(qty) || qty < 1) qty = 1;
  if (sector === "escuela") qty = 1;

  const name = "HidroCheck TDS-3";
  const image = $("#gallery-main")?.src || "/imagenes/hidrocheck-main.jpg";
  const id = "hidrocheck";

  const existing = cart.find((x) => x.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id, name, image, qty });

  renderCart();
  openCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

/* --------------------------- UI del carrito ---------------------------- */
function openCart() {
  if (!els.cartDrawer || !els.cartBackdrop) return;
  els.cartDrawer.style.transform = "translateX(0)";
  els.cartBackdrop.style.opacity = "1";
  els.cartBackdrop.style.pointerEvents = "auto";
}
function closeCart() {
  if (!els.cartDrawer || !els.cartBackdrop) return;
  els.cartDrawer.style.transform = "translateX(100%)";
  els.cartBackdrop.style.opacity = "0";
  els.cartBackdrop.style.pointerEvents = "none";
}

els.cartBtns.forEach((b) => b.addEventListener("click", openCart));
els.cartClose && els.cartClose.addEventListener("click", closeCart);
els.cartBackdrop && els.cartBackdrop.addEventListener("click", closeCart);
els.checkoutClose && els.checkoutClose.addEventListener("click", closeCheckout);

// opcional: cerrar con tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCheckout();
});


if (els.cartList) {
  els.cartList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const i = Number(btn.dataset.i);
    if (Number.isNaN(i) || !cart[i]) return;

    const act = btn.dataset.act;
    if (act === "inc") cart[i].qty++;
    else if (act === "dec") cart[i].qty = Math.max(1, cart[i].qty - 1);
    else if (act === "remove") cart.splice(i, 1);

    if (sector === "escuela") {
      let totalQty = cart.reduce((a, b) => a + b.qty, 0);
      if (totalQty > 1) {
        alert("Las cuentas de Escuela solo pueden comprar 1 pieza por pedido.");
        cart = [{ ...cart[0], qty: 1 }];
      }
    }

    renderCart();
  });

  els.cartList.addEventListener("input", (e) => {
    const input = e.target.closest('input[data-act="qty"]');
    if (!input) return;
    const i = Number(input.dataset.i);
    let v = Number(input.value || 1);
    if (!Number.isFinite(v) || v < 1) v = 1;
    cart[i].qty = v;

    if (sector === "escuela") {
      alert("Las cuentas de Escuela solo pueden comprar 1 pieza por pedido.");
      cart[i].qty = 1;
    }

    renderCart();
  });
}

els.cartClear && els.cartClear.addEventListener("click", clearCart);

/* ------------------------------ Qty UI --------------------------------- */
function clampQty() {
  if (!els.qty) return;
  let v = Number(els.qty.value || 1);
  if (!Number.isFinite(v) || v < 1) v = 1;
  if (sector === "escuela") v = 1;
  els.qty.value = v;
}
els.qtyInc && els.qtyInc.addEventListener("click", () => {
  clampQty();
  if (sector === "escuela") return; // no incrementa
  els.qty.value = Number(els.qty.value) + 1;
  updateMainPrice().catch(() => {});
});
els.qtyDec && els.qtyDec.addEventListener("click", () => {
  clampQty();
  if (sector === "escuela") return;
  els.qty.value = Math.max(1, Number(els.qty.value) - 1);
  updateMainPrice().catch(() => {});
});
els.qty && els.qty.addEventListener("input", () => {
  clampQty();
  updateMainPrice().catch(() => {});
});

els.addBtns.forEach((b) => b.addEventListener("click", addCurrentProductToCart));

/* ------------------------------ Galería -------------------------------- */
els.thumbs.forEach((img) =>
  img.addEventListener("click", () => {
    if (els.galleryMain) els.galleryMain.src = img.src;
  })
);

/* ------------------------- Checkout (pantalla) -------------------------- */
function openCheckout() {
  closeCart();
  if (!els.checkout || !els.summaryList) return;

  els.summaryList.innerHTML = "";
  if (cart.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No hay productos en el carrito.";
    els.summaryList.appendChild(empty);
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.innerHTML = `
      <div>
        <img src="${item.image || '/imagenes/hidrocheck-main.jpg'}" alt="${item.name}">
        <div>
          <div>${item.name}</div>
          <div>x${item.qty}</div>
        </div>
      </div>
      <div></div>
    `;
    els.summaryList.appendChild(row);
  });

  pricingPreview(cart.map(c => ({ id: c.id, qty: c.qty })))
    .then(p => {
      els.summarySubtotal && (els.summarySubtotal.textContent = money(p.totals?.total ?? 0));
      els.summaryTotal && (els.summaryTotal.textContent = money(p.totals?.total ?? 0));
    })
    .catch(() => {});

  els.checkout.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function closeCheckout() {
  if (els.checkout) els.checkout.classList.add("hidden");
}

els.cartCheckout && els.cartCheckout.addEventListener("click", openCheckout);

/* ---------------- Mercado Pago: crear preferencia ----------------------- */
async function createMpPreference(customer, cartItems) {
  const res = await fetch(`${API_BASE}/api/checkout-mp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer, cart: cartItems, sector, mode }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) throw new Error(data?.message || data?.error || "No se pudo crear la preferencia.");
  return data.url;
}
function getCartForBackend() {
  return cart.map(x => ({ id: x.id, qty: x.qty }));
}

if (els.checkoutForm) {
  els.checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!cart.length) return alert("Tu carrito está vacío.");

    if (sector === "escuela") {
      const totalQty = cart.reduce((a, b) => a + b.qty, 0);
      if (totalQty > 1) return alert("Las cuentas de Escuela solo pueden comprar 1 pieza por pedido.");
    }

    const fd = new FormData(els.checkoutForm);
    const customer = {
      name:    fd.get("name")    || "",
      email:   fd.get("email")   || "",
      address: fd.get("address") || "",
      city:    fd.get("city")    || "",
      zip:     fd.get("zip")     || "",
    };

    try {
      const mpUrl = await createMpPreference(customer, getCartForBackend());
      window.location.href = mpUrl;
    } catch (err) {
      alert(`No se pudo iniciar el pago: ${err.message}`);
    }
  });
}

/* ----------------- Controles de modo (single/bulk) --------------------- */
function setupModeControls() {
  setAccountBadge();

  // Solo empresa/gobierno ven el switch
  const canBulk = sector === "empresa" || sector === "gobierno" || sector === "general";
  if (els.bulkControls) {
    els.bulkControls.style.display = canBulk ? "" : "none";
  }
  if (!canBulk) {
    mode = "single";
  }

  // Escuela: bloquear input de qty a 1
  if (sector === "escuela" && els.qty) {
    els.qty.value = 1;
    els.qty.setAttribute("readonly", "readonly");
  }

  // === LÓGICA NUEVA ===
  // Comprar 1 -> fija 1 pieza, modo single y abre carrito
  if (els.btnSingle) {
    els.btnSingle.addEventListener("click", () => {
      mode = "single";
      const name = "HidroCheck TDS-3";
      const image = $("#gallery-main")?.src || "/imagenes/hidrocheck-main.jpg";
      setCartQtyExact("hidrocheck", 1, name, image);
      renderCart();
      openCart();
      // estilos
      els.btnSingle.classList.add("bg-slate-900","text-white");
      els.btnBulk && els.btnBulk.classList.remove("bg-slate-900","text-white");
      updateMainPrice().catch(() => {});
    });
  }

  // Comprar varios -> pide cantidad, valida mínimo (2) y abre carrito en modo bulk
  if (els.btnBulk) {
    els.btnBulk.addEventListener("click", () => {
      if (!(sector === "empresa" || sector === "gobierno" || sector === "general")) {
        return alert("Solo empresas o gobierno pueden comprar por mayoreo.");
      }
      const min = 2; // umbral de mayoreo (coincide con backend)
      let qStr = prompt(`¿Cuántas piezas deseas comprar? (mínimo ${min})`, "2");
      if (qStr === null) return; // cancelado
      let qty = parseInt(qStr, 10);
      if (!Number.isFinite(qty) || qty < min) {
        alert(`La cantidad mínima por mayoreo es ${min}.`);
        return;
      }

      mode = "bulk";
      const name = "HidroCheck TDS-3";
      const image = $("#gallery-main")?.src || "/imagenes/hidrocheck-main.jpg";
      setCartQtyExact("hidrocheck", qty, name, image);

      // UI + precios
      renderCart();
      openCart();

      // estilos
      els.btnBulk.classList.add("bg-slate-900","text-white");
      els.btnSingle && els.btnSingle.classList.remove("bg-slate-900","text-white");

      // Actualizar precio principal (unitario bulk) por si el usuario vuelve al hero
      updateMainPrice().catch(() => {});
    });
  }
}

/* ------------------------------ Init ----------------------------------- */
setupModeControls();
renderCart();
updateMainPrice().catch(()=>{});
