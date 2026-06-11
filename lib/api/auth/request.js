import BaseApi from "../_base.api";
import { setCookie, destroyCookie, parseCookies } from "nookies";
import {
  getAuthTokenCookieNames,
  getRefreshTokenCookieNames,
} from "@/lib/services/authToken";

export default class AUTHAPI {
  static async login(payload) {
    try {
      const normalizedPayload = {
        password: payload?.password,
      };
      if (payload?.username?.includes("@")) {
        normalizedPayload.email = payload.username;
      } else {
        normalizedPayload.username = payload?.username;
      }

      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/auth/login",
        normalizedPayload,
      );

      const accessToken = res?.data?.data?.accessToken;
      const refreshToken = res?.data?.data?.refreshToken;
      const user = res?.data?.data?.user
        ? {
            ...res.data.data.user,
            firstname: res.data.data.user.firstName || "",
            lastname: res.data.data.user.lastName || "",
          }
        : null;

      if (accessToken) {
        getAuthTokenCookieNames().forEach((cookieName) => {
          setCookie({}, cookieName, accessToken, { path: "/" });
        });
      }
      if (refreshToken) {
        getRefreshTokenCookieNames().forEach((cookieName) => {
          setCookie({}, cookieName, refreshToken, { path: "/" });
        });
      }

      return {
        ...res,
        data: {
          token: accessToken,
          refreshToken: refreshToken || null,
          user: user || null,
        },
      };
    } catch (err) {
      throw err;
    }
  }

  static async register(payload) {
    try {
      const roleMap = {
        "2": "EDUCATOR",
        "3": "LEARNER",
        EDUCATOR: "EDUCATOR",
        INSTRUCTOR: "EDUCATOR",
        LEARNER: "LEARNER",
        STUDENT: "LEARNER",
      };

      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/auth/register",
        {
          username: payload?.username,
          email: payload?.email,
          password: payload?.password,
          firstName: payload?.firstname,
          lastName: payload?.lastname,
          role:
            roleMap[String(payload?.role || "").toUpperCase()] ||
            roleMap[payload?.role] ||
            "LEARNER",
        },
      );

      const accessToken = res?.data?.data?.accessToken || null;
      const refreshToken = res?.data?.data?.refreshToken || null;
      if (accessToken) {
        getAuthTokenCookieNames().forEach((cookieName) => {
          setCookie({}, cookieName, accessToken, { path: "/" });
        });
      }
      if (refreshToken) {
        getRefreshTokenCookieNames().forEach((cookieName) => {
          setCookie({}, cookieName, refreshToken, { path: "/" });
        });
      }

      return {
        ...res,
        data: {
          token: accessToken,
          refreshToken: refreshToken || null,
          user: res?.data?.data?.user
            ? {
                ...res.data.data.user,
                firstname: res.data.data.user.firstName || "",
                lastname: res.data.data.user.lastName || "",
              }
            : null,
        },
      };
    } catch (err) {
      throw err;
    }
  }

  // ── 2FA ────────────────────────────────────────────────────────────────────

  static async get2FAStatus() {
    try {
      const res = await BaseApi.get(
        process.env.NEXT_PUBLIC_API_URL + "/2fa-status",
      );
      return res;
    } catch (err) {
      throw err;
    }
  }

  static async setup2FA() {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/setup-2fa",
      );
      return res;
    } catch (err) {
      throw err;
    }
  }

  static async confirm2FA(code) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/confirm-2fa",
        { code },
      );
      return res;
    } catch (err) {
      throw err;
    }
  }

  static async verify2FA(payload) {
    try {
      // ✅ FIX: payload is already an object { pre_auth_token, code }
      // Don't wrap it again - just pass it directly
      const res = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/verify-2fa`,
        payload, // ✅ Already { pre_auth_token, code }
      );

      // ✅ Store the token
      if (res?.data?.token) {
        getAuthTokenCookieNames().forEach((cookieName) => {
          setCookie({}, cookieName, res.data.token, {
            path: "/",
          });
        });
      }

      return res;
    } catch (err) {
      console.error("Verify 2FA error:", err);
      throw err;
    }
  }

  static async disable2FA(code) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/disable-2fa",
        { code },
      );
      return res;
    } catch (err) {
      throw err;
    }
  }

  static async redeemBackupCode(preAuthToken, code) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/verify-backup-code",
        { pre_auth_token: preAuthToken, code },
      );
      return res;
    } catch (err) {
      throw err;
    }
  }

  static async regenerateBackupCodes(code) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/regenerate-backup-codes",
        { code },
      );
      return res;
    } catch (err) {
      throw err;
    }
  }
}
