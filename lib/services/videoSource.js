export function isAbsoluteHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

export function extractStreamVideoIdFromPlaybackUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || !isAbsoluteHttpUrl(raw)) return "";

  try {
    const url = new URL(raw);
    const [videoId] = url.pathname.split("/").filter(Boolean);
    if (!videoId) return "";
    const host = url.host.toLowerCase();
    const isStreamHost =
      host.includes("videodelivery.net") ||
      host.includes("cloudflarestream.com") ||
      host.includes("iframe.videodelivery.net");
    if (!isStreamHost) return "";
    return String(videoId).trim();
  } catch (_error) {
    return "";
  }
}

export function buildStreamEmbedUrlFromPlaybackUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https:\/\/iframe\.videodelivery\.net\//i.test(raw)) {
    return raw;
  }

  const videoId = extractStreamVideoIdFromPlaybackUrl(value);
  if (!videoId) return "";
  return `https://iframe.videodelivery.net/${encodeURIComponent(videoId)}`;
}

export function resolveVideoSource(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (isAbsoluteHttpUrl(raw)) return raw;

  const apiBase = String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (!apiBase) return raw;

  if (raw.startsWith("/")) {
    return `${apiBase}${raw}`;
  }

  return raw;
}
