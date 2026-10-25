import { STORES, dbClear, dbDelete, dbGet, dbGetAll, dbPut } from "./db";
import {
  extractStreamVideoIdFromPlaybackUrl,
  isAbsoluteHttpUrl,
  resolveVideoSource,
} from "@/lib/services/videoSource";

export const MEDIA_CACHE = "upskill-media";
const DOWNLOADS_EVENT = "upskill:offline-downloads-changed";

const notify = () => window.dispatchEvent(new Event(DOWNLOADS_EVENT));

export const onDownloadsChange = (handler) => {
  window.addEventListener(DOWNLOADS_EVENT, handler);
  return () => window.removeEventListener(DOWNLOADS_EVENT, handler);
};

export const isOfflineSupported = () =>
  typeof window !== "undefined" && "caches" in window && "indexedDB" in window;

// Signed/embedded stream videos cannot be stored; only direct files can.
export function getDownloadableMediaUrl(lecture) {
  const url = resolveVideoSource(
    lecture?.asset?.path || lecture?.videoUrl || "",
  );
  if (!url || !isAbsoluteHttpUrl(url)) return null;
  if (extractStreamVideoIdFromPlaybackUrl(url)) return null;
  return url;
}

export const listDownloads = () => dbGetAll(STORES.DOWNLOADS);
export const getDownload = (lessonId) => dbGet(STORES.DOWNLOADS, lessonId);

// Must match PAGES_CACHE in public/sw.js.
const PAGES_CACHE = "upskill-pages-v1";
const OPT_OUT_KEY = "upskill:offline-optout";
const inFlight = new Set();
const cachedPages = new Set();

const readOptOut = () => {
  try {
    return JSON.parse(localStorage.getItem(OPT_OUT_KEY) || "[]");
  } catch {
    return [];
  }
};
const writeOptOut = (ids) => {
  try {
    localStorage.setItem(OPT_OUT_KEY, JSON.stringify(ids.slice(-500)));
  } catch {
    // Storage full or blocked; auto-download simply won't remember opt-outs.
  }
};

export const isOptedOut = (lessonId) => readOptOut().includes(lessonId);

// Stores the learn page shell and its data so the page opens with no connection.
export async function cacheLearnPage(slug) {
  if (!isOfflineSupported() || !navigator.onLine || !slug) return;
  if (cachedPages.has(slug)) return;
  cachedPages.add(slug);
  try {
    const cache = await caches.open(PAGES_CACHE);
    const pageUrl = `/courses/${encodeURIComponent(slug)}/learn`;
    const urls = [pageUrl];
    const buildId = window.__NEXT_DATA__?.buildId;
    if (buildId) {
      urls.push(
        `/_next/data/${buildId}/courses/${encodeURIComponent(slug)}/learn.json?slug=${encodeURIComponent(slug)}`,
      );
    }
    await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url, { credentials: "same-origin" });
        if (response.ok && !response.redirected) await cache.put(url, response);
      }),
    );
  } catch {
    cachedPages.delete(slug);
  }
}

// Silent background download; skipped on data-saver, offline, or after the user removed the lesson.
export async function autoDownloadLesson({ lecture, course }) {
  const lessonId = lecture?.id;
  if (!lessonId || lecture?.is_locked || !isOfflineSupported()) return false;
  if (!navigator.onLine || navigator.connection?.saveData) return false;
  if (isOptedOut(lessonId) || inFlight.has(lessonId)) return false;
  if (await getDownload(lessonId)) return false;
  inFlight.add(lessonId);
  try {
    await downloadLesson({ lecture, course });
    return true;
  } finally {
    inFlight.delete(lessonId);
  }
}

export async function downloadLesson({ lecture, course }) {
  if (!lecture?.id) throw new Error("Lesson is not ready");
  writeOptOut(readOptOut().filter((id) => id !== lecture.id));
  const mediaUrl = getDownloadableMediaUrl(lecture);
  let size = 0;

  if (mediaUrl) {
    const response = await fetch(mediaUrl, { mode: "cors" });
    if (!response.ok) throw new Error("Unable to download this video");
    size = Number(response.headers.get("content-length") || 0);
    const cache = await caches.open(MEDIA_CACHE);
    await cache.put(mediaUrl, response);
  }

  await dbPut(STORES.DOWNLOADS, {
    lessonId: lecture.id,
    lessonUuid: lecture.uuid || lecture.id,
    title: lecture.title,
    courseId: course?.id,
    courseSlug: course?.slug,
    courseTitle: course?.title,
    mediaUrl,
    size,
    downloadedAt: Date.now(),
  });
  notify();
}

export async function removeDownload(lessonId) {
  writeOptOut([...readOptOut().filter((id) => id !== lessonId), lessonId]);
  const entry = await getDownload(lessonId);
  if (entry?.mediaUrl) {
    const cache = await caches.open(MEDIA_CACHE);
    await cache.delete(entry.mediaUrl);
  }
  await dbDelete(STORES.DOWNLOADS, lessonId);
  notify();
}

// Called on logout so the next user on this device never sees cached private data.
export async function clearOfflineData() {
  if (typeof window === "undefined") return;
  // Offline, a failed token refresh must not wipe the user's downloads.
  if (!navigator.onLine) return;
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("upskill-"))
          .map((name) => caches.delete(name)),
      );
    }
    await dbClear(STORES.DOWNLOADS);
    await dbClear(STORES.QUEUE);
    localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // Best effort.
  }
}
