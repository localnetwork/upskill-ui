export function isAbsoluteHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

const BUNNY_GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isBunnyEmbedUrl(value) {
  return /^https:\/\/iframe\.mediadelivery\.net\//i.test(
    String(value || "").trim(),
  );
}

export function extractStreamVideoIdFromPlaybackUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || !isAbsoluteHttpUrl(raw)) return "";

  try {
    const url = new URL(raw);
    const segments = url.pathname.split("/").filter(Boolean);
    const host = url.host.toLowerCase();

    if (host.endsWith("mediadelivery.net")) {
      const id = segments[2] || "";
      return BUNNY_GUID_PATTERN.test(id) ? id : "";
    }
    if (host.endsWith(".b-cdn.net")) {
      return BUNNY_GUID_PATTERN.test(segments[0] || "") ? segments[0] : "";
    }

    const [videoId] = segments;
    if (!videoId) return "";
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
  if (/^https:\/\/iframe\.videodelivery\.net\//i.test(raw) || isBunnyEmbedUrl(raw)) {
    return raw;
  }

  // Bunny playlist URLs need a signed embed from the backend (library id/token are server-side).
  if (/\.b-cdn\.net\//i.test(raw)) return "";

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
