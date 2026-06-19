import ProfileManagementLayout from "@/components/partials/ProfileManagementLayout";
import BaseApi from "@/lib/api/_base.api";
import { useEffect, useState } from "react";

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

export default function ProfileActivityPage() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoading(true);
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me/activity`,
          { params: { page: 1, limit: 50 } },
        );
        setRows(Array.isArray(response?.data?.data) ? response.data.data : []);
      } catch (_error) {
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, []);

  return (
    <ProfileManagementLayout>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
          {isLoading ? (
            <p className="p-4 text-sm text-gray-500">Loading activity...</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No recent activity found.</p>
          ) : (
            <ul className="divide-y divide-[#e2e8f0]">
              {rows.map((row) => (
                <li key={row.id} className="p-4">
                  <p className="text-sm font-semibold text-on-surface">
                    {row.title}
                    {row?.course?.slug ? (
                      <a
                        href={`/courses/${row.course.slug}`}
                        className="ml-2 text-primary hover:underline"
                      >
                        {row.course.title}
                      </a>
                    ) : null}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {formatDate(row.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </ProfileManagementLayout>
  );
}

