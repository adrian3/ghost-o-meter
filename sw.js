// Ghost-O-Meter service worker
//
// Precaches the whole app on first visit so it works offline and installs as
// a PWA. Bump CACHE_VERSION whenever any file changes; the old cache is
// removed on activate and the new files are fetched.

var CACHE_VERSION = 'ghost-o-meter-v2';

var PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/styles.css',
  './js/audio.js',
  './js/app.js',
  './js/ghost.js',
  './js/sensors.js',
  './fonts/Roskell.ttf',
  './audio/static.mp3',
  './audio/WarningBeep.mp3',
  './audio/WalkieTalkieInterference03.mp3',
  './images/0.png',
  './images/1.png',
  './images/2.png',
  './images/3.png',
  './images/4.png',
  './images/5.png',
  './images/6.png',
  './images/7.png',
  './images/8.png',
  './images/9.png',
  './images/background2.jpg',
  './images/guage-background.png',
  './images/guage-mask.png',
  './images/guage-mask-highlight.png',
  './images/home-button.png',
  './images/home-button2.png',
  './images/light-on1.png',
  './images/light-on2.png',
  './images/light-on3.png',
  './images/needle2.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_VERSION) { return caches.delete(key); }
        return null;
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Browsers fetch <audio> with Range requests. Serve those by slicing the
// cached copy so sound works offline too.
function rangeResponse(req, full) {
  var range = req.headers.get('range');
  var m = /bytes=(\d*)-(\d*)/.exec(range || '');
  return full.arrayBuffer().then(function (buf) {
    var total = buf.byteLength;
    var start = m && m[1] ? parseInt(m[1], 10) : 0;
    var end = m && m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
    if (start >= total) {
      return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + total } });
    }
    var slice = buf.slice(start, end + 1);
    var headers = new Headers(full.headers);
    headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + total);
    headers.set('Content-Length', String(slice.byteLength));
    headers.set('Accept-Ranges', 'bytes');
    return new Response(slice, { status: 206, statusText: 'Partial Content', headers: headers });
  });
}

// Cache first, then network. Anything new that comes from the network gets
// added to the cache.
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') { return; }

  if (req.headers.has('range')) {
    event.respondWith(
      caches.match(req.url, { ignoreSearch: true }).then(function (cached) {
        if (cached) { return rangeResponse(req, cached); }
        return fetch(req);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      if (cached) { return cached; }
      return fetch(req).then(function (response) {
        if (response && response.ok && new URL(req.url).origin === self.location.origin) {
          var copy = response.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
        }
        return response;
      });
    }).catch(function () {
      if (req.mode === 'navigate') { return caches.match('./index.html'); }
      return undefined;
    })
  );
});
