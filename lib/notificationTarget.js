export function notificationTarget(notification) {
  const kind = String(notification?.metadata?.notificationKind || "");
  const link = notification?.metadata?.link;
  if (kind.startsWith("COMMUNITY_") && typeof link === "string" && link.startsWith("/")) {
    return link;
  }
  return `/notifications/${notification?.id}`;
}
