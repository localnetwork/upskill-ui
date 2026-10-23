import * as tus from "tus-js-client";
import BaseApi from "@/lib/api/_base.api";

// Cloudflare Stream requires chunk sizes that are multiples of 256 KiB (min 5 MiB).
// The same size works for Bunny Stream.
const CHUNK_SIZE = 50 * 1024 * 1024;
const MAX_SESSION_RESETS = 2;
const RETRY_DELAYS_MS = [0, 1000, 3000, 5000, 10000];

export const TUS_INIT_FAILED = "TUS_INIT_FAILED";
function getHttpStatus(error) {
  const status = error?.originalResponse?.getStatus?.();
  return typeof status === "number" ? status : 0;
}

function isExpiredSessionError(error) {
  return [403, 404, 410].includes(getHttpStatus(error));
}

function isRetryableError(error) {
  const status = getHttpStatus(error);
  // status 0 means the request never got a response (offline, DNS, timeout...)
  return status === 0 || status >= 500 || [408, 423, 429].includes(status);
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Upload paused", "AbortError"));
      },
      { once: true },
    );
  });
}

function waitUntilOnline(signal) {
  if (typeof navigator === "undefined" || navigator.onLine) {
    return sleep(3000, signal);
  }
  return new Promise((resolve, reject) => {
    const onOnline = () => {
      signal?.removeEventListener("abort", onAbort);
      // Give the network a moment to settle before resuming.
      setTimeout(resolve, 1000);
    };
    const onAbort = () => {
      window.removeEventListener("online", onOnline);
      reject(new DOMException("Upload paused", "AbortError"));
    };
    window.addEventListener("online", onOnline, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function createSession({ file, lectureId, durationSeconds, restart }) {
  try {
    const response = await BaseApi.post(
      `${process.env.NEXT_PUBLIC_API_URL}/course-resources/videos/tus-upload-url`,
      {
        curriculum_id: lectureId,
        duration: durationSeconds > 0 ? Math.ceil(durationSeconds) : 3600,
        file_name: file.name,
        size_in_bytes: Number(file.size || 0),
      },
    );
    const uploadUrl = String(response?.data?.data?.upload_url || "").trim();
    const uid = String(response?.data?.data?.uid || "").trim();
    if (!uploadUrl || !uid) {
      throw new Error("Missing resumable upload URL or uid");
    }
    const headers = response?.data?.data?.headers || null;
    return {
      uploadUrl,
      uid,
      headers,
      resumed: Boolean(response?.data?.data?.resumed),
    };
  } catch (error) {
    // Network problems are retryable; anything else means the server can't start a tus upload.
    if (!error?.status && !error?.response && !error?.data) throw error;
    const wrapped = new Error(
      error?.data?.message || error?.message || "Unable to start upload",
    );
    wrapped.code = TUS_INIT_FAILED;
    wrapped.cause = error;
    throw wrapped;
  }
}

function runTusUpload({ file, uploadUrl, headers, signal, onProgress }) {
  return new Promise((resolve, reject) => {
    // Bunny Stream: a shared creation endpoint plus signed headers identifying the video.
    const usesCreationEndpoint = Boolean(headers);
    const upload = new tus.Upload(file, {
      ...(usesCreationEndpoint
        ? {
            endpoint: uploadUrl,
            headers,
            metadata: {
              filetype: file.type || "video/mp4",
              title: file.name,
            },
          }
        : { uploadUrl }),
      chunkSize: CHUNK_SIZE,
      retryDelays: RETRY_DELAYS_MS,
      removeFingerprintOnSuccess: true,
      onProgress: (sent, total) => {
        onProgress?.(total ? Math.round((sent / total) * 100) : 0);
      },
      onSuccess: () => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      },
      onError: (error) => {
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      },
    });

    const onAbort = () => {
      upload.abort();
      reject(new DOMException("Upload paused", "AbortError"));
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });

    // Cloudflare: a known uploadUrl makes tus HEAD the server for the offset.
    // Bunny: resume the previous upload for this file (fingerprint) if one exists.
    if (usesCreationEndpoint) {
      upload
        .findPreviousUploads()
        .then((previous) => {
          if (previous?.length) upload.resumeFromPreviousUpload(previous[0]);
          upload.start();
        })
        .catch(() => upload.start());
      return;
    }
    upload.start();
  });
}

/**
 * Uploads a video to Cloudflare Stream via tus. The server records the upload
 * session as soon as it starts, so the lecture survives page reloads; calling
 * this again with the same file continues from the saved offset.
 * Resolves with { uid, resumed }.
 */
export async function uploadVideoResumable({
  file,
  lectureId,
  durationSeconds = 0,
  signal,
  onProgress,
  onStatus,
  onSessionCreated,
}) {
  let session = null;
  let restart = false;
  let resumed = false;
  let resets = 0;

  while (true) {
    try {
      if (!session) {
        onStatus?.("starting");
        session = await createSession({ file, lectureId, durationSeconds, restart });
        resumed = resumed || session.resumed;
        restart = false;
        onSessionCreated?.(session);
      }

      onStatus?.(resumed || resets > 0 ? "resuming" : "uploading");
      await runTusUpload({
        file,
        uploadUrl: session.uploadUrl,
        headers: session.headers,
        signal,
        onProgress: (percent) => {
          onStatus?.("uploading");
          onProgress?.(percent);
        },
      });
      return { uid: session.uid, resumed };
    } catch (error) {
      if (error?.name === "AbortError" || signal?.aborted) throw error;
      if (error?.code === TUS_INIT_FAILED) throw error;
      if (isExpiredSessionError(error) && resets < MAX_SESSION_RESETS) {
        session = null;
        restart = true;
        resets += 1;
        continue;
      }

      if (isRetryableError(error)) {
        onStatus?.("waiting");
        await waitUntilOnline(signal);
        onStatus?.("resuming");
        continue;
      }

      throw error;
    }
  }
}
