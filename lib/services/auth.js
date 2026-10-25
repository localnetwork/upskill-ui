import nookies from "nookies";
import persistentStore from "@/lib/store/persistentStore";
import modalState from "../store/modalState";
import { clearOfflineData } from "../offline/downloads";
import {
  getAuthTokenCookieNames,
  getAuthTokenFromCookieMap,
  getRefreshTokenCookieNames,
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

export const logout = () => {
  clearOfflineData();
  persistentStore.setState({ profile: null, cart: null });
  modalState.setState({ modalInfo: null });
  getAuthTokenCookieNames().forEach((cookieName) => {
    nookies.destroy(null, cookieName, { path: "/" });
  });
  getRefreshTokenCookieNames().forEach((cookieName) => {
    nookies.destroy(null, cookieName, { path: "/" });
  });
};
