// ZeroNegocio Service Worker
const CACHE_NAME = 'zeronegocio-v1';

const ASSETS = [
  './zeronegocio.html',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

// Install — pre-cache main app
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.add('./zeronegocio.html').then(() => {
        return Promise.allSettled(ASSETS.slice(1).map(url => cache.add(url)));
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for app, network-first for CDN
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if(url.pathname.endsWith('zeronegocio.html') || url.pathname.endsWith('/')){
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  if(url.hostname.includes('cdnjs') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')){
    event.respondWith(
      fetch(event.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
