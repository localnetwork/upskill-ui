import { getAuthTokenFromCookieHeader } from "../../../../lib/services/authToken";

const PAYPAL_BASE_BY_ENV = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
};

function resolveFrontendBaseUrl(req) {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  const host = req?.headers?.host || "127.0.0.1:3000";
  const protocol = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

function resolveApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  return apiUrl.replace(/\/$/, "");
}

function parseState(state) {
  if (!state) return {};
  try {
    const decoded = Buffer.from(String(state), "base64url").toString("utf8");
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

function buildRedirectUrl(frontendBaseUrl, returnTo, paypalStatus) {
  const safePath = String(returnTo || "/instructor/settings/payout").startsWith("/")
    ? String(returnTo || "/instructor/settings/payout")
    : "/instructor/settings/payout";
  const separator = safePath.includes("?") ? "&" : "?";
  return `${frontendBaseUrl}${safePath}${separator}paypal=${paypalStatus}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const frontendBaseUrl = resolveFrontendBaseUrl(req);
  const statePayload = parseState(req.query?.state);
  const returnTo = statePayload?.returnTo || "/instructor/settings/payout";
  const redirectWithStatus = (paypalStatus) =>
    res.redirect(buildRedirectUrl(frontendBaseUrl, returnTo, paypalStatus));

  try {
    if (req.query?.error) {
      return redirectWithStatus("error");
    }

    const code = req.query?.code;
    if (!code) {
      return redirectWithStatus("error");
    }

    const paypalEnv = String(process.env.PAYPAL_ENV || "sandbox").toLowerCase();
    const paypalBaseUrl = PAYPAL_BASE_BY_ENV[paypalEnv] || PAYPAL_BASE_BY_ENV.sandbox;
    const apiUrl = resolveApiUrl();
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!apiUrl || !clientId || !clientSecret) {
      return redirectWithStatus("error");
    }

    const redirectUri = `${frontendBaseUrl}/api/paypal/callback`;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData?.access_token) {
      return redirectWithStatus("error");
    }

    const userRes = await fetch(
      `${paypalBaseUrl}/v1/identity/openidconnect/userinfo?schema=openid`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    );
    const userInfo = await userRes.json().catch(() => ({}));
    const paypalEmail = userInfo?.email || null;
    const paypalMerchantId = userInfo?.payer_id || userInfo?.user_id || null;

    if (!userRes.ok || !paypalEmail) {
      return redirectWithStatus("error");
    }

    const userToken = getAuthTokenFromCookieHeader(req.headers?.cookie || "");
    if (!userToken) {
      return redirectWithStatus("error");
    }

    const saveRes = await fetch(`${apiUrl}/payouts/account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        paypalEmail,
        paypalMerchantId,
      }),
    });

    if (!saveRes.ok) {
      return redirectWithStatus("error");
    }

    return redirectWithStatus("connected");
  } catch (_error) {
    return redirectWithStatus("error");
  }
}
