const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";

export default async function handler(req, res) {
  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect("http://127.0.0.1:3000/settings/payout?paypal=error");
    }

    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    const redirectUri = "http://127.0.0.1:3000/api/paypal/callback";
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const tokenCookieName = process.env.NEXT_PUBLIC_TOKEN; // your auth cookie name

    console.log("🔹 PayPal Callback Start");
    console.log("baseUrl:", baseUrl);
    console.log("code:", code);

    if (!baseUrl) {
      return res.status(500).json({ error: "Missing API_URL env var" });
    }

    // =========================
    // 1. Exchange code → access token
    // =========================
    const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("❌ TOKEN ERROR:", tokenData);
      return res.status(400).json({
        error: "Token exchange failed",
        details: tokenData,
      });
    }

    const accessToken = tokenData.access_token;
    console.log("✅ Access Token received");

    // =========================
    // 2. Get PayPal user info
    // =========================
    const userRes = await fetch(
      `${PAYPAL_API_BASE}/v1/identity/openidconnect/userinfo?schema=openid`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const userInfo = await userRes.json();

    if (!userRes.ok) {
      console.error("❌ USER INFO ERROR:", userInfo);
      return res.status(400).json({
        error: "Userinfo failed",
        details: userInfo,
      });
    }

    const paypalEmail = userInfo.email;
    const paypalAccountId = userInfo.payer_id || userInfo.user_id || null;

    console.log("✅ PayPal User:", { paypalEmail, paypalAccountId });

    if (!paypalEmail) {
      return res.status(400).json({
        error: "No email returned",
        details: userInfo,
      });
    }

    // =========================
    // 3. Extract your user token from cookie
    // =========================
    const cookieHeader = req.headers.cookie || "";

    console.log("req.headers.cookie", req.headers.cookie);
    let userToken = null;

    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => {
          const [key, ...v] = c.split("=");
          return [key, decodeURIComponent(v.join("="))];
        }),
      );
      userToken = cookies[tokenCookieName];
    }

    console.log("🔐 Extracted Token:", userToken ? "FOUND" : "NOT FOUND");

    if (!userToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User token cookie not found",
      });
    }

    // =========================
    // 4. Save to backend
    // =========================
    console.log("🔹 Saving to backend...");

    const saveRes = await fetch(`${baseUrl}/payout-accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        provider: "paypal",
        email: paypalEmail,
        accountId: paypalAccountId,
      }),
    });

    const saveData = await saveRes.json().catch(() => ({}));

    console.log("➡️ POST:", `${baseUrl}/payout-accounts`);
    console.log("📦 RESPONSE STATUS:", saveRes.status);
    console.log("📦 RESPONSE DATA:", saveData);

    if (!saveRes.ok) {
      return res.status(500).json({
        error: "Save failed",
        details: saveData,
      });
    }

    console.log("✅ Saved successfully");

    // =========================
    // 5. Redirect back to FE
    // =========================
    return res.redirect(
      "http://127.0.0.1:3000/settings/payout?paypal=connected",
    );
  } catch (e) {
    console.error("❌ CALLBACK CRASH:", e);

    return res.status(500).json({
      error: "Callback handler crashed",
      details: e?.message || JSON.stringify(e, null, 2),
    });
  }
}
