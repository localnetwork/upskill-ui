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

// Self-contained fallback (no external assets) used when /offline isn't cached.
const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>You're offline | Upskill</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
    font-family:'Inter','Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;
    background:linear-gradient(145deg,#f8fafc 0%,#f1f5f9 100%);color:#0f172a}
  body:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.35;
    background-image:radial-gradient(circle at 1px 1px,#cbd5e1 1px,transparent 0);background-size:28px 28px}
  .card{position:relative;width:100%;max-width:420px;background:#fff;border-radius:20px;text-align:center;overflow:hidden;
    box-shadow:0 4px 6px -1px rgba(0,0,0,.05),0 20px 60px -10px rgba(0,0,0,.1),0 0 0 1px rgba(0,0,0,.04)}
  .head{padding:36px 32px 24px;border-bottom:1px solid #f1f5f9}
  .icon{width:56px;height:56px;margin:0 auto 18px;border-radius:16px;display:flex;align-items:center;justify-content:center;
    background:linear-gradient(135deg,#1e293b 0%,#334155 100%)}
  h1{margin:0;font-size:22px;font-weight:700;letter-spacing:-.01em}
  .sub{margin:8px 0 0;font-size:14px;line-height:1.6;color:#64748b}
  .body{padding:24px 32px 32px}
  .tips{margin:0 0 24px;padding:0;list-style:none;text-align:left;font-size:13px;color:#475569}
  .tips li{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:8px}
  .tips li:before{content:"";flex:none;width:6px;height:6px;margin-top:6px;border-radius:50%;background:#0f172a}
  button{width:100%;padding:13px 16px;border:0;border-radius:12px;background:#0f172a;color:#fff;font-size:14px;font-weight:600;cursor:pointer}
  button:hover{opacity:.9}
  .status{margin-top:14px;font-size:12px;color:#94a3b8}
  .dot{display:inline-block;width:8px;height:8px;margin-right:6px;border-radius:50%;background:#f59e0b;vertical-align:middle}
</style>
</head>
<body>
<main class="card">
  <div class="head">
    <div class="icon">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="2" y1="2" x2="22" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.8a15 15 0 0 1 4.2-2.6"/>
        <path d="M10.7 5.1A15 15 0 0 1 22 8.8"/><path d="M5 12.9a10 10 0 0 1 5.2-2.7"/><path d="M13.9 10.4a10 10 0 0 1 5.1 2.5"/><line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
    </div>
    <h1>You're offline</h1>
    <p class="sub">We can't reach Upskill right now. Check your connection and try again.</p>
  </div>
  <div class="body">
    <ul class="tips">
      <li>Check your Wi-Fi or mobile data connection</li>
      <li>Lessons you've downloaded are still available in your library</li>
      <li>We'll reconnect automatically once you're back online</li>
    </ul>
    <button type="button" onclick="location.reload()">Try again</button>
    <p class="status"><span class="dot"></span>Waiting for connection&hellip;</p>
  </div>
</main>
<script>addEventListener("online",function(){location.reload()})</script>
</body>
</html>`;

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
      new Response(OFFLINE_HTML, {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
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
