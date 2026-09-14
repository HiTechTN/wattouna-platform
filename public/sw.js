/* Wattouna Offline Workshop Service Worker (vanilla, no deps) — v2 hardened.
   Fixes for airplane-mode launch failures:
   - start_url '/' (+ '/index.html', '/offline.html') explicitly precached;
   - tolerant precache: one bad URL no longer aborts the whole install;
   - NavigationRoute: exact match → ignoreSearch match → /offline.html;
     the browser NEVER sees its offline error screen for app routes.
   Strategies:
   - cache-first: same-origin pages/assets/vendor/downloads (offline workshop);
   - network-first: Supabase API + /projects/ dynamic pages (fresh wins);
   - API/auth traffic is never cached. */
const VERSION = 'wattouna-v5';
const SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/workbench/',
  '/community/',
  '/components/',
  '/profile/',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/vendor/supabase.js',
  '/vendor/wb-store.js',
  '/vendor/hardware-graphics.js',
  '/vendor/device-sniffer.js',
  '/vendor/local-ai.js',
  '/vendor/three-viewer.js',
  '/vendor/web-flasher.js',
  '/vendor/github-sync.js',
  '/downloads/pbx36-chassis.stl',
  '/downloads/pbx36-front-panel.stl',
  '/downloads/pbx36-wiring-guide.pdf',
  '/downloads/pbx36-complete-package.zip',
];
const API_RE = /supabase\.co|api-wattouna\.hitech\.tn|trycloudflare\.com/;

async function precache() {
  const cache = await caches.open(VERSION);
  const results = await Promise.all(
    SHELL.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        await cache.put(url, res);
        return [url, true];
      } catch (e) {
        return [url, false];
      }
    }),
  );
  const failed = results.filter(([, ok]) => !ok).map(([url]) => url);
  if (failed.length) console.warn('[wattouna-sw] precache skipped:', failed.join(', '));
  return failed;
}

function notifyClients(msg) {
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((cs) => {
    cs.forEach((c) => { try { c.postMessage(msg); } catch (e) {} });
  });
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    precache().then(() => {
      notifyClients({ type: 'WATTOUNA_CACHED', version: VERSION });
      return self.skipWaiting();
    }),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Robust navigation response: exact → ignoreSearch → offline shell. */
async function navigationFallback(request) {
  const cache = await caches.open(VERSION);
  return (
    (await cache.match(request)) ||
    (await cache.match(request, { ignoreSearch: true })) ||
    (await cache.match('/offline.html')) ||
    (await cache.match('/workbench/')) ||
    Response.error()
  );
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Supabase / API traffic: network only, never cached
  if (API_RE.test(url.hostname) || url.pathname.startsWith('/auth/')) {
    e.respondWith(fetch(request));
    return;
  }
  const isPage =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');
  // Dynamic project pages: network first, cache fallback
  if (url.pathname.startsWith('/projects/')) {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => navigationFallback(request)),
    );
    return;
  }
  if (isPage) {
    // App shell navigations: network first for freshness, GUARANTEED fallback
    e.respondWith(fetch(request)
      .then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => navigationFallback(request)));
    return;
  }
  // Static assets: cache first, populate on miss
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
        }),
    ),
  );
});
