import BaseApi from "../_base.api";
import { setCookie, destroyCookie, parseCookies } from "nookies";

export default class AUTHAPI {
  static async login(payload) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/login",
        payload,
      );

      // ✅ ONLY set cookie if real token exists (no 2FA)
      if (res.data?.token) {
        setCookie({}, process.env.NEXT_PUBLIC_TOKEN, res.data.token, {
          path: "/",
        });
      }

      return res;
    } catch (err) {
      throw err;
    }
  }

  static async register(payload) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/register",
        payload,
      );
      setCookie({}, process.env.NEXT_PUBLIC_TOKEN, res.data.token, {
        path: "/",
      });
      return res;
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
        setCookie({}, process.env.NEXT_PUBLIC_TOKEN, res.data.token, {
          path: "/",
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
}
