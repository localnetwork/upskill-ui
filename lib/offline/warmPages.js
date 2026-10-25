// Must match PAGES_CACHE in public/sw.js.
const PAGES_CACHE = "upskill-pages-v1";
const MAX_PER_PASS = 25;
const MAX_CACHED_PAGES = 300;
const SKIP = [
  "/api",
  "/login",
  "/register",
  "/logout",
  "/checkout",
  "/_next",
  "/share",
];
const warming = new Set();

const toCacheKey = (anchor) => {
  try {
    const url = new URL(anchor.href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (SKIP.some((prefix) => url.pathname.startsWith(prefix))) return null;
    if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
};

// Stores the pages linked from the current screen so they open with no connection.
export async function warmLinkedPages() {
  if (typeof window === "undefined" || !("caches" in window)) return;
  if (!navigator.onLine || navigator.connection?.saveData) return;
  try {
    const cache = await caches.open(PAGES_CACHE);
    if ((await cache.keys()).length >= MAX_CACHED_PAGES) return;
    const keys = [
      ...new Set(
        [...document.querySelectorAll("a[href^='/']")]
          .map(toCacheKey)
          .filter(Boolean),
      ),
    ].slice(0, MAX_PER_PASS);

    for (const key of keys) {
      if (warming.has(key) || (await cache.match(key))) continue;
      warming.add(key);
      try {
        const response = await fetch(key, { credentials: "same-origin" });
        const isHtml = (response.headers.get("content-type") || "").includes(
          "text/html",
        );
        if (response.ok && !response.redirected && isHtml) {
          await cache.put(key, response);
        }
      } catch {
        // Offline mid-pass; the next pass retries.
      } finally {
        warming.delete(key);
      }
    }
  } catch {
    // Best effort.
  }
}
