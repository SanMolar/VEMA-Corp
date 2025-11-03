// src/js/payments.js
import { postJSONAuth } from "./api.js";
import { clearCart } from "./cart.js";

/**
 * Sleeps ms milliseconds.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Crea la preferencia de Mercado Pago en tu backend y devuelve la URL de pago.
 * Si estamos en modo fake (localhost o window.__FAKE_PAYMENT__ === true),
 * simula un pago: muestra "Procesando", vacía el carrito y redirige a success.
 *
 * @param {Object} customer { name, email, address, city, zip }
 * @param {Array<{id:string, qty:number, name?:string, price?:number, image?:string}>} cartItems
 * @param {Object} [opts]
 * @param {boolean} [opts.test=false] - forzar modo fake
 * @returns {Promise<string>} init_point (url de checkout) OR 'SIMULATED' when simulated redirect done
 */
export async function createMpPreference(customer, cartItems, { test = false } = {}) {
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const forceFake = Boolean(window.__FAKE_PAYMENT__); // si lo defines en index.html
  const shouldFake = test || forceFake || isLocal;

  // Si queremos simular el flujo (modo desarrollo)
  if (shouldFake) {
    // 1) Opcional: valida datos mínimos
    if (!customer?.email) {
      throw new Error('Ingresa un email para simular el pago.');
    }

    // 2) Muestra overlay "Procesando pago..." en la página (simple)
    showProcessingOverlay();

    // 3) Simula espera de red / procesamiento
    await sleep(1800 + Math.floor(Math.random() * 1200));

    // 4) Vacía el carrito (usa tu helper)
    try {
      clearCart();
    } catch (e) {
      console.warn('clearCart fallo:', e);
    }

    // 5) Oculta overlay y redirige a success (o devuelve señal)
    hideProcessingOverlay();

    // redirige a home con success=1 (igual que Mercado Pago)
    // usa replaceState para no dejar el query anterior en historial si quieres:
    location.href = `${location.pathname.replace(/\/[^/]*$/, '/') || '/'}home.html?success=1`;

    // marcamos que ya redirigimos; la función no continua.
    return 'SIMULATED';
  }

  // Modo real: crea preferencia en backend
  const payload = {
    customer: {
      name: customer?.name || "",
      email: customer?.email || "",
      address: customer?.address || "",
      city: customer?.city || "",
      zip: customer?.zip || "",
    },
    cart: (cartItems || []).map(i => ({
      id: i.id,
      qty: Math.max(1, Number(i.qty || 1))
    })),
  };

  const { ok, data } = await postJSONAuth("/checkout-mp", payload);

  if (!ok || !data?.init_point) {
    const msg = data?.message || data?.error || "No se pudo crear la preferencia de pago.";
    throw new Error(msg);
  }
  return data.init_point; // URL a la que debes redirigir
}

/* ========== Overlay simple de "Procesando pago" ========== */
/* Lo incluimos aquí para que funcione sin tocar HTML. */
const OVERLAY_ID = '__vema_fake_payment_overlay__';

function showProcessingOverlay() {
  if (document.getElementById(OVERLAY_ID)) return;
  const div = document.createElement('div');
  div.id = OVERLAY_ID;
  Object.assign(div.style, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15,23,42,0.6)',
    zIndex: 99999,
    color: '#fff',
    fontFamily: 'Inter, system-ui, sans-serif'
  });

  div.innerHTML = `
    <div style="max-width:320px; text-align:center; padding:24px; border-radius:12px; background:rgba(255,255,255,0.06); backdrop-filter: blur(6px); box-shadow: 0 6px 18px rgba(2,6,23,0.5);">
      <div style="font-size:18px; font-weight:600; margin-bottom:10px;">Procesando pago...</div>
      <div style="margin-bottom:14px; opacity:0.95;">Por favor espera. Esto es una simulación de pago (modo desarrollo).</div>
      <div class="vema-spinner" style="width:48px; height:48px; margin:0 auto;">
        <svg viewBox="0 0 50 50" style="width:48px;height:48px;display:block;margin:0 auto">
          <circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.15)" stroke-width="6" fill="none"></circle>
          <path d="M45 25a20 20 0 0 1-20 20" stroke="#34d399" stroke-width="6" stroke-linecap="round" fill="none">
            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

function hideProcessingOverlay() {
  const el = document.getElementById(OVERLAY_ID);
  if (el && el.parentNode) el.parentNode.removeChild(el);
}
