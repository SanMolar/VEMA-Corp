/* sw.js — VEMA Corp PWA */
const SW_VERSION = 'v1.0.1';

const STATIC_CACHE  = `static-${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-${SW_VERSION}`;

/* 🧱 Archivos disponibles sin conexión */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/src/pages/login.html',
  '/src/pages/home.html',
  '/manifest.json',
  '/offline.html',
  '/src/js/api.js',
  '/src/js/login.js',
  '/src/js/auth.js',
  '/imagenes/landing-page.webp',
  '/imagenes/landing-page2.webp.webp',
  '/imagenes/landing-page3.webp.webp',
  '/imagenes/landing-page4.webp.webp'
];

/* ⚙️ INSTALL: precache */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

/* 🧹 ACTIVATE: limpia versiones viejas */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== STATIC_CACHE && k !== RUNTIME_CACHE) {
            return caches.delete(k);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* 🌐 FETCH */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 🚫 Nunca intentes cachear/interceptar métodos que no sean GET
  if (req.method !== 'GET') {
    // Deja pasar la request directamente a la red
    event.respondWith(fetch(req));
    return;
  }

  // Navegación (páginas): intenta red, cae a offline.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Solo API GET → network-first
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Estáticos propios (mismo origen) → cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Recursos externos (CDN, etc.) → network-first con cache suave
  event.respondWith(networkFirst(req));
});

/* Estrategias */
async function cacheFirst(req) {
  const cached = await caches.match(req, { ignoreSearch: false });
  if (cached) return cached;

  const res = await fetch(req);
  // Solo cachea respuestas OK y del mismo origen
  if (res && res.status === 200 && req.method === 'GET') {
    const runtime = await caches.open(RUNTIME_CACHE);
    runtime.put(req, res.clone());
  }
  return res;
}

async function networkFirst(req) {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(req);
    // Solo cachea si es OK y GET
    if (res && res.status === 200 && req.method === 'GET') {
      runtime.put(req, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await runtime.match(req);
    if (cached) return cached;
    // Para API GET: último recurso JSON
    if (req.headers.get('accept')?.includes('application/json')) {
      return new Response(JSON.stringify({ ok: false, offline: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
      });
    }
    // Para otros recursos: intenta offline.html si es HTML
    if (req.headers.get('accept')?.includes('text/html')) {
      const offline = await caches.match('/offline.html');
      if (offline) return offline;
    }
    throw err;
  }
}
