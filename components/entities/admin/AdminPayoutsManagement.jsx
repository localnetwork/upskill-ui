import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";

const API = process.env.NEXT_PUBLIC_API_URL;

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getPayoutStatusClass(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "EXECUTED") return "bg-emerald-100 text-emerald-700";
  if (normalized === "APPROVED") return "bg-sky-100 text-sky-700";
  if (normalized === "REJECTED") return "bg-rose-100 text-rose-700";
  if (normalized === "FAILED") return "bg-orange-100 text-orange-700";
  return "bg-amber-100 text-amber-700";
}

const HEADERS = ["Instructor", "Amount", "Status", "Requested", "Reviewed"];

export default function AdminPayoutsManagement({ onChange }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isRunningAutoProcess, setIsRunningAutoProcess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) query.set("status", status);
      const res = await BaseApi.get(`${API}/payouts/admin?${query.toString()}`);
      setRows(res?.data?.data || []);
      setMeta(res?.data?.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load payout requests.");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAll = async () => {
    await load();
    onChange?.();
  };

  const runAutoProcess = async () => {
    setIsRunningAutoProcess(true);
    try {
      const res = await BaseApi.post(`${API}/payouts/admin/auto-process`);
      const result = res?.data?.data;
      toast.success(
        `Auto process done: ${Number(result?.createdRequests || 0)} created, ${Number(result?.skippedEducators || 0)} skipped.`,
      );
      await refreshAll();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to run auto payout process.");
    } finally {
      setIsRunningAutoProcess(false);
    }
  };

  const handleAction = async (action, payoutId) => {
    let payload = {};

    if (action === "reject") {
      const reviewNote = window.prompt("Rejection note (required):", "") || "";
      if (!reviewNote.trim()) {
        toast.error("Rejection note is required.");
        return;
      }
      payload = { reviewNote: reviewNote.trim() };
    }

    if (action === "approve") {
      const reviewNote = window.prompt("Approval note (optional):", "") || "";
      if (reviewNote.trim()) payload = { reviewNote: reviewNote.trim() };
    }

    try {
      await BaseApi.post(`${API}/payouts/admin/${payoutId}/${action}`, payload);
      toast.success(`Payout ${action}d.`);
      await refreshAll();
    } catch (error) {
      toast.error(error?.data?.message || `Failed to ${action} payout.`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
          >
            <option value="">All statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="EXECUTED">Executed</option>
            <option value="REJECTED">Rejected</option>
            <option value="FAILED">Failed</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="rounded-md border border-[#0056d2] px-4 py-2 text-sm font-semibold text-[#0056d2]"
          >
            Refresh
          </button>
        </div>

        <button
          type="button"
          onClick={runAutoProcess}
          disabled={isRunningAutoProcess}
          className="rounded-full bg-[#0056d2] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isRunningAutoProcess ? "Processing..." : "Run auto payout process"}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {HEADERS.map((header) => (
                  <th
                    key={header}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {header}
                  </th>
                ))}
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-sm text-slate-500">
                    Loading payout requests...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-sm text-slate-500">
                    No payout requests found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const rowStatus = String(row?.status || "").toUpperCase();
                  return (
                    <tr key={row.id} className="border-t border-[#e2e8f0]">
                      <td className="px-5 py-4 text-sm">
                        <p className="font-semibold text-slate-900">
                          {row?.educator?.username || "Unknown"}
                        </p>
                        <p className="text-slate-500">{row?.educator?.email || "-"}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#0056d2]">
                        {formatCurrency(row?.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPayoutStatusClass(rowStatus)}`}
                        >
                          {rowStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatDate(row?.requestedAt || row?.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        {formatDate(row?.reviewedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-2">
                          {rowStatus === "REQUESTED" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAction("approve", row.id)}
                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAction("reject", row.id)}
                                className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {["APPROVED", "FAILED"].includes(rowStatus) && (
                            <button
                              type="button"
                              onClick={() => handleAction("execute", row.id)}
                              className="rounded-md bg-[#0056d2] px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Execute
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-5 py-3">
        <p className="text-sm text-slate-500">
          Total: {Number(meta?.total || 0)} payout requests
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={Number(meta?.page || 1) <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-slate-700">
            Page {Number(meta?.page || 1)} / {Math.max(Number(meta?.totalPages || 1), 1)}
          </span>
          <button
            type="button"
            disabled={Number(meta?.page || 1) >= Math.max(Number(meta?.totalPages || 1), 1)}
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
