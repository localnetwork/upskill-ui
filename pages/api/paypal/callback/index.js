const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";

export default async function handler(req, res) {
  try {
    const { code, error, state } = req.query;

    if (error) {
      return res.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/settings/payouts?paypal=error`,
      );
    }

    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const redirectUri = `${baseUrl}/api/paypal/callback`;

    // 1) Exchange code for access token
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
      return res
        .status(400)
        .json({ error: "Token exchange failed", details: tokenData });
    }

    // 2) Fetch email from userinfo
    const userRes = await fetch(
      `${PAYPAL_API_BASE}/v1/identity/openidconnect/userinfo?schema=openid`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    );

    const userInfo = await userRes.json();
    if (!userRes.ok) {
      return res
        .status(400)
        .json({ error: "Userinfo failed", details: userInfo });
    }

    const paypalEmail = userInfo.email;
    const paypalAccountId = userInfo.payer_id || userInfo.user_id || null;

    if (!paypalEmail) {
      return res
        .status(400)
        .json({ error: "No email returned", details: userInfo });
    }

    // 3) Save to YOUR endpoint
    const saveRes = await fetch(
      `${baseUrl}/api/instructors/payout-methods/paypal`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypalEmail, paypalAccountId }),
      },
    );

    if (!saveRes.ok) {
      const details = await saveRes.json().catch(() => ({}));
      return res.status(500).json({ error: "Failed saving to DB", details });
    }

    // 4) Redirect back
    return res.redirect(`${baseUrl}/settings/payouts?paypal=connected`);
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Callback handler crashed", details: String(e) });
  }
}
