import BaseApi from "@/lib/api/_base.api";

const SESSION_KEY_STORAGE = "upskill:analytics:session-key";

function randomSessionKey() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getAnalyticsSessionKey() {
  if (typeof window === "undefined") return "server-session";
  const existing = window.localStorage.getItem(SESSION_KEY_STORAGE);
  if (existing) return existing;
  const created = randomSessionKey();
  window.localStorage.setItem(SESSION_KEY_STORAGE, created);
  return created;
}

export async function trackAnalyticsEvent(payload) {
  if (typeof window === "undefined") return;
  const eventType = String(payload?.eventType || "").trim();
  if (!eventType) return;

  try {
    await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/analytics/events`, {
      eventType,
      courseId: payload?.courseId || undefined,
      courseSlug: payload?.courseSlug || undefined,
      pagePath: payload?.pagePath || window.location.pathname,
      sessionKey: getAnalyticsSessionKey(),
      metadata:
        payload?.metadata && typeof payload.metadata === "object"
          ? payload.metadata
          : undefined,
      dedupeWindowSeconds: Number(payload?.dedupeWindowSeconds || 30),
    });
  } catch (_error) {}
}

