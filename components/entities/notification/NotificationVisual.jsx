import {
  Bell,
  CreditCard,
  Flame,
  GraduationCap,
  Laptop,
  MessageCircle,
  Megaphone,
  Monitor,
  PartyPopper,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Star,
  Tablet,
  Trophy,
  UserCheck,
  UserPlus,
  UserX,
  Wallet,
} from "lucide-react";

const TONES = {
  blue: "bg-blue-100 text-primary",
  green: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
  slate: "bg-slate-100 text-slate-600",
};

export function getDeviceIcon(deviceName = "") {
  const value = String(deviceName).toLowerCase();
  if (value.includes("iphone") || value.includes("android")) return Smartphone;
  if (value.includes("ipad")) return Tablet;
  if (value.includes("mac") || value.includes("linux")) return Laptop;
  return Monitor;
}

export function getNotificationMeta(notification) {
  const metadata = notification?.metadata || {};
  const kind = metadata.notificationKind;
  const type = notification?.type;

  if (kind === "FRIEND_REQUEST") {
    return { kind, label: "Friend Request", Icon: UserPlus, tone: "blue" };
  }
  if (kind === "FRIEND_REQUEST_RESPONSE") {
    const declined = metadata.requestStatus === "DECLINED";
    return {
      kind,
      label: "Friend Request",
      Icon: declined ? UserX : UserCheck,
      tone: declined ? "slate" : "green",
    };
  }
  if (kind === "SECURITY_NEW_DEVICE_LOGIN") {
    return {
      kind,
      label: "Security",
      Icon: getDeviceIcon(metadata.deviceName),
      tone: "amber",
    };
  }
  if (kind === "COURSE_WELCOME_MESSAGE") {
    return { kind, label: "Welcome", Icon: PartyPopper, tone: "purple" };
  }
  if (kind === "COURSE_CONGRATULATIONS_MESSAGE") {
    return { kind, label: "Congratulations", Icon: Trophy, tone: "amber" };
  }
  if (kind === "COURSE_NEW_ENROLLMENT") {
    return { kind, label: "New Enrollment", Icon: UserPlus, tone: "green" };
  }
  if (kind === "COMMUNITY_POST_COMMENT" || kind === "COMMUNITY_COMMENT_REPLY") {
    return {
      kind,
      label: kind === "COMMUNITY_COMMENT_REPLY" ? "Community Reply" : "Community Comment",
      Icon: MessageCircle,
      tone: "blue",
    };
  }
  if (kind === "LEARNER_NUDGE") {
    return { kind, label: "Reminder", Icon: Flame, tone: "amber" };
  }
  if (kind === "INSTRUCTOR_ANNOUNCEMENT") {
    return { kind, label: "Announcement", Icon: Megaphone, tone: "blue" };
  }

  if (type === "ORDER") {
    const isFree = Boolean(metadata.freeCheckout);
    return {
      kind: "ORDER",
      label: isFree ? "Enrollment" : "Payment",
      Icon: isFree ? GraduationCap : CreditCard,
      tone: "green",
    };
  }
  if (type === "ENROLLMENT") {
    return {
      kind: type,
      label: "Enrollment",
      Icon: GraduationCap,
      tone: "blue",
    };
  }
  if (type === "PAYOUT") {
    return { kind: type, label: "Payout", Icon: Wallet, tone: "green" };
  }
  if (type === "COURSE_REVIEW") {
    return { kind: type, label: "Review", Icon: Star, tone: "amber" };
  }
  if (type === "COURSE_APPROVAL") {
    const rejected = /reject|changes|declin/i.test(
      `${notification?.title || ""} ${metadata.status || ""}`,
    );
    return {
      kind: type,
      label: "Course",
      Icon: rejected ? ShieldAlert : ShieldCheck,
      tone: rejected ? "red" : "blue",
    };
  }
  return { kind: type, label: "System", Icon: Bell, tone: "slate" };
}

export function getPersonFromNotification(notification) {
  const metadata = notification?.metadata || {};
  return metadata.requester || metadata.responder || metadata.sender || null;
}

export function getSenderLabel(notification) {
  const metadata = notification?.metadata || {};
  if (metadata.notificationKind !== "INSTRUCTOR_ANNOUNCEMENT") return "";
  const sender = metadata.sender || {};
  const name =
    `${sender.firstName || ""} ${sender.lastName || ""}`.trim() || sender.username || "Instructor";
  return metadata.courseTitle ? `${name} · ${metadata.courseTitle}` : name;
}

function getInitials(person) {
  const first = String(person?.firstName || "").trim();
  const last = String(person?.lastName || "").trim();
  const initials = `${first.charAt(0)}${last.charAt(0)}`.trim();
  return (initials || String(person?.username || "?").charAt(0)).toUpperCase();
}

export default function NotificationAvatar({ notification, size = 40 }) {
  const meta = getNotificationMeta(notification);
  const person =
    meta.kind === "FRIEND_REQUEST" ||
    meta.kind === "FRIEND_REQUEST_RESPONSE" ||
    meta.kind === "INSTRUCTOR_ANNOUNCEMENT"
      ? getPersonFromNotification(notification)
      : null;
  const dimension = { width: size, height: size };
  const iconSize = Math.round(size * 0.5);

  if (person) {
    return (
      <span className="relative inline-block flex-shrink-0" style={dimension}>
        {person.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.picture}
            alt=""
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span
            className="w-full h-full rounded-full bg-primary text-white flex items-center justify-center font-bold"
            style={{ fontSize: Math.round(size * 0.36) }}
          >
            {getInitials(person)}
          </span>
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white flex items-center justify-center ${TONES[meta.tone]}`}
          style={{
            width: Math.round(size * 0.45),
            height: Math.round(size * 0.45),
          }}
        >
          <meta.Icon size={Math.round(size * 0.26)} />
        </span>
      </span>
    );
  }

  return (
    <span
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${TONES[meta.tone]}`}
      style={dimension}
    >
      <meta.Icon size={iconSize} />
    </span>
  );
}
