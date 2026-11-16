import BaseApi from "@/lib/api/_base.api";
import { useEffect, useMemo, useState } from "react";
import persistentStore from "@/lib/store/persistentStore";

const LEARNER_PERMISSIONS = ["view-own-learnings"];
const EDUCATOR_PERMISSIONS = [
  "add-course",
  "edit-own-courses",
  "view-own-earnings",
  "view-own-payment-settings",
];

// `permissions: null` means every signed-in user can see the group.
const FILTERS = [
  { key: "ALL", label: "All", permissions: null },
  { key: "AUTH", label: "Auth", permissions: null },
  { key: "ACCOUNT", label: "Account", permissions: null },
  { key: "INSTRUCTOR", label: "Instructor", permissions: EDUCATOR_PERMISSIONS },
  { key: "LEARNING", label: "Learning", permissions: LEARNER_PERMISSIONS },
  { key: "COMMERCE", label: "Commerce", permissions: LEARNER_PERMISSIONS },
  {
    key: "COURSE",
    label: "Course",
    permissions: [...LEARNER_PERMISSIONS, ...EDUCATOR_PERMISSIONS],
  },
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toFilterGroup(eventType) {
  const value = String(eventType || "");
  if (!value) return "OTHER";
  return value.split("_")[0];
}

export default function SettingsActivityLogPage() {
  const [rows, setRows] = useState([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const profile = persistentStore((state) => state.profile);

  const allowedFilters = useMemo(() => {
    const granted = Array.isArray(profile?.permissions) ? profile.permissions : [];
    const isAdmin = granted.includes("admin");
    return FILTERS.filter(
      (filter) =>
        !filter.permissions ||
        isAdmin ||
        filter.permissions.some((permission) => granted.includes(permission)),
    );
  }, [profile?.permissions]);

  const allowedGroups = useMemo(
    () => new Set([...allowedFilters.map((filter) => filter.key), "OTHER"]),
    [allowedFilters],
  );

  useEffect(() => {
    if (!allowedFilters.some((filter) => filter.key === activeFilter)) setActiveFilter("ALL");
  }, [allowedFilters, activeFilter]);

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoadingActivity(true);
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me/activity`,
          {
            params: { page: 1, limit: 50 },
          },
        );
        setRows(Array.isArray(response?.data?.data) ? response.data.data : []);
      } catch (_error) {
        setRows([]);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchActivity();
  }, []);

  const visibleRows = rows.filter((row) => allowedGroups.has(toFilterGroup(row?.eventType)));
  const filteredRows =
    activeFilter === "ALL"
      ? visibleRows
      : visibleRows.filter((row) => toFilterGroup(row?.eventType) === activeFilter);

  return (
    <div className="container py-[50px] max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Activity Log</h1>
      <p className="text-gray-500 mb-8">
        Review your recent account, learning, and instructor actions.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {allowedFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeFilter === filter.key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {isLoadingActivity ? (
          <p className="p-4 text-sm text-gray-500">Loading activity...</p>
        ) : filteredRows.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No recent activity found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredRows.map((row) => (
              <li key={row.id} className="p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {row.title}
                  {row?.course?.slug ? (
                    <a href={`/courses/${row.course.slug}`} className="ml-2 text-primary hover:underline">
                      {row.course.title}
                    </a>
                  ) : null}
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(row.createdAt)}</p>
                {row?.eventType === "AUTH_LOGIN" ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Device: {row?.metadata?.device || "Unknown"} • Location:{" "}
                    {row?.metadata?.location || row?.metadata?.ipAddress || "Unknown"}
                  </p>
                ) : null}
                {row?.pagePath ? <p className="text-xs text-gray-500 mt-1">Path: {row.pagePath}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
