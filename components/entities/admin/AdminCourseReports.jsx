import BaseApi from "@/lib/api/_base.api";
import modalState from "@/lib/store/modalState";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const REPORT_STATUS_TABS = [
  { key: "OPEN", label: "Open" },
  { key: "ACTIONED", label: "Actioned" },
  { key: "DISMISSED", label: "Dismissed" },
];

const STATUS_STYLES = {
  OPEN: "bg-amber-50 text-amber-700",
  ACTIONED: "bg-emerald-50 text-emerald-700",
  DISMISSED: "bg-slate-100 text-slate-600",
};

const personName = (user) => user?.fullName || user?.username || user?.email || "Unknown";

export default function AdminCourseReports({ search = "", canSuspend = true }) {
  const [status, setStatus] = useState("OPEN");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/course-reports`,
        { params: { page, limit: 10, status, ...(search ? { search } : {}) } },
      );
      setReports(Array.isArray(response?.data?.data) ? response.data.data : []);
      const meta = response?.data?.meta || response?.data?.pagination || {};
      setPagination({
        total: Number(meta.total || 0),
        totalPages: Math.max(1, Number(meta.totalPages || meta.total_pages || 1)),
      });
    } catch (error) {
      setReports([]);
      toast.error(error?.data?.message || "Failed to fetch reports.");
    } finally {
      setIsLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const openActionModal = (report, action) => {
    setOpenMenuId(null);
    const isSuspend = action === "suspend";
    modalState.setState({
      modalInfo: {
        type: "ADMIN_COURSE_REVIEW_ACTION",
        title: isSuspend ? "Suspend Course" : "Dismiss Report",
        size: "md",
        data: {
          action,
          courseTitle: report.course?.title || "this course",
          onConfirm: async (note) => {
            try {
              const url = isSuspend
                ? `/admin/courses/${report.courseId}/suspend`
                : `/admin/course-reports/${report.id}/dismiss`;
              await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}${url}`, { note });
              toast.success(isSuspend ? "Course suspended." : "Report dismissed.");
              await fetchReports();
            } catch (error) {
              toast.error(error?.data?.message || "Action failed.");
              throw error;
            }
          },
        },
      },
    });
  };

  return (
    <div className="bg-white rounded-[2rem] border border-[#e2e8f0] overflow-hidden">
      <div className="px-6 py-4 flex gap-2 border-b border-[#e2e8f0]">
        {REPORT_STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatus(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
              status === tab.key ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC]/50">
              {["Course", "Reported by", "Issue", "Status", "Date", "Actions"].map((item) => (
                <th
                  key={item}
                  className="px-6 py-5 text-xs font-extrabold uppercase tracking-widest text-slate-500 border-b border-[#e2e8f0]"
                >
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline">
            {reports.map((report) => (
              <tr key={report.id} className="align-top">
                <td className="px-6 py-5 max-w-xs">
                  <p className="font-bold text-sm text-slate-900">{report.course?.title}</p>
                  <p className="text-xs text-slate-500">
                    by {personName(report.course?.educator)}
                  </p>
                  {report.courseOpenReports > 1 && (
                    <p className="text-xs font-semibold text-red-600 mt-1">
                      {report.courseOpenReports} open reports
                    </p>
                  )}
                </td>
                <td className="px-6 py-5 text-sm text-slate-700">{personName(report.reporter)}</td>
                <td className="px-6 py-5 max-w-sm">
                  <p className="text-sm font-semibold text-slate-900">{report.issueLabel}</p>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{report.details}</p>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      STATUS_STYLES[report.status] || STATUS_STYLES.OPEN
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(report.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="relative inline-block text-left">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-md text-xs font-bold border border-[#e2e8f0] text-slate-700 hover:bg-slate-50"
                      onClick={() => setOpenMenuId((prev) => (prev === report.id ? null : report.id))}
                    >
                      Actions
                    </button>
                    {openMenuId === report.id && (
                      <div className="absolute right-0 z-20 mt-2 min-w-[210px] rounded-lg border border-[#e2e8f0] bg-white shadow-lg overflow-hidden">
                        <Link
                          href={`/instructor/courses/${report.course?.slug || report.courseId}/course-details`}
                          className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          onClick={() => setOpenMenuId(null)}
                        >
                          View course details
                        </Link>
                        <Link
                          href={`/instructor/courses/${report.course?.slug || report.courseId}/preview`}
                          className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-t border-[#e2e8f0]"
                          onClick={() => setOpenMenuId(null)}
                        >
                          Preview curriculum
                        </Link>
                        {canSuspend && report.status === "OPEN" && (
                          <>
                            {report.course?.workflowStatus === "PUBLISHED" && (
                              <button
                                type="button"
                                onClick={() => openActionModal(report, "suspend")}
                                className="block w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border-t border-[#e2e8f0]"
                              >
                                Suspend course
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openActionModal(report, "dismiss")}
                              className="block w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-t border-[#e2e8f0]"
                            >
                              Dismiss report
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && reports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                  No {status.toLowerCase()} reports.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 flex items-center justify-between border-t border-[#e2e8f0] text-xs text-slate-500">
        <span>{pagination.total} reports</span>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] disabled:opacity-40"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Prev
          </button>
          <span>
            {page} / {pagination.totalPages}
          </span>
          <button
            className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] disabled:opacity-40"
            disabled={page >= pagination.totalPages || isLoading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
