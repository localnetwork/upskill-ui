import Link from "next/link";
import {
  Clock,
  Globe,
  KeyRound,
  MapPin,
  Network,
  ShieldAlert,
} from "lucide-react";
import NotificationAvatar, {
  getDeviceIcon,
  getNotificationMeta,
  getPersonFromNotification,
} from "./NotificationVisual";

const PROVIDER_LABELS = {
  password: "Email and password",
  google: "Google",
  "2fa_totp": "Authenticator app (2FA)",
  "2fa_backup_code": "Backup code (2FA)",
};

function formatMoney(value, currency = "PHP") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency || "PHP",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function personName(person) {
  const full = `${person?.firstName || ""} ${person?.lastName || ""}`.trim();
  return full || person?.username || "Someone";
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#eef2f7] last:border-b-0">
      <span className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#475569] flex items-center justify-center flex-shrink-0">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
          {label}
        </p>
        <p className="text-sm font-semibold text-[#0f172a] break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function LoginDetails({ notification }) {
  const metadata = notification.metadata || {};
  const DeviceIcon = getDeviceIcon(metadata.deviceName);
  const lat = Number(metadata.latitude);
  const lon = Number(metadata.longitude);
  const hasCoordinates =
    metadata.latitude != null &&
    metadata.longitude != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lon);
  const mapSrc = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.06},${lat - 0.04},${lon + 0.06},${lat + 0.04}&layer=mapnik&marker=${lat},${lon}`
    : null;

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-xl overflow-hidden border border-[#e2e8f0] bg-[#f8fafc]">
        {mapSrc ? (
          <>
            <iframe
              title="Sign-in location"
              src={mapSrc}
              className="w-full h-64 border-0"
              loading="lazy"
            />
            <div className="px-4 py-2 text-xs text-[#64748b] flex items-center justify-between">
              <span>Approximate location based on IP address</span>
              <a
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=11/${lat}/${lon}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary font-semibold hover:underline"
              >
                View larger map
              </a>
            </div>
          </>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-[#64748b] text-sm gap-2">
            <MapPin size={22} />
            <span>Map unavailable for this sign-in</span>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#e2e8f0] px-4">
        <DetailRow
          icon={DeviceIcon}
          label="Device"
          value={metadata.deviceName}
        />
        <DetailRow
          icon={MapPin}
          label="Location"
          value={metadata.locationLabel}
        />
        <DetailRow
          icon={Network}
          label="IP address"
          value={metadata.ipAddress}
        />
        <DetailRow icon={Globe} label="Network provider" value={metadata.isp} />
        <DetailRow
          icon={KeyRound}
          label="Sign-in method"
          value={PROVIDER_LABELS[metadata.provider] || metadata.provider}
        />
        <DetailRow
          icon={Clock}
          label="Time"
          value={`${formatDateTime(notification.createdAt)}${metadata.timezone ? ` (${metadata.timezone})` : ""}`}
        />
        <DetailRow
          icon={DeviceIcon}
          label="Browser details"
          value={metadata.userAgent}
        />
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 flex gap-3">
        <ShieldAlert
          size={20}
          className="text-amber-600 flex-shrink-0 mt-0.5"
        />
        <div className="text-sm text-amber-900">
          <p className="font-semibold">Wasn&apos;t you?</p>
          <p className="mt-0.5">
            Change your password right away and review your trusted devices.
          </p>
          <Link
            href="/settings"
            className="inline-block mt-2 font-semibold text-amber-800 underline"
          >
            Open account settings
          </Link>
        </div>
      </div>
    </div>
  );
}

function FriendRequestDetails({ notification, onAction, isActionLoading }) {
  const metadata = notification.metadata || {};
  const person = getPersonFromNotification(notification);
  const isPending =
    metadata.notificationKind === "FRIEND_REQUEST" &&
    metadata.requestStatus === "PENDING" &&
    Boolean(metadata.friendRequestId);
  const status = String(metadata.requestStatus || "").toUpperCase();

  return (
    <div className="mt-6 rounded-xl border border-[#e2e8f0] p-5 flex items-center gap-4">
      <NotificationAvatar notification={notification} size={72} />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-[#0f172a] truncate">
          {personName(person)}
        </p>
        {person?.username ? (
          <p className="text-sm text-[#64748b]">@{person.username}</p>
        ) : null}
        {!isPending && status ? (
          <span
            className={`inline-block mt-2 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
              status === "ACCEPTED"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {status === "ACCEPTED" ? "Accepted" : "Declined"}
          </span>
        ) : null}
        {isPending ? (
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onAction("ACCEPT")}
              disabled={isActionLoading}
              className="px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => onAction("DECLINE")}
              disabled={isActionLoading}
              className="px-4 py-2 rounded-md border border-[#cbd5e1] text-[#334155] text-sm font-semibold hover:bg-[#f8fafc] disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OrderDetails({ notification }) {
  const order = notification.metadata?.order;
  if (!order) {
    return notification.metadata?.orderId ? (
      <div className="mt-6">
        <Link
          href="/my-orders"
          className="text-primary font-semibold hover:underline"
        >
          View my orders
        </Link>
      </div>
    ) : null;
  }

  return (
    <div className="mt-6 rounded-xl border border-[#e2e8f0] overflow-hidden">
      <div className="px-4 py-3 bg-[#f8fafc] flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-[#0f172a]">
          Order #{String(order.id).slice(-10).toUpperCase()}
        </span>
        <span className="text-[#64748b]">
          {formatDateTime(order.createdAt)}
        </span>
      </div>
      <div className="divide-y divide-[#eef2f7]">
        {order.items.map((item) => (
          <div key={item.id} className="p-4 flex items-center gap-4">
            <div className="w-24 h-16 rounded-lg overflow-hidden bg-[#f1f5f9] flex-shrink-0">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#0f172a] line-clamp-2">
                {item.title}
              </p>
              {item.instructor ? (
                <p className="text-xs text-[#64748b] mt-0.5">
                  Instructor: {item.instructor}
                </p>
              ) : null}
            </div>
            <p className="font-bold text-[#0f172a]">
              {formatMoney(item.totalAmount, order.currency)}
            </p>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 bg-[#f8fafc] space-y-1 text-sm">
        {order.paymentMethod ? (
          <div className="flex justify-between text-[#475569]">
            <span>Payment method</span>
            <span className="font-semibold text-[#0f172a]">
              {order.paymentMethod}
            </span>
          </div>
        ) : null}
        {Number(order.discountAmount) > 0 ? (
          <div className="flex justify-between text-[#475569]">
            <span>Discount</span>
            <span>-{formatMoney(order.discountAmount, order.currency)}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-base font-extrabold text-[#0f172a] pt-1">
          <span>Total</span>
          <span>{formatMoney(order.totalAmount, order.currency)}</span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-[#eef2f7]">
        <Link
          href="/my-orders"
          className="text-primary text-sm font-semibold hover:underline"
        >
          View in My Orders
        </Link>
      </div>
    </div>
  );
}

export default function NotificationDetails({
  notification,
  message,
  onFriendRequestAction,
  isActionLoading,
}) {
  const meta = getNotificationMeta(notification);
  const isFriend =
    meta.kind === "FRIEND_REQUEST" || meta.kind === "FRIEND_REQUEST_RESPONSE";

  return (
    <article className="border border-[#e2e8f0] rounded-lg p-6 bg-white">
      <div className="flex items-start gap-4">
        {isFriend ? null : (
          <NotificationAvatar notification={notification} size={52} />
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
            {meta.label}
          </p>
          <h1 className="text-2xl font-bold text-on-surface">
            {notification.title}
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            {formatDateTime(notification.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 text-[15px] leading-relaxed text-[#334155] whitespace-pre-wrap">
        {message}
      </div>

      {meta.kind === "SECURITY_NEW_DEVICE_LOGIN" ? (
        <LoginDetails notification={notification} />
      ) : null}
      {isFriend ? (
        <FriendRequestDetails
          notification={notification}
          onAction={onFriendRequestAction}
          isActionLoading={isActionLoading}
        />
      ) : null}
      {meta.kind === "ORDER" ? (
        <OrderDetails notification={notification} />
      ) : null}
      {notification.metadata?.link &&
      String(meta.kind || "").startsWith("COMMUNITY_") ? (
        <div className="mt-6">
          <Link
            href={notification.metadata.link}
            className="text-primary font-semibold hover:underline"
          >
            View in community
          </Link>
        </div>
      ) : null}
    </article>
  );
}
