import BaseApi from "../_base.api";
import { setCookie, destroyCookie, parseCookies } from "nookies";
import {
  getAuthTokenCookieNames,
  getRefreshTokenCookieNames,
} from "@/lib/services/authToken";
import {
  buildClientLocationLabel,
  buildClientDeviceName,
  getOrCreateDeviceIdentifier,
  getTrustedDeviceToken,
  setTrustedDeviceToken,
} from "@/lib/services/trustedDevice";

export default class AUTHAPI {
  static async login(payload) {
    try {
      const identifier = String(payload?.username || payload?.email || "").trim();
      const normalizedPayload = {
        trustedDeviceToken: getTrustedDeviceToken() || undefined,
        deviceIdentifier: getOrCreateDeviceIdentifier() || undefined,
        deviceName: buildClientDeviceName(),
        locationLabel: buildClientLocationLabel() || undefined,
      };
      if (identifier.includes("@")) {
        normalizedPayload.email = identifier;
      } else {
        normalizedPayload.username = identifier;
      }

      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/auth/login",
        normalizedPayload,
      );

      const authData = res?.data?.data || res?.data || {};
      if (authData?.requires_email_code) {
        return {
          ...res,
          data: {
            requires_email_code: true,
            email: authData.email,
            masked_email: authData.masked_email,
            expires_in: authData.expires_in,
          },
        };
      }
      const requires2FA =
        authData?.requires_2fa || authData?.status === "requires_2fa";
      if (requires2FA) {
        return {
          ...res,
          data: {
            requires_2fa: true,
            pre_auth_token: authData?.pre_auth_token || null,
            user: authData?.user || null,
          },
        };
      }

      return AUTHAPI.#storeSession(res, authData);
    } catch (err) {
      throw err;
    }
  }

  static #storeSession(res, authData) {
    const accessToken = authData?.accessToken || null;
    const refreshToken = authData?.refreshToken || null;
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
    if (authData?.trustedDeviceToken) {
      setTrustedDeviceToken(authData.trustedDeviceToken);
    }
    return {
      ...res,
      data: {
        token: accessToken,
        refreshToken: refreshToken || null,
        user: authData?.user || null,
      },
    };
  }

  static #deviceFields() {
    return {
      trustedDeviceToken: getTrustedDeviceToken() || undefined,
      deviceIdentifier: getOrCreateDeviceIdentifier() || undefined,
      deviceName: buildClientDeviceName(),
      locationLabel: buildClientLocationLabel() || undefined,
    };
  }

  static async verifyLogin({ email, code }) {
    const res = await BaseApi.post(
      process.env.NEXT_PUBLIC_API_URL + "/auth/login/verify",
      { email, code, ...AUTHAPI.#deviceFields() },
    );
    return AUTHAPI.#storeSession(res, res?.data?.data || res?.data || {});
  }

  // Step 1 of registration: emails a 6-digit code.
  static async register(payload) {
    const roleMap = {
      "2": "EDUCATOR",
      "3": "LEARNER",
      EDUCATOR: "EDUCATOR",
      INSTRUCTOR: "EDUCATOR",
      LEARNER: "LEARNER",
      STUDENT: "LEARNER",
    };

    return BaseApi.post(process.env.NEXT_PUBLIC_API_URL + "/auth/register", {
      fullName: payload?.fullName,
      email: payload?.email,
      role:
        roleMap[String(payload?.role || "").toUpperCase()] ||
        roleMap[payload?.role] ||
        "LEARNER",
    });
  }

  // Step 2 of registration: verifies the code and signs the user in.
  static async verifyRegister({ email, code }) {
    const res = await BaseApi.post(
      process.env.NEXT_PUBLIC_API_URL + "/auth/register/verify",
      { email, code, ...AUTHAPI.#deviceFields() },
    );
    return AUTHAPI.#storeSession(res, res?.data?.data || res?.data || {});
  }


  static async googleAuth(payload) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/auth/google",
        {
          idToken: payload?.idToken,
          intent: payload?.intent,
          mode: payload?.mode,
          trustedDeviceToken: getTrustedDeviceToken() || undefined,
          deviceIdentifier: getOrCreateDeviceIdentifier() || undefined,
          deviceName: buildClientDeviceName(),
          locationLabel: buildClientLocationLabel() || undefined,
        },
      );

      const authData = res?.data?.data || res?.data || {};
      const requires2FA =
        authData?.requires_2fa || authData?.status === "requires_2fa";
      if (requires2FA) {
        return {
          ...res,
          data: {
            requires_2fa: true,
            pre_auth_token: authData?.pre_auth_token || null,
            user: authData?.user || null,
          },
        };
      }

      const accessToken = authData?.accessToken || null;
      const refreshToken = authData?.refreshToken || null;
      const user = authData?.user || null;

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
      if (authData?.trustedDeviceToken) {
        setTrustedDeviceToken(authData.trustedDeviceToken);
      }

      return {
        ...res,
        data: {
          token: accessToken,
          refreshToken: refreshToken || null,
          user,
        },
      };
    } catch (err) {
      throw err;
    }
  }

  static async requestEmailChange(newEmail) {
    return BaseApi.post(
      process.env.NEXT_PUBLIC_API_URL + "/users/me/change-email/request",
      { newEmail },
    );
  }

  static async confirmEmailChange({ newEmail, code }) {
    return BaseApi.post(
      process.env.NEXT_PUBLIC_API_URL + "/users/me/change-email/confirm",
      { newEmail, code },
    );
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
      const res = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/verify-2fa`,
        {
          ...payload,
          deviceIdentifier: getOrCreateDeviceIdentifier() || undefined,
          deviceName: buildClientDeviceName(),
          locationLabel: buildClientLocationLabel() || undefined,
          rememberDevice:
            payload?.rememberDevice === undefined
              ? true
              : Boolean(payload?.rememberDevice),
        },
      );

      const authData = res?.data?.data || res?.data || {};
      const accessToken = authData?.accessToken || authData?.token || null;
      const refreshToken =
        authData?.refreshToken || authData?.refresh_token || null;

      if (accessToken) {
        getAuthTokenCookieNames().forEach((cookieName) => {
          setCookie({}, cookieName, accessToken, {
            path: "/",
          });
        });
      }
      if (refreshToken) {
        getRefreshTokenCookieNames().forEach((cookieName) => {
          setCookie({}, cookieName, refreshToken, {
            path: "/",
          });
        });
      }
      if (authData?.trustedDeviceToken) {
        setTrustedDeviceToken(authData.trustedDeviceToken);
      }

      return {
        ...res,
        data: {
          token: accessToken,
          refreshToken: refreshToken || null,
          user: authData?.user || null,
        },
      };
    } catch (err) {
      throw err;
    }
  }

  static async disable2FA(code) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/disable-2fa",
        { code },
      );
      return {
        ...res,
        data: {
          token: accessToken,
          refreshToken: refreshToken || null,
          user: authData?.user || null,
          backup_codes_remaining: authData?.backup_codes_remaining,
        },
      };
    } catch (err) {
      throw err;
    }
  }

  static async redeemBackupCode(preAuthToken, code, options = {}) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/verify-backup-code",
        {
          pre_auth_token: preAuthToken,
          code,
          deviceIdentifier: getOrCreateDeviceIdentifier() || undefined,
          deviceName: buildClientDeviceName(),
          locationLabel: buildClientLocationLabel() || undefined,
          rememberDevice:
            options?.rememberDevice === undefined
              ? true
              : Boolean(options?.rememberDevice),
        },
      );

      const authData = res?.data?.data || res?.data || {};
      const accessToken = authData?.accessToken || authData?.token || null;
      const refreshToken =
        authData?.refreshToken || authData?.refresh_token || null;

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
      if (authData?.trustedDeviceToken) {
        setTrustedDeviceToken(authData.trustedDeviceToken);
      }

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
