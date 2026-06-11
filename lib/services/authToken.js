const LEGACY_TOKEN_COOKIE_NAMES = ["upskill-token", "app_token"];
const DEFAULT_REFRESH_TOKEN_COOKIE = "upskill-refresh-token";
const LEGACY_REFRESH_TOKEN_COOKIE_NAMES = [
  "refresh-token",
  "app_refresh_token",
];

export function getAuthTokenCookieNames() {
  const primary = process.env.NEXT_PUBLIC_TOKEN;
  return Array.from(
    new Set([primary, ...LEGACY_TOKEN_COOKIE_NAMES].filter(Boolean)),
  );
}

export function getAuthTokenFromCookieMap(cookies = {}) {
  const names = getAuthTokenCookieNames();
  for (const name of names) {
    if (cookies?.[name]) {
      return cookies[name];
    }
  }
  return null;
}

export function getAuthTokenFromCookieHeader(cookieHeader = "") {
  if (!cookieHeader) return null;

  const cookies = {};
  for (const pair of cookieHeader.split(/;\s*/)) {
    if (!pair) continue;
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex < 0) continue;
    const key = pair.slice(0, separatorIndex);
    const value = pair.slice(separatorIndex + 1);
    cookies[key] = decodeURIComponent(value);
  }

  return getAuthTokenFromCookieMap(cookies);
}

export function getRefreshTokenCookieNames() {
  const primary = process.env.NEXT_PUBLIC_REFRESH_TOKEN || DEFAULT_REFRESH_TOKEN_COOKIE;
  return Array.from(
    new Set([primary, ...LEGACY_REFRESH_TOKEN_COOKIE_NAMES].filter(Boolean)),
  );
}

export function getRefreshTokenFromCookieMap(cookies = {}) {
  const names = getRefreshTokenCookieNames();
  for (const name of names) {
    if (cookies?.[name]) {
      return cookies[name];
    }
  }
  return null;
}

export function getRefreshTokenFromCookieHeader(cookieHeader = "") {
  if (!cookieHeader) return null;

  const cookies = {};
  for (const pair of cookieHeader.split(/;\s*/)) {
    if (!pair) continue;
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex < 0) continue;
    const key = pair.slice(0, separatorIndex);
    const value = pair.slice(separatorIndex + 1);
    cookies[key] = decodeURIComponent(value);
  }

  return getRefreshTokenFromCookieMap(cookies);
}
