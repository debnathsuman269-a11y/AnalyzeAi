const CACHE_NAME = "trade-ajay-v2";

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "https://cdn.tailwindcss.com",
  "https://cdn-icons-png.flaticon.com/512/3310/3310624.png",
  "https://aistudiocdn.com/react@^19.2.0",
  "https://aistudiocdn.com/react-dom@^19.2.0",
  "https://aistudiocdn.com/@google/genai@^1.30.0",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return Promise.all(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("Failed to cache:", url, err);
          })
        )
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  // Navigation requests -> offline fallback to index.html
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Other requests: cache-first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      const fetchRequest = event.request.clone();
      return fetch(fetchRequest).then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          (networkResponse.type !== "basic" &&
            networkResponse.type !== "cors")
        ) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === "GET") {
            cache.put(event.request, responseToCache);
          }
        });

        return networkResponse;
      });
    })
  );
});
