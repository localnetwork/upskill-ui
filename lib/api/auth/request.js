import BaseApi from "../_base.api";
import { setCookie, destroyCookie, parseCookies } from "nookies";
export default class AUTHAPI {
  static async login(payload) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/login",
        payload
      );
      setCookie({}, process.env.NEXT_PUBLIC_TOKEN, res.data.token, {
        path: "/",
      });
      return res;
    } catch (err) {
      throw err;
    }
  }
  static async register(payload) {
    try {
      const res = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/register",
        payload
      );
      setCookie({}, process.env.NEXT_PUBLIC_TOKEN, res.data.token, {
        path: "/",
      });
      return res;
    } catch (err) {
      throw err;
    }
  }
}
