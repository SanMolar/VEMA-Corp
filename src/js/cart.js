// src/js/cart.js
const CART_KEY = 'vema_cart';

export function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}

export function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items ?? []));
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

// (opcional, por si lo usas en otras vistas)
export function addItem(item) {
  const list = readCart();
  list.push(item);
  writeCart(list);
}

export function removeItem(pred) { // pred = (it) => boolean
  const list = readCart().filter(it => !pred(it));
  writeCart(list);
}

export function cartCount() {
  return readCart().length;
}

export function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}

export function writeCart(list) {
  localStorage.setItem(CART_KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

export function addOrIncrement({ id, name, price, image }, qty = 1) {
  let list = readCart();
  const i = list.findIndex(it => it.id === id);
  qty   = Math.max(1, Number(qty || 1));
  price = Number(price || 0);

  if (i >= 0) {
    list[i].qty = Number(list[i].qty || 0) + qty;
  } else {
    list.push({ id, name, price, qty, image });
  }
  writeCart(list);
}

export function subtotal() {
  return readCart().reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0);
}

export function count() {
  return readCart().reduce((c, it) => c + Number(it.qty || 0), 0);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

