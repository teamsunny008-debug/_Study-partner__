/* Study Partner service worker: makes the app work offline.
   When you change any file, raise the number in CACHE so phones fetch the new version. */
const CACHE = 'study-partner-v1';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png'
];

/* 1. Save the app files the first time */
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

/* 2. Remove old saved versions */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 3. Answer from the saved copy, and refresh it quietly in the background */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) { return; }
  event.respondWith(
    caches.match(req).then(saved => {
      const fresh = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => saved || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
      return saved || fresh;
    })
  );
});
