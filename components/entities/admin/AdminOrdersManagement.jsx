import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";

const API = process.env.NEXT_PUBLIC_API_URL;
const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PAID", label: "Paid" },
  { value: "CREATED", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_STYLES = {
  PAID: "bg-emerald-50 text-emerald-700",
  CREATED: "bg-amber-50 text-amber-700",
  FAILED: "bg-rose-50 text-rose-700",
  REFUNDED: "bg-sky-50 text-sky-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

function formatMoney(value, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(
    Number(value || 0),
  );
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function customerName(user) {
  const full = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return full || user?.username || "Unknown";
}

export default function AdminOrdersManagement() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (status) query.set("status", status);
      if (search) query.set("search", search);
      const res = await BaseApi.get(`${API}/admin/orders?${query.toString()}`);
      setRows(res?.data?.data || []);
      setMeta(res?.data?.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(Number(meta?.totalPages || 1), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-[#f4f8fd] p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Order ID, customer or course"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#0056d2]"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none sm:w-48"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <p className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
          {Number(meta?.total || 0).toLocaleString()} orders
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Courses</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-sm text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-sm text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                rows.map((order) => {
                  const orderStatus = String(order.status || "").toUpperCase();
                  const first = order.items?.[0]?.course?.title;
                  const extra = (order.items?.length || 0) - 1;
                  return (
                    <tr key={order.id} className="border-t border-slate-100 text-sm">
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        #{String(order.id).slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {customerName(order.user)}
                        </p>
                        <p className="text-xs text-slate-500">{order.user?.email}</p>
                      </td>
                      <td className="max-w-[260px] px-5 py-4 text-slate-700">
                        <p className="truncate">{first || "-"}</p>
                        {extra > 0 && (
                          <p className="text-xs text-slate-500">+{extra} more</p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {formatMoney(order.totalAmount, order.currency)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[orderStatus] || STATUS_STYLES.CANCELLED}`}
                        >
                          {orderStatus === "CREATED" ? "PENDING" : orderStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-sm text-slate-500">
            Page {Number(meta?.page || page)} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
