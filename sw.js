/* Einstein Math service worker — caches app shell + curriculum + panels for offline play */
const CACHE = 'einstein-math-v2.3.0';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/comic.css',
  './js/storage.js',
  './js/einstein.js',
  './js/app.js',
  './data/curriculum.json',
  './assets/einstein.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon.svg',
  './assets/panels/idle.png',
  './assets/panels/explain.png',
  './assets/panels/cheer.png',
  './assets/panels/think.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML navigations so updates land; fall back to cache offline
  const isNav = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isNav) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for app shell assets; populate cache on miss when online
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req));
    })
  );
});
