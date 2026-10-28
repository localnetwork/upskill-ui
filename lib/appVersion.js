export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0";

const VERSION_KEY = "upskill:app-version";

/**
 * Compares the stored version with the running one. On mismatch it clears
 * versioned caches (not auth, cart, offline queue or downloaded lessons)
 * and reloads once. Returns true when a reload was triggered.
 */
export async function clearCacheIfVersionChanged() {
  if (typeof window === "undefined") return false;

  let stored = null;
  try {
    stored = localStorage.getItem(VERSION_KEY);
  } catch {
    return false;
  }
  if (stored === APP_VERSION) return false;

  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("upskill-") && name !== "upskill-media")
          .map((name) => caches.delete(name)),
      );
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((item) => item.unregister()));
    }
  } catch (error) {
    console.error("Cache clear failed", error);
  }

  localStorage.setItem(VERSION_KEY, APP_VERSION);
  // First visit has nothing stale to replace, so no reload is needed.
  if (stored !== null) {
    window.location.reload();
    return true;
  }
  return false;
}
