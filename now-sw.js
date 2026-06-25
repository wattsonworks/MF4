/* michal-now PWA service worker — caches the app shell, never the live API */
const C = "mfnow-v2";
const SHELL = ["now.html", "assets/img/logo.png", "now.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;                          // POSTs (likes/comments) → network
  if (url.hostname.indexOf("michal-now") > -1) return;             // live API → always network
  if (url.hostname.indexOf("fonts.") > -1) return;                 // Google fonts → network/own cache
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
      if (resp && resp.status === 200 && url.origin === location.origin) {
        const copy = resp.clone(); caches.open(C).then(c => c.put(e.request, copy));
      }
      return resp;
    }).catch(() => caches.match("now.html")))                      // offline fallback = app shell
  );
});
