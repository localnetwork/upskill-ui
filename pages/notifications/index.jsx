import BaseApi from "@/lib/api/_base.api";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const TYPE_OPTIONS = [
  { label: "All Types", value: "ALL" },
  { label: "Enrollment", value: "ENROLLMENT" },
  { label: "Order", value: "ORDER" },
  { label: "Payout", value: "PAYOUT" },
  { label: "Course Approval", value: "COURSE_APPROVAL" },
  { label: "Course Review", value: "COURSE_REVIEW" },
  { label: "System", value: "SYSTEM" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
];

const KIND_OPTIONS = [
  { label: "All Notifications", value: "ALL" },
  { label: "Welcome Message", value: "COURSE_WELCOME_MESSAGE" },
  {
    label: "Congratulations Message",
    value: "COURSE_CONGRATULATIONS_MESSAGE",
  },
  { label: "New Enrollment", value: "COURSE_NEW_ENROLLMENT" },
];

function toRelativeTime(dateValue) {
  if (!dateValue) return "Just now";
  const now = Date.now();
  const ts = new Date(dateValue).getTime();
  if (Number.isNaN(ts)) return "Just now";
  const diffSeconds = Math.max(1, Math.floor((now - ts) / 1000));

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

function notificationTypeLabel(notification) {
  const kind = notification?.metadata?.notificationKind;
  if (kind === "COURSE_WELCOME_MESSAGE") return "Welcome";
  if (kind === "COURSE_CONGRATULATIONS_MESSAGE") return "Congratulations";
  if (kind === "COURSE_NEW_ENROLLMENT") return "New Enrollment";
  return String(notification?.type || "Notification")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function NotificationsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("all");
  const [kind, setKind] = useState("ALL");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
          {
            params: {
              page,
              limit: pagination.limit,
              ...(search ? { q: search } : {}),
              ...(type !== "ALL" ? { type } : {}),
              ...(status !== "all" ? { read: status } : {}),
              ...(kind !== "ALL" ? { kind } : {}),
            },
          },
        );

        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setNotifications(rows);
        const rawMeta = response?.data?.pagination || response?.data?.meta || {};
        setPagination((prev) => ({
          page: Number(rawMeta.page || prev.page || 1),
          limit: Number(rawMeta.limit || prev.limit || 10),
          total: Number(rawMeta.total || 0),
          total_pages: Math.max(
            1,
            Number(rawMeta.total_pages || rawMeta.totalPages || 1),
          ),
        }));
      } catch (_error) {
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [page, search, type, status, kind]);

  const totalPages = Math.max(1, Number(pagination.total_pages || 1));
  const currentPage = Math.min(
    Math.max(1, Number(pagination.page || 1)),
    totalPages,
  );
  const visiblePages = useMemo(() => {
    const spread = 2;
    const pages = [];
    const start = Math.max(1, currentPage - spread);
    const end = Math.min(totalPages, currentPage + spread);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <main className="mt-16 px-4 pt-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-secondary mb-4">Notifications</h1>

      <div className="relative w-full mb-4">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-[#6b7280]" />
        </div>
        <input
          className="w-full h-12 pl-12 pr-4 bg-[#F8FAFC] rounded-full text-[#475569] placeholder:text-[#94a3b8] focus:ring-2 focus:ring-[#6b7280]/20 transition-all"
          placeholder="Search notifications..."
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <select
          className="border border-[#e2e8f0] rounded-lg px-3 py-2"
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="border border-[#e2e8f0] rounded-lg px-3 py-2"
          value={kind}
          onChange={(e) => {
            setPage(1);
            setKind(e.target.value);
          }}
        >
          {KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="border border-[#e2e8f0] rounded-lg px-3 py-2"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`notification-loading-${index}`}
              className="border border-[#e2e8f0] rounded-lg p-4 animate-pulse"
            >
              <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-full bg-gray-200 rounded mb-2" />
              <div className="h-3 w-28 bg-gray-200 rounded" />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="border border-[#e2e8f0] rounded-lg p-10 text-center text-[#64748b]">
            No notifications found.
          </div>
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`relative border rounded-lg p-4 transition-colors ${
                notification?.readAt
                  ? "border-[#e2e8f0] bg-white"
                  : "border-blue-100 bg-blue-50/50"
              }`}
            >
              {!notification?.readAt ? (
                <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary" />
              ) : null}
              <div className="pr-6">
                <h3 className="font-bold text-[16px] text-on-surface">
                  {notification.title}
                </h3>
                <p className="text-[14px] text-[#475569] mt-1 leading-relaxed">
                  {notification.message}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest">
                  <span className="text-primary">
                    {notificationTypeLabel(notification)}
                  </span>
                  <span className="text-[#94a3b8]">
                    {toRelativeTime(notification.createdAt)}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-[#64748b]">
          Showing {notifications.length} of {pagination.total} notifications
        </p>
        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md border border-[#e2e8f0] disabled:opacity-50"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              Prev
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                className={`w-10 h-10 rounded-full font-bold ${
                  pageNumber === currentPage
                    ? "bg-primary text-white"
                    : "bg-white border border-[#e2e8f0]"
                }`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              className="px-3 py-2 rounded-md border border-[#e2e8f0] disabled:opacity-50"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
