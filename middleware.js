import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);
const accessTokenCookieNames = Array.from(
  new Set(
    [process.env.NEXT_PUBLIC_TOKEN, "upskill-token", "app_token"].filter(
      Boolean,
    ),
  ),
);
const refreshTokenCookieNames = Array.from(
  new Set(
    [
      process.env.NEXT_PUBLIC_REFRESH_TOKEN,
      "upskill-refresh-token",
      "refresh-token",
      "app_refresh_token",
    ].filter(Boolean),
  ),
);

const getCookieByNames = (req, cookieNames) => {
  for (const cookieName of cookieNames) {
    const token = req.cookies.get(cookieName)?.value;
    if (token) return token;
  }
  return null;
};

const getAccessTokenFromRequest = (req) =>
  getCookieByNames(req, accessTokenCookieNames);
const getRefreshTokenFromRequest = (req) =>
  getCookieByNames(req, refreshTokenCookieNames);

const decodeToken = async (token) => {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
};

const applyCookieMutations = (targetResponse, cookiesResponse) => {
  const cookies = cookiesResponse.cookies.getAll();
  for (const cookie of cookies) {
    targetResponse.cookies.set(cookie);
  }
  return targetResponse;
};

const clearAuthCookies = (response) => {
  for (const cookieName of accessTokenCookieNames) {
    response.cookies.set({
      name: cookieName,
      value: "",
      maxAge: 0,
      path: "/",
    });
  }

  for (const cookieName of refreshTokenCookieNames) {
    response.cookies.set({
      name: cookieName,
      value: "",
      maxAge: 0,
      path: "/",
    });
  }
};

const persistRefreshedTokens = (response, accessToken, refreshToken) => {
  for (const cookieName of accessTokenCookieNames) {
    response.cookies.set({
      name: cookieName,
      value: accessToken,
      path: "/",
    });
  }

  if (!refreshToken) return;

  for (const cookieName of refreshTokenCookieNames) {
    response.cookies.set({
      name: cookieName,
      value: refreshToken,
      path: "/",
    });
  }
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken || !process.env.NEXT_PUBLIC_API_URL) return null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const body = await response.json();
    const payload = body?.data || body || {};

    const nextAccessToken = payload?.accessToken || payload?.token || null;
    const nextRefreshToken =
      payload?.refreshToken || payload?.refresh_token || refreshToken;

    if (!nextAccessToken) return null;

    return {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    };
  } catch {
    return null;
  }
};

const getNormalizedRoles = (decoded) => {
  const roles = [];
  if (Array.isArray(decoded?.roles)) {
    for (const role of decoded.roles) {
      if (typeof role === "string") roles.push(role.toUpperCase());
      else if (role?.name) roles.push(String(role.name).toUpperCase());
      else if (role?.role_name) roles.push(String(role.role_name).toUpperCase());
      else if (role?.id) roles.push(String(role.id));
    }
  }
  if (decoded?.role) roles.push(String(decoded.role).toUpperCase());
  return Array.from(new Set(roles.filter(Boolean)));
};

const hasRole = (roles, roleName) => {
  const target = String(roleName || "").toUpperCase();
  const aliases = {
    ADMIN: ["ADMIN", "1"],
    EDUCATOR: ["EDUCATOR", "INSTRUCTOR", "2"],
    LEARNER: ["LEARNER", "STUDENT", "3"],
  };
  const accepted = aliases[target] || [target];
  return roles.some((role) => accepted.includes(String(role).toUpperCase()));
};

const guardAdminRoute = (req, token, roles, decoded) => {
  const pathname = req.nextUrl.pathname;
  if (!pathname.startsWith("/admin")) return null;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If token exists but cannot be decoded here (e.g. env secret mismatch),
  // allow request and let server-side page/API checks make the final decision.
  if (!decoded) return null;

  if (!hasRole(roles, "ADMIN")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return null;
};

const isLoggedInBlock = (req, token) => {
  const restrictedPaths = [
    "/login",
    "/register",
    "/forgot",
    "/forgot-password",
    "/verify-2fa",
  ];

  if (token && restrictedPaths.includes(req.nextUrl.pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return null;
};

const isAnonymous = (req, token) => {
  const pathname = req.nextUrl.pathname;
  const isRestrictedPath =
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname === "/cart";

  if (!token && isRestrictedPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return null;
};

export async function middleware(req) {
  const cookieMutations = NextResponse.next();

  let token = getAccessTokenFromRequest(req);
  let decoded = await decodeToken(token);

  if (!decoded) {
    const refreshToken = getRefreshTokenFromRequest(req);
    const refreshed = await refreshAccessToken(refreshToken);

    if (refreshed?.accessToken) {
      token = refreshed.accessToken;
      decoded = await decodeToken(token);
      persistRefreshedTokens(cookieMutations, token, refreshed.refreshToken);
    } else if (token || refreshToken) {
      clearAuthCookies(cookieMutations);
      token = null;
      decoded = null;
    }
  }

  const roles = getNormalizedRoles(decoded);

  const adminGuardResponse = guardAdminRoute(req, token, roles, decoded);
  if (adminGuardResponse)
    return applyCookieMutations(adminGuardResponse, cookieMutations);

  const loggedInBlockResponse = isLoggedInBlock(req, token);
  if (loggedInBlockResponse)
    return applyCookieMutations(loggedInBlockResponse, cookieMutations);

  const anonymousResponse = isAnonymous(req, token);
  if (anonymousResponse)
    return applyCookieMutations(anonymousResponse, cookieMutations);

  return applyCookieMutations(NextResponse.next(), cookieMutations);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/forgot",
    "/profile",
    "/profile/:path*",
    "/checkout",
    "/checkout/:path*",
    "/cart",
    "/verify-2fa",
    "/admin",
    "/admin/:path*",
    "/instructor",
    "/instructor/:path*",
  ],
};
