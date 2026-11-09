export function getInitials(fullName) {
  const words = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export function getFirstName(fullName) {
  return String(fullName || "").trim().split(/\s+/)[0] || "";
}
