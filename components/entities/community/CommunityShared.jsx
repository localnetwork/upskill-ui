export function isVideoUrl(url) {
  return /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(String(url || ""));
}

export function Avatar({ user, size = 40 }) {
  const name = user?.name || "User";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const style = { width: size, height: size, minWidth: size };
  if (user?.picture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.picture}
        alt={name}
        style={style}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <span
      style={{ ...style, fontSize: size / 2.6 }}
      className="inline-flex items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600"
    >
      {initials || "U"}
    </span>
  );
}

export const COMMUNITY_BADGES = [
  { label: "New Member", description: "Recently joined the group." },
  { label: "Founding Member", description: "Helped establish or grow a newly created group." },
  { label: "Rising Star", description: "A newer member who makes engaging contributions." },
  { label: "Conversation Starter", description: "Starts engaging discussions that attract participation." },
  { label: "Visual Storyteller", description: "Shares engaging photos and videos." },
  { label: "Valued Responder", description: "Provides helpful answers to other members." },
  { label: "Group Ambassador", description: "Helps grow the group by inviting members or sharing it." },
  { label: "Group Expert", description: "A member recognized for expertise in a particular subject." },
];

export function RoleBadge({ role, badge }) {
  const badgeInfo = COMMUNITY_BADGES.find((b) => b.label === badge);
  return (
    <>
      {role === "ADMIN" ? (
        <span title="Manages the group, its settings, and membership." className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
          Admin
        </span>
      ) : null}
      {role === "MODERATOR" ? (
        <span title="Helps manage posts, comments, and members." className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
          Moderator
        </span>
      ) : null}
      {badge && role !== "ADMIN" ? (
        <span title={badgeInfo?.description} className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
          {badge}
        </span>
      ) : null}
    </>
  );
}

export function timeAgo(value) {
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff)) return "";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function errorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || error?.data?.message || fallback;
}
