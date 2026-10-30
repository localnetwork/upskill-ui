import { parseCookies } from "nookies";
import {
  getAuthTokenFromCookieHeader,
  getAuthTokenFromCookieMap,
  getAuthTokenCookieNames,
  getRefreshTokenFromCookieHeader,
  getRefreshTokenFromCookieMap,
  getRefreshTokenCookieNames,
} from "../services/authToken";
import { logout } from "../services/auth";
import persistentStore from "../store/persistentStore";
import { setCookie, destroyCookie } from "nookies";

let context = null;
let refreshPromise = null;

export const setContext = (_context) => {
  context = {
    cookieHeader: _context?.req?.headers?.cookie || "",
  };
};

const isServer = () => typeof window === "undefined";

const getToken = () => {
  if (isServer() && context) {
    const serverCookies = context.cookieHeader;
    if (serverCookies) {
      return getAuthTokenFromCookieHeader(serverCookies);
    }
  } else {
    const cookies = parseCookies();
    return getAuthTokenFromCookieMap(cookies);
  }
};

const getRefreshToken = () => {
  if (isServer() && context) {
    const serverCookies = context.cookieHeader;
    if (serverCookies) {
      return getRefreshTokenFromCookieHeader(serverCookies);
    }
  } else {
    const cookies = parseCookies();
    return getRefreshTokenFromCookieMap(cookies);
  }
};

function persistTokens({ accessToken, refreshToken }) {
  if (isServer()) return;
  const cookieContext = isServer() && context ? context : {};
  if (accessToken) {
    getAuthTokenCookieNames().forEach((cookieName) => {
      setCookie(cookieContext, cookieName, accessToken, { path: "/" });
    });
  }
  if (refreshToken) {
    getRefreshTokenCookieNames().forEach((cookieName) => {
      setCookie(cookieContext, cookieName, refreshToken, { path: "/" });
    });
  }
}

function clearTokens() {
  if (isServer()) return;
  const cookieContext = isServer() && context ? context : {};
  getAuthTokenCookieNames().forEach((cookieName) => {
    destroyCookie(cookieContext, cookieName, { path: "/" });
  });
  getRefreshTokenCookieNames().forEach((cookieName) => {
    destroyCookie(cookieContext, cookieName, { path: "/" });
  });
}

function forceClientLogout() {
  if (isServer()) return;
  logout();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

function shouldTryRefresh(responseError) {
  return responseError?.status === 401;
}

const hasStaleSession = () =>
  Boolean(persistentStore.getState().profile) || Boolean(getToken());

export default function setup(axios) {
  // 🔵 Request Interceptor

  axios.interceptors.request.use((config) => {
    const requestUrl = String(config?.url || "");
    const skipAuthRefreshHeader =
      config?.headers?.["x-skip-auth-refresh"] === "true";
    const isRefreshRequest = requestUrl.includes("/auth/refresh");
    const token = getToken();

    if (token && !skipAuthRefreshHeader && !isRefreshRequest) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    config.headers["Strict-Transport-Security"] = "max-age=31536000";

    return config;
  });

  // 🟠 Response
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const responseError = error?.response;
      const originalConfig = error?.config || responseError?.config;
      if (!responseError || !originalConfig) {
        return Promise.reject(responseError || error);
      }

      const requestUrl = String(originalConfig.url || "");
      const isRefreshRequest = requestUrl.includes("/auth/refresh");
      const isLoginRequest = /\/auth\/(login|verify-2fa)/.test(requestUrl);
      const alreadyRetried = Boolean(originalConfig._retry);

      if (
        isRefreshRequest ||
        isLoginRequest ||
        alreadyRetried ||
        !shouldTryRefresh(responseError)
      ) {
        return Promise.reject(responseError);
      }

      if (isServer()) {
        return Promise.reject(responseError);
      }

      const currentRefreshToken = getRefreshToken();
      if (!currentRefreshToken) {
        // Anonymous visitors hitting an auth-only endpoint on a public page must not be sent to /login.
        if (!hasStaleSession()) {
          return Promise.reject(responseError);
        }
        clearTokens();
        forceClientLogout();
        return Promise.reject(responseError);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
              {
                refreshToken: currentRefreshToken,
                refresh_token: currentRefreshToken,
              },
              {
                headers: { "x-skip-auth-refresh": "true" },
              },
            )
            .then((res) => {
              const payload = res?.data?.data || res?.data || {};
              const nextAccessToken =
                payload?.accessToken || payload?.token || null;
              const nextRefreshToken =
                payload?.refreshToken ||
                payload?.refresh_token ||
                currentRefreshToken;
              if (!nextAccessToken) {
                throw new Error("Refresh response missing access token");
              }
              persistTokens({
                accessToken: nextAccessToken,
                refreshToken: nextRefreshToken,
              });
              return nextAccessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const nextAccessToken = await refreshPromise;
        originalConfig._retry = true;
        originalConfig.headers = {
          ...(originalConfig.headers || {}),
          Authorization: `Bearer ${nextAccessToken}`,
        };
        return axios.request(originalConfig);
      } catch (_refreshError) {
        clearTokens();
        forceClientLogout();
        return Promise.reject(responseError);
      }
    },
  );
}
