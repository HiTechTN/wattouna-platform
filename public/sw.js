/* Wattouna Offline Workshop Service Worker (vanilla, no deps).
   - Pre-caches app shell, vendor ESM (supabase/store/graphics/sniffer),
     hardware downloads and the workbench so it runs 100% offline.
   - Strategy: cache-first for same-origin GET (pages, assets, vendor,
     downloads); network-first for Supabase API + project pages under
     /projects/ (fresh circuits win, cache falls back offline).
   - Offline navigation fallback: cached /workbench/ (the workshop). */
const VERSION = 'wattouna-v1';
const SHELL = [
  '/',
  '/workbench/',
  '/community/',
  '/profile/',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/vendor/supabase.js',
  '/vendor/wb-store.js',
  '/vendor/hardware-graphics.js',
  '/vendor/device-sniffer.js',
  '/downloads/pbx36-chassis.stl',
  '/downloads/pbx36-front-panel.stl',
  '/downloads/pbx36-wiring-guide.pdf',
  '/downloads/pbx36-complete-package.zip',
];
const API_RE = /supabase\.co|api-wattouna\.hitech\.tn|trycloudflare\.com/;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Supabase / API traffic: network first, no caching of auth payloads
  if (API_RE.test(url.hostname) || url.pathname.startsWith('/auth/')) {
    e.respondWith(fetch(request));
    return;
  }
  // Dynamic project pages: network first, cache fallback
  if (url.pathname.startsWith('/projects/')) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }
  // Everything else same-origin: cache first, populate on miss
  e.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
          }
          return res;
        }).catch(() => {
          if (request.mode === 'navigate') return caches.match('/workbench/');
          throw new Error('offline');
        }),
    ),
  );
});
