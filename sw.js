/* Energie-Optimierer – Service Worker
   Ziel: Offline nutzbar + beim Neustart (online) immer die frische Version.
   Strategie: Navigation/HTML = network-first, statische Assets = cache-first,
   API-Aufrufe (Preise/Sonne/Adresse) = immer direkt aus dem Netz (nie cachen). */
const CACHE = "energie-optimierer-v23";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Externe Datenquellen: immer live, nichts cachen
  if (/awattar\.|forecast\.solar|open-meteo\.com|nominatim\./.test(url.hostname)) return;

  // Seiten-Navigation: erst Netz (frische Version), sonst Cache
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(m => m || caches.match("./index.html")))
    );
    return;
  }

  // Eigene statische Assets: erst Cache, sonst Netz (und nachladen)
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then(m => m || fetch(req).then(r => {
        const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r;
      }))
    );
  }
});
