export function formatName(user) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    user?.email ||
    "User"
  );
}

export function formatTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return "";
  }
}

export function formatTimeAgo(value) {
  if (!value) return "";
  const now = Date.now();
  const time = new Date(value).getTime();
  const diff = Math.max(0, now - time);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function getFileNameFromPath(path) {
  const raw = String(path || "");
  if (!raw) return "File";
  const clean = raw.split("?")[0];
  const parts = clean.split("/");
  return parts[parts.length - 1] || "File";
}

export function groupMediaByMonth(items = []) {
  const grouped = {};
  for (const item of items) {
    const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) continue;
    const monthKey = createdAt.toLocaleString(undefined, {
      year: "numeric",
      month: "long",
    });
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(item);
  }
  return grouped;
}

export function renderMedia(mediaPath, mediaType) {
  if (!mediaPath) return null;
  if (mediaType === "VIDEO") {
    return (
      <video
        src={mediaPath}
        controls
        className="mt-2 max-h-[320px] w-full rounded-2xl border border-slate-200 bg-black"
      />
    );
  }
  return (
    <img
      src={mediaPath}
      alt="Chat attachment"
      className="mt-2 max-h-[420px] w-full rounded-2xl border border-slate-200 object-cover"
    />
  );
}
