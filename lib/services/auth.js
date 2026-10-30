import nookies from "nookies";
import persistentStore from "@/lib/store/persistentStore";
import modalState from "../store/modalState";
import { clearOfflineData } from "../offline/downloads";
import {
  getAuthTokenCookieNames,
  getAuthTokenFromCookieMap,
  getRefreshTokenCookieNames,
  getRefreshTokenFromCookieMap,
  isTokenExpired,
} from "./authToken";

export const isLoggedIn = () => {
  const profile = persistentStore.getState().profile;
  const cookies = nookies.get();

  const token = getAuthTokenFromCookieMap(cookies);
  if (typeof window === "undefined") return false;
  if (token && isTokenExpired(token)) {
    logout();
    return false;
  }
  return profile && token ? true : false;
};

// Clears the persisted profile when its auth cookies are gone or dead.
export const clearStaleSession = () => {
  if (typeof window === "undefined") return false;
  if (!persistentStore.getState().profile) return false;

  const cookies = nookies.get();
  const token = getAuthTokenFromCookieMap(cookies);
  const refreshToken = getRefreshTokenFromCookieMap(cookies);
  const accessDead = !token || isTokenExpired(token);
  if (accessDead && (!refreshToken || isTokenExpired(refreshToken))) {
    logout();
    return true;
  }
  return false;
};

export const logout = () => {
  clearOfflineData();
  persistentStore.setState({ profile: null, cart: null });
  try {
    persistentStore.persist?.clearStorage?.();
    window.localStorage.removeItem("persistent");
  } catch {}
  modalState.setState({ modalInfo: null });
  getAuthTokenCookieNames().forEach((cookieName) => {
    nookies.destroy(null, cookieName, { path: "/" });
  });
  getRefreshTokenCookieNames().forEach((cookieName) => {
    nookies.destroy(null, cookieName, { path: "/" });
  });
};
