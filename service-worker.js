const CACHE = "beauty-accounting-v22";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Для открытия страниц (ярлык/переходы) — сначала сеть, чтобы подтягивать обновления
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("/index.html", fresh.clone()); // обновляем закэшированный HTML
        return fresh;
      } catch (e) {
        return (await caches.match("/index.html")) || Response.error();
      }
    })());
    return;
  }

  // Для ассетов (иконки, манифест и т.п.) — cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

