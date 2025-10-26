// payments.js
import { postJSONAuth } from "./api.js";

/**
 * Crea la preferencia de Mercado Pago en tu backend y devuelve la URL de pago.
 * @param {Object} customer { name, email, address, city, zip }
 * @param {Array<{id:string, qty:number}>} cartItems  // SOLO id y qty
 * @returns {Promise<string>} init_point (url de checkout)
 */
export async function createMpPreference(customer, cartItems) {
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

  const { ok, data } = await postJSONAuth("/api/checkout-mp", payload);

  if (!ok || !data?.init_point) {
    const msg = data?.message || data?.error || "No se pudo crear la preferencia de pago.";
    throw new Error(msg);
  }
  return data.init_point; // URL a la que debes redirigir
}
