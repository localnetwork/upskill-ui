/* Upskill service worker: offline-first caching. Registered from components/partials/OfflineProvider.jsx */
// The app version comes from the registration URL so each release gets fresh caches.
const params = new URL(self.location.href).searchParams;
const VERSION = params.get("v") || "v1";
const STATIC_CACHE = `upskill-static-${VERSION}`;
const PAGES_CACHE = `upskill-pages-${VERSION}`;
const API_CACHE = `upskill-api-${VERSION}`;
// Not versioned: user-downloaded lessons must survive deploys.
const MEDIA_CACHE = "upskill-media";
// Images (including next/image's /_next/image and remote CDN/API uploads) persist across deploys.
const IMAGE_CACHE = "upskill-images";
const IMAGE_CACHE_MAX_ENTRIES = 300;
const OFFLINE_URL = "/offline";
const NETWORK_TIMEOUT_MS = 6000;

const API_BASE = params.get("api") || "";
const API_ORIGIN = API_BASE ? new URL(API_BASE).origin : "";
const API_PATH = API_BASE ? new URL(API_BASE).pathname.replace(/\/$/, "") : "";

// Never cache auth flows, tokens, or live/telemetry endpoints.
const API_DENYLIST = [
  "/auth",
  "/stream-token",
  "/earnings",
  "/payments",
  "/checkout",
  "/socket.io",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = [STATIC_CACHE, PAGES_CACHE, API_CACHE, MEDIA_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith("upskill-") && !keep.includes(n))
            .map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// Cached copies are only a fallback while the device is offline; online requests always hit the network
// (responses are still written to the cache so they are available later).
const isOnline = () => self.navigator.onLine !== false;

async function networkFirst(request, cacheName, timeoutMs = NETWORK_TIMEOUT_MS) {
  const cache = await caches.open(cacheName);
  try {
    const pending = fetch(request);
    const response = await (isOnline() ? pending : withTimeout(pending, timeoutMs));
    if (
      response &&
      response.ok &&
      response.type !== "opaque" &&
      !response.redirected
    ) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (isOnline()) throw error;
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  const response = await refresh;
  if (response) return response;
  return Response.error();
}

async function matchIgnoringQuery(request, cache) {
  return (
    (await cache.match(request)) ||
    (await cache.match(request.url, { ignoreSearch: true }))
  );
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const pending = fetch(request);
    const response = await (isOnline()
      ? pending
      : withTimeout(pending, NETWORK_TIMEOUT_MS));
    if (response && response.ok && !response.redirected) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (isOnline()) throw error;
    // Same page cached under another query string (e.g. ?lecture=) still works offline.
    const cached = await matchIgnoringQuery(request, cache);
    if (cached) return cached;
    throw error;
  }
}

async function serveNavigation(request) {
  try {
    return await networkFirstPage(request);
  } catch {
    const cache = await caches.open(PAGES_CACHE);
    return (
      (await cache.match(OFFLINE_URL)) ||
      new Response("You are offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
}

// <video> requests byte ranges, which Cache API does not slice for us.
async function serveMedia(request, cached) {
  const range = request.headers.get("range");
  if (!range) return cached;
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const buffer = await cached.arrayBuffer();
  const total = buffer.byteLength;
  let start = match && match[1] ? parseInt(match[1], 10) : 0;
  let end = match && match[2] ? parseInt(match[2], 10) : total - 1;
  if (match && !match[1] && match[2]) {
    start = Math.max(total - parseInt(match[2], 10), 0);
    end = total - 1;
  }
  end = Math.min(end, total - 1);
  if (start > end || start >= total) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}` },
    });
  }
  return new Response(buffer.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": cached.headers.get("Content-Type") || "video/mp4",
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
    },
  });
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  const overflow = keys.length - maxEntries;
  for (let i = 0; i < overflow; i += 1) await cache.delete(keys[i]);
}

// Cache-first with background refresh. Opaque (no-cors cross-origin) responses are stored too,
// so remote images keep rendering offline.
async function imageStaleWhileRevalidate(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache
          .put(request, response.clone())
          .then(() => trimCache(cache, IMAGE_CACHE_MAX_ENTRIES))
          .catch(() => {});
      }
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  const response = await refresh;
  return response || Response.error();
}

function isImageRequest(request, url) {
  return (
    request.destination === "image" ||
    url.pathname === "/_next/image" ||
    /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/i.test(url.pathname)
  );
}

function isApiCacheable(url) {
  if (!API_ORIGIN || url.origin !== API_ORIGIN) return false;
  const path = url.pathname.startsWith(API_PATH)
    ? url.pathname.slice(API_PATH.length)
    : url.pathname;
  return !API_DENYLIST.some((prefix) => path.startsWith(prefix));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  event.respondWith(
    (async () => {
      const mediaCache = await caches.open(MEDIA_CACHE);
      const downloaded = await mediaCache.match(request.url);
      if (downloaded) return serveMedia(request, downloaded);

      if (request.mode === "navigate") return serveNavigation(request);

      if (isImageRequest(request, url)) return imageStaleWhileRevalidate(request);

      if (url.origin === self.location.origin) {
        if (url.pathname.startsWith("/_next/data/")) {
          return networkFirstPage(request);
        }
        if (
          url.pathname.startsWith("/_next/static/") ||
          url.pathname.startsWith("/fonts/") ||
          url.pathname.startsWith("/images/") ||
          /\.(?:png|jpe?g|webp|svg|ico|woff2?)$/.test(url.pathname)
        ) {
          return staleWhileRevalidate(request, STATIC_CACHE);
        }
        return fetch(request);
      }

      if (isApiCacheable(url)) return networkFirst(request, API_CACHE);

      return fetch(request);
    })(),
  );
});
