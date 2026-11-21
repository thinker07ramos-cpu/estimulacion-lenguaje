const CACHE_NAME = "vozvisual-cache-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
self.addEventListener("push", (event) => {
  let datos = {
    title: "VozVisual",
    body: "Tienes una nueva actividad o recordatorio disponible.",
    url: "/estimulacion-lenguaje/"
  };

  if (event.data) {
    try {
      const recibido = event.data.json();
      datos = { ...datos, ...recibido };
    } catch (error) {
      datos.body = event.data.text() || datos.body;
    }
  }

  const opciones = {
    body: datos.body,
    icon: "icons/icon-192x192.png",
    badge: "icons/icon-72x72.png",
    data: {
      url: datos.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(datos.title, opciones)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const destinoUrl =
    (event.notification.data && event.notification.data.url) ||
    "/estimulacion-lenguaje/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanaList) => {
      for (const ventana of ventanaList) {
        if (ventana.url.includes("/estimulacion-lenguaje/") && "focus" in ventana) {
          return ventana.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(destinoUrl);
      }
    })
  );
});
