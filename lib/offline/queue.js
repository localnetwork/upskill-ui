import axios from "axios";
import toast from "react-hot-toast";
import { STORES, dbAdd, dbDelete, dbGetAll, dbPut } from "./db";

const QUEUE_EVENT = "upskill:offline-queue-changed";
const TEMP_PREFIX = "offline-";
let flushing = false;

// Money, auth, realtime and file endpoints must never be deferred.
const NEVER_QUEUE = [
  "/auth",
  "/payments",
  "/checkout",
  "/stream-token",
  "/socket.io",
  "/upload",
  "/logout",
  "/earnings/",
];

const notify = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(QUEUE_EVENT));
  }
};

export const onQueueChange = (handler) => {
  window.addEventListener(QUEUE_EVENT, handler);
  return () => window.removeEventListener(QUEUE_EVENT, handler);
};

// Axios rejects with the response object for HTTP errors; anything else is a network failure.
export const isNetworkError = (error) =>
  !error?.status && !error?.response && !error?.data;

export const isOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

const isPlainBody = (data) =>
  data == null ||
  typeof data === "string" ||
  (typeof data === "object" &&
    !(typeof FormData !== "undefined" && data instanceof FormData) &&
    !(typeof Blob !== "undefined" && data instanceof Blob));

function canQueue(method, url, data) {
  if (typeof window === "undefined" || !String(url).startsWith("http")) {
    return false;
  }
  if (NEVER_QUEUE.some((part) => String(url).includes(part))) return false;
  return isPlainBody(data);
}

export async function getPendingCount() {
  try {
    return (await dbGetAll(STORES.QUEUE)).length;
  } catch {
    return 0;
  }
}

const newTempId = () =>
  `${TEMP_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

async function enqueue(method, url, data) {
  const tempId = method === "post" ? newTempId() : null;
  await dbAdd(STORES.QUEUE, {
    method,
    url,
    data,
    tempId,
    createdAt: Date.now(),
  });
  notify();
  toast("Saved offline. It will sync when you're back online.", {
    id: "offline-saved",
    icon: "📴",
  });
  return tempId;
}

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

// Shape mimics a successful API response so callers' success paths still run.
function queuedResponse(method, data, tempId) {
  const body = typeof data === "string" ? safeParse(data) : data || {};
  const record =
    method === "delete"
      ? {}
      : { ...body, ...(tempId ? { id: tempId, uuid: tempId } : {}) };
  return {
    status: 202,
    queued: true,
    data: { success: true, queued: true, data: record },
  };
}

/**
 * Sends a mutation, or stores it for later when the network is down.
 * The returned response has `queued: true` when deferred.
 */
export async function mutateOrQueue(method, url, data, config = {}) {
  const send = () => axios.request({ ...config, method, url, data });
  if (!canQueue(method, url, data)) return send();

  if (isOffline()) {
    const tempId = await enqueue(method, url, data);
    return queuedResponse(method, data, tempId);
  }
  try {
    return await send();
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const tempId = await enqueue(method, url, data);
    return queuedResponse(method, data, tempId);
  }
}

export async function postOrQueue(url, data) {
  const response = await mutateOrQueue("post", url, data);
  return { queued: Boolean(response.queued), response };
}

// 4xx responses (except auth/throttle) will never succeed on retry, so they are dropped.
const isRetryable = (status) =>
  !status || status >= 500 || [401, 408, 429].includes(status);

// Later queued edits may reference an item created offline; swap in the real server ids.
async function remapTempId(laterItems, tempId, response) {
  const payload = response?.data?.data ?? response?.data ?? {};
  if (!tempId || !payload?.id) return;
  const urlId = String(payload.id);
  const bodyId = payload.id;
  for (const next of laterItems) {
    const urlHas = next.url.includes(tempId);
    const dataText = next.data == null ? "" : JSON.stringify(next.data);
    if (!urlHas && !dataText.includes(tempId)) continue;
    if (urlHas) next.url = next.url.split(tempId).join(urlId);
    if (dataText.includes(tempId)) {
      next.data = JSON.parse(
        dataText.split(`"${tempId}"`).join(JSON.stringify(bodyId)),
      );
    }
    await dbPut(STORES.QUEUE, next);
  }
}

export async function flushQueue() {
  if (flushing || isOffline()) return 0;
  flushing = true;
  let synced = 0;
  try {
    const items = (await dbGetAll(STORES.QUEUE)).sort((a, b) => a.id - b.id);
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      try {
        const response = await axios.request({
          method: item.method || "post",
          url: item.url,
          data: item.data,
        });
        await dbDelete(STORES.QUEUE, item.id);
        await remapTempId(items.slice(index + 1), item.tempId, response);
        synced += 1;
      } catch (error) {
        if (isNetworkError(error) || isRetryable(error?.status)) break;
        await dbDelete(STORES.QUEUE, item.id);
      }
    }
  } catch {
    // IndexedDB unavailable; nothing to flush.
  } finally {
    flushing = false;
    notify();
  }
  return synced;
}
