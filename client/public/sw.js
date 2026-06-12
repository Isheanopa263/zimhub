/* eslint-env serviceworker */

const CACHE_NAME = "zimhub-v1";
const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.svg"];

// Install — pre-cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Pre-cache failed:", err);
      });
    }),
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch — Network-first for API, cache-first for static
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API and uploads — always go to network
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/")
  ) {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        })
        .catch(() => {
          // Offline fallback
          if (request.mode === "navigate") {
            return caches.match("/");
          }
        });
    }),
  );
});

// Push notifications (future use)
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "ZimHub", body: event.data.text() };
  }

  const options = {
    body: data.body || "New notification",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/notifications" },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "ZimHub", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      // Focus existing tab if available
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Open new tab
      return clients.openWindow(url);
    }),
  );
});
