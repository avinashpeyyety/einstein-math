/* Einstein Math service worker — caches app shell + curriculum + panels for offline play */
const CACHE = 'einstein-math-v2.4.8';
// W1b: on-device comic-avatar model (~40 MB) is cached on first use only, and kept across app versions
const MODEL_CACHE = 'einstein-math-models-v1';
// X2: subject packs (data/subjects/<id>.json). math is precached (default subject, offline after first visit);
// any other pack is cached here on first use, served cache-first and refreshed in the background when online
const PACK_CACHE = 'einstein-math-packs-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/comic.css',
  './js/storage.js',
  './js/backup.js',
  './js/subjects.js',
  './js/comicify.js',
  './js/einstein.js',
  './js/student.js',
  './js/app.js',
  './data/subjects/math.json',
  './assets/einstein.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon.svg',
  './assets/panels/idle.png',
  './assets/panels/explain.png',
  './assets/panels/cheer.png',
  './assets/panels/think.png',
  './assets/student/portrait.jpg',
  './assets/student/panels/think.png',
  './assets/student/panels/cheer.png',
  './assets/student/panels/explain.png',
  './assets/student/panels/idle.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== MODEL_CACHE && k !== PACK_CACHE).map((k) => caches.delete(k)))
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

  // Subject packs: this version's precache first, then the pack cache; refresh the pack cache when online
  if (url.pathname.includes('/data/subjects/')) {
    event.respondWith(
      caches.open(CACHE).then((c) => c.match(req)).then((pre) => {
        if (pre) return pre;
        return caches.open(PACK_CACHE).then((pc) => pc.match(req).then((hit) => {
          const refresh = fetch(req).then((res) => {
            if (res && res.ok) pc.put(req, res.clone());
            return res;
          });
          if (hit) {
            event.waitUntil(refresh.catch(() => {}));
            return hit;
          }
          return refresh;
        }));
      })
    );
    return;
  }

  // X4: physics sim code (js/sims/*) is lazy — never precached, so math-only visits don't download it.
  // Cache-first in this version's cache on first use (offline after the first lab), replaced on the next version.
  if (url.pathname.includes('/js/sims/')) {
    event.respondWith(
      caches.open(CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) c.put(req, res.clone());
        return res;
      })))
    );
    return;
  }

  // Comic-avatar model files: cache-first in their own long-lived cache (never precached)
  if (url.pathname.includes('/vendor/mediapipe/')) {
    event.respondWith(
      caches.open(MODEL_CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) c.put(req, res.clone());
        return res;
      })))
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
