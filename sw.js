const CACHE = "mi-reto-78kg-v3";
const PREFIX = "mi-reto-78kg-";

const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

// Instalar el nuevo Service Worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );

  self.skipWaiting();
});

// Activar la nueva versión y limpiar cachés anteriores de esta aplicación
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith(PREFIX) && key !== CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Gestionar las solicitudes de archivos
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // No interceptar solicitudes de otros dominios
  if (url.origin !== self.location.origin) return;

  // Para páginas HTML, intentar primero obtener la versión del servidor
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE).then(cache =>
              cache.put("./index.html", copy)
            );
          }

          return response;
        })
        .catch(() => caches.match("./index.html"))
    );

    return;
  }

  // Para los demás archivos, utilizar la caché si está disponible
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE).then(cache =>
            cache.put(request, copy)
          );
        }

        return response;
      });

      return cached || network;
    })
  );
});
