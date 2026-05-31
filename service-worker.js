// Service worker til Lydlab — gør appen tilgængelig offline.
// Strategi: "network-first" for HTML (så opdateringer fanges når der er internet),
// "cache-first" for andre filer (ikon m.m.).

const CACHE_NAME = 'lydlab-v1';
const ASSETS = [
  './',
  './lydlab.html',
  './manifest.json',
  './icon.svg'
];

// Installer: download og cache alle nødvendige filer
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Aktivér: ryd gamle caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Hent: HTML hentes fra nettet (med cache som fallback);
// andre filer hentes fra cache (med netværk som fallback).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isHtml = req.mode === 'navigate' ||
                 req.headers.get('accept')?.includes('text/html');

  if (isHtml) {
    // Network-first for HTML
    event.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./lydlab.html')))
    );
  } else {
    // Cache-first for alt andet
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        return res;
      }))
    );
  }
});
