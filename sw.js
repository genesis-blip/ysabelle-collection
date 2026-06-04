const CACHE_NAME = 'blush-pwa-v3';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // ── API / Supabase requests: ALWAYS go to network, never cache
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // ── App shell: network first, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Update cache with fresh response
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
  );
});
