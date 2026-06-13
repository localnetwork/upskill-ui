import { getAuthTokenFromCookieHeader } from "@/lib/services/authToken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBaseUrl) {
    return res.status(500).json({ message: "Missing NEXT_PUBLIC_API_URL" });
  }

  const courseSlug = String(req.body?.courseSlug || "").trim();
  if (!courseSlug) {
    return res.status(400).json({ message: "courseSlug is required" });
  }

  const authHeader = String(req.headers.authorization || "");
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const cookieToken = getAuthTokenFromCookieHeader(req.headers.cookie || "");
  const accessToken = bearerToken || cookieToken;

  if (!accessToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/certifications/courses/${encodeURIComponent(courseSlug)}/generate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(response.status).json(
        payload || {
          message: "Failed to generate certificate",
        },
      );
    }

    return res.status(response.status).json(payload);
  } catch (_error) {
    return res.status(500).json({ message: "Failed to generate certificate" });
  }
}
