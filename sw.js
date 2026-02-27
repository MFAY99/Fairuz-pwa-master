const APP_SHELL_CACHE = "cyclone-shell-v15";
const RUNTIME_CACHE = "cyclone-runtime-v15";

const STATIC_DESTINATIONS = new Set(["style", "script", "image", "font", "manifest"]);
const STATIC_PATH_PREFIXES = ["/assets/", "/vendor/", "/icons/"];

const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./offline.html",
  "./assets/tailwind.css",
  "./vendor/three.min.js",
  "./vendor/OrbitControls.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/screenshot-wide.png",
  "./icons/screenshot-mobile.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      await cache.addAll(APP_SHELL_FILES);

      // Beri tahu client bahwa ada SW baru; client memutuskan kapan update diaktifkan.
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: "SW_UPDATE_AVAILABLE" });
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      const cacheKeys = await caches.keys();
      const validKeys = new Set([APP_SHELL_CACHE, RUNTIME_CACHE]);
      await Promise.all(
        cacheKeys
          .filter((key) => !validKeys.has(key))
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data === "SKIP_WAITING" || event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isLegacyAplikasiPath(url)) {
    event.respondWith(handleLegacyAplikasiRequest(event));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  if (isStaticRequest(request)) {
    event.respondWith(handleCacheFirst(event, APP_SHELL_CACHE));
    return;
  }

  event.respondWith(handleCacheFirst(event, RUNTIME_CACHE));
});

function isLegacyAplikasiPath(url) {
  return url.pathname === "/aplikasi.html" || url.pathname === "/aplikasi";
}

async function handleLegacyAplikasiRequest(event) {
  const request = event.request;

  if (request.mode === "navigate") {
    const cached = await caches.match("./index.html");
    if (cached) return cached;
  }

  return Response.redirect(new URL("./", self.registration.scope).href, 302);
}

function isStaticRequest(request) {
  const url = new URL(request.url);
  if (STATIC_DESTINATIONS.has(request.destination)) return true;
  return STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

async function cacheResponse(cacheName, request, response) {
  if (!response || (!response.ok && response.type !== "opaque")) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

async function revalidateRequest(cacheName, request) {
  try {
    const networkResponse = await fetch(request);
    await cacheResponse(cacheName, request, networkResponse);
  } catch (_error) {
    // Tetap diam saat offline.
  }
}

async function handleCacheFirst(event, cacheName) {
  const { request } = event;
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    event.waitUntil(revalidateRequest(cacheName, request));
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    await cacheResponse(cacheName, request, networkResponse);
    return networkResponse;
  } catch (_error) {
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

async function handleNavigationRequest(event) {
  const request = event.request;
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    event.waitUntil(revalidateNavigation(event));
    return cachedResponse;
  }

  try {
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) {
      await cacheResponse(APP_SHELL_CACHE, request, preloadResponse);
      return preloadResponse;
    }

    const networkResponse = await fetch(request);
    await cacheResponse(APP_SHELL_CACHE, request, networkResponse);
    return networkResponse;
  } catch (_error) {
    return (
      (await caches.match("./index.html")) ||
      (await caches.match("./offline.html")) ||
      new Response("Offline", { status: 503, statusText: "Offline" })
    );
  }
}

async function revalidateNavigation(event) {
  const request = event.request;
  try {
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) {
      await cacheResponse(APP_SHELL_CACHE, request, preloadResponse);
      return;
    }

    const networkResponse = await fetch(request);
    await cacheResponse(APP_SHELL_CACHE, request, networkResponse);
  } catch (_error) {
    // Tetap diam saat offline.
  }
}
