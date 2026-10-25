const CACHE_NAME = "standpunktprotokoll-multilingual-v35";
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

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "STORE_PDF") {
    const { url, bytes, filename } = event.data;
    const reply = event.ports?.[0];
    event.waitUntil((async () => {
      try {
        const pdfUrl = new URL(url, self.location.origin);
        if (pdfUrl.origin !== self.location.origin || !pdfUrl.pathname.startsWith("/__pdf/")) throw new Error("Invalid PDF URL");
        const safeFilename = String(filename || "Standpunktprotokoll.pdf").replace(/["\\\r\n]/g, "_");
        const response = new Response(bytes, { headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
          "Cache-Control": "no-store",
        } });
        await caches.open(CACHE_NAME).then((cache) => cache.put(pdfUrl.href, response));
        reply?.postMessage({ ok: true });
      } catch {
        reply?.postMessage({ ok: false });
      }
    })());
    return;
  }
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
  if (url.pathname.startsWith("/__pdf/")) {
    event.respondWith(caches.match(request).then((cached) => cached || new Response("PDF not found", { status: 404 })));
    return;
  }
  if (NETWORK_FIRST_ASSETS.has(url.pathname)) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || Response.error())));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put("/", response.clone()));
      return response;
    }).catch(() => caches.match("/").then((cached) => cached || Response.error())));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => {
    const network = fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => cached || Response.error());
    return cached || network;
  }));
});
