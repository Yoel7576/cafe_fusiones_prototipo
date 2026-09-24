const CACHE_NAME = "cafe-fusiones-modular-v10";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./pages/landing.html",
  "./pages/landing-laboratorio.html",
  "./pages/landing-nosotros.html",
  "./pages/landing-menu.html",
  "./pages/landing-trazabilidad.html",
  "./pages/landing-lote.html",
  "./pages/landing-galeria.html",
  "./pages/landing-contacto.html",
  "./pages/login.html",
  "./pages/dashboard.html",
  "./pages/ventas.html",
  "./pages/caja.html",
  "./pages/inventario.html",
  "./pages/clientes.html",
  "./pages/reportes.html",
  "./pages/admin.html",
  "./pages/configuracion.html",
  "./pages/notificaciones.html",
  "./pages/ventas-pedido.html",
  "./pages/ventas-kds.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("./pages/login.html")))
  );
});
