import { parseCookies } from "nookies";

const TOKEN = process.env.NEXT_PUBLIC_TOKEN || "app_token";

let context = null;

export const setContext = (_context) => {
  context = _context;
};

const isServer = () => typeof window === "undefined";

const getToken = () => {
  if (isServer() && context) {
    const serverCookies = context.req?.headers?.cookie;
    if (serverCookies) {
      const parsedCookies = Object.fromEntries(
        serverCookies.split("; ").map((c) => c.split("="))
      );
      return parsedCookies[TOKEN];
    }
  } else {
    // ✅ Client: use nookies
    const cookies = parseCookies();
    return cookies[TOKEN];
  }
};

export default function setup(axios) {
  // 🔵 Request Interceptor

  axios.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    config.headers["Strict-Transport-Security"] = "max-age=31536000";

    return config;
  });

  // 🟠 Response
  axios.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error?.response)
  );
}
