// Service worker: makes the site installable and lets what has been loaded open offline.
// Network first, so a reload always gets the newest scripts when online (a cache-first worker
// would keep serving old ones); the cache is only the fallback when the network fails.
// Nothing is fetched ahead of time: the site is ~50 MB, so a file is kept once it was used.
const CACHE = 'ddcb-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;       // partial audio is not kept
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() =>
      // a link with ?deck=... opens the same page, so a page request ignores the query
      caches.match(req, { ignoreSearch: req.mode === 'navigate' })
        .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
        .then((hit) => hit || Response.error())));
});
