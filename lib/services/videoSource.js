export function isAbsoluteHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

export function extractBunnyVideoIdFromPlaybackUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || !isAbsoluteHttpUrl(raw)) return "";

  try {
    const url = new URL(raw);
    const [videoId] = url.pathname.split("/").filter(Boolean);
    if (!videoId) return "";
    const isBunnyHost =
      url.host.toLowerCase().includes(".b-cdn.net") ||
      url.host.toLowerCase().includes("mediadelivery.net");
    if (!isBunnyHost) return "";
    return String(videoId).trim();
  } catch (_error) {
    return "";
  }
}

export function buildBunnyEmbedUrlFromPlaybackUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https:\/\/iframe\.mediadelivery\.net\/embed\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const segments = parsed.pathname.split("/").filter(Boolean);
      const libraryId = String(segments[1] || "").trim();
      const videoId = String(segments[2] || "").trim();
      if (segments[0] === "embed" && libraryId && videoId) {
        return `https://iframe.mediadelivery.net/embed/${encodeURIComponent(libraryId)}/${encodeURIComponent(videoId)}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;
      }
    } catch (_error) {
      return raw;
    }
    return raw;
  }

  const videoId = extractBunnyVideoIdFromPlaybackUrl(value);
  const libraryId = String(process.env.NEXT_PUBLIC_STREAM_LIBRARY_ID || "").trim();
  if (!videoId || !libraryId) return "";
  return `https://iframe.mediadelivery.net/embed/${encodeURIComponent(libraryId)}/${encodeURIComponent(videoId)}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;
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
