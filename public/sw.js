const CACHE_NAME = "standpunktprotokoll-multilingual-v36";
const APP_SHELL = [
  "/manifest-de.webmanifest", "/manifest-en.webmanifest", "/manifest-es.webmanifest", "/manifest-it.webmanifest", "/manifest-uk.webmanifest",
  "/fonts/DejaVuSans.ttf", "/fonts/DejaVuSans-Bold.ttf",
  "/", "/?install=v22", "/manifest-v22.webmanifest", "/favicon.svg", "/icon-192-v20.png", "/icon-512-v20.png",
  "/apple-touch-icon.png", "/apple-touch-icon-v20.png", "/apple-touch-icon-167x167-v20.png",
  "/apple-touch-icon-152x152-v20.png", "/apple-touch-icon-120x120-v20.png", "/apple-touch-icon-precomposed-v20.png", "/ait-logo.png",
];
const NETWORK_FIRST_ASSETS = new Set([
  "/manifest-de.webmanifest", "/manifest-en.webmanifest", "/manifest-es.webmanifest", "/manifest-it.webmanifest", "/manifest-uk.webmanifest",
  "/manifest-v22.webmanifest", "/icon-192-v20.png", "/icon-512-v20.png", "/apple-touch-icon.png",
  "/apple-touch-icon-v20.png", "/apple-touch-icon-167x167-v20.png", "/apple-touch-icon-152x152-v20.png",
  "/apple-touch-icon-120x120-v20.png", "/apple-touch-icon-precomposed-v20.png",
]);
// Hashed bundles and fonts never change under the same URL: serve them from cache without refetching.
const IMMUTABLE_PREFIXES = ["/assets/", "/fonts/"];
// Ignore Vary: servers may vary on Origin, which module scripts send but cache.addAll does not.
const MATCH_OPTIONS = { ignoreVary: true };

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URLS" || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter((url) => {
    try { return new URL(url).origin === self.location.origin; } catch { return false; }
  });
  event.waitUntil(caches.open(CACHE_NAME).then(async (cache) => {
    await Promise.allSettled(urls.map(async (url) => {
      const response = await fetch(url, { credentials: "same-origin" });
      if (response.ok) await cache.put(url, response.clone());
    }));
  }));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (IMMUTABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(caches.match(request, MATCH_OPTIONS).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    })));
    return;
  }
  if (NETWORK_FIRST_ASSETS.has(url.pathname)) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request, MATCH_OPTIONS).then((cached) => cached || Response.error())));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put("/", response.clone()));
      return response;
    }).catch(() => caches.match("/", MATCH_OPTIONS).then((cached) => cached || Response.error())));
    return;
  }
  event.respondWith(caches.match(request, MATCH_OPTIONS).then((cached) => {
    const network = fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => cached || Response.error());
    return cached || network;
  }));
});
