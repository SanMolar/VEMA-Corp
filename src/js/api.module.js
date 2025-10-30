// src/js/api.module.js
const g = typeof window !== 'undefined' ? window : globalThis;

// Toma de window.api si existe; si no, de las globals individuales
export const API_BASE = g.api?.API_BASE ?? g.API_BASE;
export const buildUrl = g.api?.buildUrl ?? g.buildUrl;
export const postJSON = g.api?.postJSON ?? g.postJSON;
export const getJSON  = g.api?.getJSON  ?? g.getJSON;

if (!postJSON || !buildUrl) {
  throw new Error('api.js debe cargarse antes que api.module.js');
}

export default { API_BASE, buildUrl, postJSON, getJSON };
