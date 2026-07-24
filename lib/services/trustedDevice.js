const TRUSTED_DEVICE_TOKEN_KEY = "upskill-trusted-device-token";
const DEVICE_IDENTIFIER_KEY = "upskill-device-identifier";

function isBrowser() {
  return typeof window !== "undefined";
}

function randomId() {
  if (isBrowser() && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getTrustedDeviceToken() {
  if (!isBrowser()) return "";
  return String(window.localStorage.getItem(TRUSTED_DEVICE_TOKEN_KEY) || "");
}

export function setTrustedDeviceToken(token) {
  if (!isBrowser()) return;
  const normalized = String(token || "").trim();
  if (!normalized) return;
  window.localStorage.setItem(TRUSTED_DEVICE_TOKEN_KEY, normalized);
}

export function clearTrustedDeviceToken() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TRUSTED_DEVICE_TOKEN_KEY);
}

export function getOrCreateDeviceIdentifier() {
  if (!isBrowser()) return "";
  const existing = String(window.localStorage.getItem(DEVICE_IDENTIFIER_KEY) || "").trim();
  if (existing) return existing;
  const created = randomId();
  window.localStorage.setItem(DEVICE_IDENTIFIER_KEY, created);
  return created;
}

export function buildClientDeviceName() {
  if (!isBrowser()) return "Unknown device";
  const source = String(window.navigator?.userAgent || "").toLowerCase();
  if (!source) return "Unknown device";

  const os = source.includes("windows")
    ? "Windows"
    : source.includes("mac os") || source.includes("macintosh")
      ? "Mac"
      : source.includes("android")
        ? "Android"
        : source.includes("iphone")
          ? "iPhone"
          : source.includes("ipad")
            ? "iPad"
            : source.includes("linux")
              ? "Linux"
              : "Unknown OS";
  const browser = source.includes("edg/")
    ? "Edge"
    : source.includes("chrome/")
      ? "Chrome"
      : source.includes("safari/") && !source.includes("chrome/")
        ? "Safari"
        : source.includes("firefox/")
          ? "Firefox"
          : source.includes("opr/") || source.includes("opera/")
            ? "Opera"
            : "Browser";
  return `${os} • ${browser}`;
}

function getRegionNameFromLocale(locale) {
  const normalizedLocale = String(locale || "");
  const matched = normalizedLocale.match(/-([A-Z]{2})$/i);
  const regionCode = matched ? matched[1].toUpperCase() : "";
  if (!regionCode) return "";

  try {
    const displayNames = new Intl.DisplayNames([normalizedLocale], { type: "region" });
    return String(displayNames.of(regionCode) || "").trim();
  } catch (_error) {
    return regionCode;
  }
}

function toReadableTimezoneLabel(timeZone) {
  const tz = String(timeZone || "").trim();
  if (!tz) return "";
  const chunks = tz.split("/");
  const cityRaw = chunks[chunks.length - 1] || tz;
  return cityRaw.replace(/_/g, " ");
}

export function buildClientLocationLabel() {
  if (!isBrowser()) return "";
  const locale = String(window.navigator?.language || "").trim();
  const timeZone = String(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  ).trim();

  const region = getRegionNameFromLocale(locale);
  const zoneCity = toReadableTimezoneLabel(timeZone);

  if (region && zoneCity) {
    return `${zoneCity}, ${region}`.slice(0, 120);
  }
  if (zoneCity) {
    return zoneCity.slice(0, 120);
  }
  if (region) {
    return region.slice(0, 120);
  }
  return "";
}
