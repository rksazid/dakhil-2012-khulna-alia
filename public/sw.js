const CACHE_NAME = "dakhil-2012-v3";

// Core essential public pages & branding assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/funds",
  "/members",
  "/notices",
  "/gallery",
  "/login",
  "/register",
  "/offline.html",
  "/manifest.json",
  "/logo.png",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-touch-icon.png",
  "/og-banner.jpg",
];

// Install Event: Resiliently pre-cache essential pages & assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use allSettled so one transient failure doesn't break entire SW installation
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response && response.status === 200) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn("[SW] Pre-cache skipped for:", url, err);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up outdated caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Intelligent routing for Offline & Online browsing
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Ignore cross-origin requests except Google Fonts / CDNs
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFont =
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com";

  if (!isSameOrigin && !isGoogleFont) {
    return;
  }

  // Never cache authentication endpoints or sensitive actions
  if (url.pathname.startsWith("/api/auth/")) {
    return;
  }

  // 1. Navigation Requests (User clicks a link or enters a URL)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If network succeeded, dynamically update cache for this page
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: check exact match, then normalized path, then offline.html
          const cache = await caches.open(CACHE_NAME);
          const cachedPage =
            (await cache.match(request)) ||
            (await cache.match(url.pathname)) ||
            (await cache.match("/offline.html")) ||
            (await cache.match("/"));

          return cachedPage;
        })
    );
    return;
  }

  // 2. Next.js RSC Requests (Soft-navigation client payload)
  const isRscRequest =
    url.searchParams.has("_rsc") || request.headers.get("RSC") === "1";

  if (isRscRequest) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedRsc = await cache.match(request);
          if (cachedRsc) return cachedRsc;
          // Return empty JSON/text fallback if no cached RSC
          return new Response("", { status: 200, headers: { "Content-Type": "text/x-component" } });
        })
    );
    return;
  }

  // 3. Next.js Static Assets (JS Chunks, CSS, Web Fonts)
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    isGoogleFont ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/logo.png" ||
    url.pathname === "/manifest.json";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Stale-While-Revalidate: return cache immediately if available, fetch update in background
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // 4. Default GET requests (images, uploads, etc.)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Cache images/media for offline visibility
            const isMedia =
              url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i) ||
              url.pathname.startsWith("/_next/image");

            if (isMedia) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an image, fallback to logo
          if (url.pathname.match(/\.(png|jpg|jpeg|webp)$/i)) {
            return caches.match("/logo.png");
          }
          return new Response("Network error", { status: 408, statusText: "Offline" });
        });
    })
  );
});
