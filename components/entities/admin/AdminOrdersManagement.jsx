import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Search, X } from "lucide-react";
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
  return user?.fullName || user?.username || "Unknown";
}

export default function AdminOrdersManagement() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

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
      const query = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
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
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-sm text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-sm text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                rows.map((order) => {
                  const orderStatus = String(order.status || "").toUpperCase();
                  const first = order.items?.[0]?.course?.title;
                  const extra = (order.items?.length || 0) - 1;
                  return (
                    <tr
                      key={order.id}
                      className="border-t border-slate-100 text-sm"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        #{String(order.id).slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {customerName(order.user)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.user?.email}
                        </p>
                      </td>
                      <td className="max-w-[260px] px-5 py-4 text-slate-700">
                        <p className="truncate">{first || "-"}</p>
                        {extra > 0 && (
                          <p className="text-xs text-slate-500">
                            +{extra} more
                          </p>
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
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedId(order.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#0056d2] hover:bg-[#f4f8fd]"
                        >
                          <Eye className="h-3.5 w-3.5" /> View order details
                        </button>
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
      {selectedId && (
        <OrderDetailsModal
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span
        className={strong ? "font-semibold text-slate-900" : "text-slate-700"}
      >
        {value}
      </span>
    </div>
  );
}

function OrderDetailsModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    BaseApi.get(`${API}/admin/orders/${orderId}`)
      .then((res) => live && setOrder(res?.data?.data || null))
      .catch((error) =>
        toast.error(error?.data?.message || "Failed to load order details."),
      )
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [orderId]);

  const currency = order?.currency || "PHP";
  const orderStatus = String(order?.status || "").toUpperCase();
  const money = (value) => formatMoney(value, currency);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Order details</h3>
            {order && (
              <p className="font-mono text-xs text-slate-500">
                #{String(order.id).slice(-8).toUpperCase()} · {order.id}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-sm text-slate-500">Loading order...</p>
        ) : !order ? (
          <p className="py-8 text-sm text-slate-500">Order not found.</p>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Customer
                </p>
                <p className="font-semibold text-slate-900">
                  {customerName(order.user)}
                </p>
                <p className="text-sm text-slate-500">{order.user?.email}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Status
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[orderStatus] || STATUS_STYLES.CANCELLED}`}
                >
                  {orderStatus === "CREATED" ? "PENDING" : orderStatus}
                </span>
                <p className="mt-2 text-sm text-slate-500">
                  Placed {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">
                Items ({order.items?.length || 0})
              </p>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 p-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {item.course?.title || "Course"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Instructor:{" "}
                        {item.educator?.fullName ||
                          item.educator?.username ||
                          "-"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Platform fee {money(item.platformFeeAmount)} · Educator
                        earning {money(item.educatorEarning)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {money(item.totalAmount)}
                      </p>
                      {Number(item.discountAmount) > 0 && (
                        <p className="text-xs text-slate-500">
                          -{money(item.discountAmount)} discount
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Summary
                </p>
                <Row label="Subtotal" value={money(order.subtotalAmount)} />
                <Row
                  label={
                    order.coupon?.code
                      ? `Discount (${order.coupon.code})`
                      : "Discount"
                  }
                  value={`-${money(order.discountAmount)}`}
                />
                <Row label="Tax" value={money(order.taxAmount)} />
                <Row
                  label="Platform fee"
                  value={money(order.platformFeeAmount)}
                />
                <Row
                  label="Educator earnings"
                  value={money(order.educatorEarnings)}
                />
                <div className="mt-1 border-t border-slate-100 pt-1">
                  <Row label="Total" value={money(order.totalAmount)} strong />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Payment
                </p>
                {order.payment ? (
                  <>
                    <Row label="Payment method" value={order.paymentMethod || "-"} strong />
                    <Row label="Provider" value={order.payment.provider} />
                    <Row label="Status" value={order.payment.status} />
                    <Row
                      label="Payer email"
                      value={order.payment.payerEmail || "-"}
                    />
                    <Row
                      label="Provider order"
                      value={order.payment.providerOrderId || "-"}
                    />
                    <Row
                      label="Capture ID"
                      value={order.payment.providerCaptureId || "-"}
                    />
                    <Row
                      label="Captured"
                      value={formatDate(order.payment.capturedAt)}
                    />
                  </>
                ) : (
                  <p className="text-sm text-slate-500">No payment recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
