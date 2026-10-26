export const SITE_NAME = "Upskill";
export const DEFAULT_DESCRIPTION =
  "Upskill is an affordable online learning platform with project-based courses, expert instructors, and career-focused learning paths.";
export const DEFAULT_OG_IMAGE = "/new-logo.png";

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";
  return String(raw).replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  if (!path) return getSiteUrl();
  if (/^https?:\/\//i.test(path)) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function stripHtml(value) {
  return String(value || "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&ndash;|&mdash;/gi, "-")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(value, max = 160) {
  const text = stripHtml(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

export function mediaUrl(value) {
  const path = typeof value === "string" ? value : value?.path;
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const domain = String(process.env.NEXT_PUBLIC_API_DOMAIN || "").replace(
    /\/+$/,
    "",
  );
  return `${domain}${path.startsWith("/") ? path : `/${path}`}`;
}

// Routes that hold private/transactional content and must not be indexed.
const NOINDEX_PREFIXES = [
  "/cart",
  "/checkout",
  "/profile",
  "/settings",
  "/messages",
  "/notifications",
  "/my-",
  "/employee-dashboard",
  "/instructor",
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-",
  "/offline",
  "/share",
  "/api",
];

export function isNoindexPath(pathname = "") {
  if (/^\/courses\/[^/]+\/(learn|community)/.test(pathname)) return true;
  return NOINDEX_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
