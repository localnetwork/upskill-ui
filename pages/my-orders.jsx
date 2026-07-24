import ORDERAPI from "@/lib/api/orders/request";
import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Info,
  Search,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_STATUS_OPTIONS = [
  { label: "All Statuses", value: "ALL" },
  { label: "Created", value: "CREATED" },
  { label: "Paid", value: "PAID" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "recent" },
  { label: "Oldest", value: "oldest" },
  { label: "Amount: High to Low", value: "amount_desc" },
  { label: "Amount: Low to High", value: "amount_asc" },
];

function formatMoney(value, currency = "PHP") {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency || "PHP",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

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

function toStatusLabel(status) {
  return String(status || "CREATED")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getOrderItems(order) {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.orderItems)) return order.orderItems;
  if (Array.isArray(order?.courses)) return order.courses;
  return [];
}

function getCourseImage(item) {
  return (
    item?.course?.cover_image?.path ||
    item?.course?.media?.[0]?.storagePath ||
    item?.cover_image?.path ||
    item?.image ||
    "/placeholder-cover.webp"
  );
}

function getCourseTitle(item) {
  return item?.course?.title || item?.title || "Course";
}

function getCourseInstructor(item) {
  const educator = item?.course?.educator || {};
  const authorData = item?.course?.author?.data || {};
  const fullName =
    `${educator?.firstName || authorData?.firstname || ""} ${educator?.lastName || authorData?.lastname || ""}`.trim();
  return fullName || educator?.username || "Instructor";
}

function getOrderId(order) {
  return String(order?.id || order?.orderId || order?.providerOrderId || "");
}

function getOrderStatus(order) {
  return String(order?.status || order?.state || "CREATED").toUpperCase();
}

function getOrderDate(order) {
  return (
    order?.createdAt ||
    order?.created_at ||
    order?.orderDate ||
    order?.updatedAt ||
    order?.updated_at ||
    null
  );
}

function getOrderTotal(order, items = []) {
  const orderTotal =
    order?.totalAmount || order?.total || order?.amount || order?.subtotal;
  if (orderTotal != null) return orderTotal;
  return items.reduce(
    (sum, item) => sum + Number(item?.totalAmount || item?.price || 0),
    0,
  );
}

function getStatusBadgeClass(status) {
  const value = String(status).toUpperCase();
  if (value === "PAID") return "bg-emerald-100 text-emerald-700";
  if (value === "FAILED") return "bg-red-100 text-red-700";
  if (value === "REFUNDED") return "bg-purple-100 text-purple-700";
  if (value === "CANCELLED") return "bg-slate-100 text-slate-500";
  return "bg-amber-100 text-amber-700";
}

export default function MyOrdersPage() {
  const [rows, setRows] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [authorId, setAuthorId] = useState("ALL");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const response = await ORDERAPI.myOrders({
          page,
          limit: pagination.limit,
          sort,
          ...(search ? { q: search } : {}),
          ...(status !== "ALL" ? { status } : {}),
          ...(authorId !== "ALL" ? { authorId } : {}),
        });
        const payload = response?.data || {};
        const data = Array.isArray(payload?.data) ? payload.data : [];
        setRows(data);
        setAuthors(
          Array.isArray(payload?.filters?.authors)
            ? payload.filters.authors
            : [],
        );

        const rawMeta = payload?.pagination || payload?.meta || {};
        setPagination((prev) => ({
          page: Number(rawMeta.page || 1),
          limit: Number(rawMeta.limit || prev.limit || 10),
          total: Number(rawMeta.total || 0),
          totalPages: Math.max(
            1,
            Number(rawMeta.totalPages || rawMeta.total_pages || 1),
          ),
        }));
      } catch (_error) {
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [page, sort, search, status, authorId]);

  useEffect(() => {
    if (!rows.length) {
      setExpandedOrderIds([]);
      return;
    }

    setExpandedOrderIds((prev) => {
      const existing = prev.filter((id) =>
        rows.some((order) => getOrderId(order) === id),
      );
      if (existing.length) return existing;
      return [getOrderId(rows[0])];
    });
  }, [rows]);

  const statusOptions = useMemo(() => DEFAULT_STATUS_OPTIONS, []);
  const authorOptions = useMemo(
    () => [{ id: "ALL", name: "All Authors" }, ...authors],
    [authors],
  );
  const sortOptions = useMemo(() => SORT_OPTIONS, []);

  const currentPage = Math.min(
    Math.max(1, pagination.page),
    Math.max(1, pagination.totalPages),
  );
  const totalPages = Math.max(1, pagination.totalPages);
  const visiblePages = useMemo(() => {
    const spread = 2;
    const pages = [];
    const start = Math.max(1, currentPage - spread);
    const end = Math.min(totalPages, currentPage + spread);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const toggleExpanded = (orderId) => {
    setExpandedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const totalOrders = Number(pagination.total || rows.length || 0);
  const startItem = totalOrders ? (currentPage - 1) * pagination.limit + 1 : 0;
  const endItem = totalOrders
    ? Math.min(currentPage * pagination.limit, totalOrders)
    : 0;

  return (
    <main
      className="min-h-[884px] max-w-7xl mx-auto px-8 py-16"
      data-stitch-vh="min-h-[884px]===min-h-screen"
    >
      {/* Hero Header */}
      <header className="mb-12 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-bold text-xs uppercase tracking-[0.2em] text-on-surface-variant/60 block mb-4">
              Purchase History
            </span>

            <h1 className="text-6xl font-extrabold tracking-tight text-on-background mb-4">
              My Orders
            </h1>

            <p className="text-lg text-on-surface-variant max-w-2xl">
              Manage your learning journey. Review past transactions, download
              invoices, and access your purchased premium courses.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-12 bg-[#f8fafc] p-2 rounded-2xl flex flex-wrap gap-2 items-center border border-[#e2e8f0]/50">
          <div className="flex-1 min-w-[200px] relative px-4 py-2 bg-white rounded-xl border border-outline flex items-center gap-3">
            <Search size={18} className="text-slate-400" />

            <input
              type="text"
              placeholder="Search by order ID or course title..."
              className="w-full border-none p-0 text-sm focus:ring-0 placeholder:text-slate-400"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <select
            className="bg-white border border-outline text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="bg-white border border-outline text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={authorId}
            onChange={(event) => {
              setPage(1);
              setAuthorId(event.target.value);
            }}
          >
            {authorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <select
            className="bg-white border border-outline text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={sort}
            onChange={(event) => {
              setPage(1);
              setSort(event.target.value);
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="space-y-4">
        {isLoading ? (
          <div className="border border-outline rounded-2xl bg-white p-10 text-center text-on-surface-variant">
            Loading orders...
          </div>
        ) : rows.length ? (
          rows.map((order, index) => {
            const orderId = getOrderId(order) || `order-${index + 1}`;
            const orderStatus = getOrderStatus(order);
            const orderItems = getOrderItems(order);
            const orderTotal = getOrderTotal(order, orderItems);
            const isExpanded = expandedOrderIds.includes(orderId);
            const isCancelled = ["CANCELLED", "FAILED"].includes(orderStatus);

            return (
              <div
                key={orderId}
                className={`group border border-outline rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:border-primary/30 ${isExpanded ? "accordion-active" : ""}`}
                id={orderId}
              >
                <div
                  className="p-6 cursor-pointer flex items-center justify-between transition-colors hover:bg-[#f8fafc]"
                  onClick={() => toggleExpanded(orderId)}
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-12 h-12 rounded-xl ${isCancelled ? "bg-slate-100" : "bg-primary-container"} flex items-center justify-center`}
                    >
                      {isCancelled ? (
                        <XCircle size={22} className="text-slate-400" />
                      ) : (
                        <ShoppingBag size={22} className="text-primary" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg">Order #{orderId}</h3>

                        <span
                          className={`${getStatusBadgeClass(orderStatus)} px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider`}
                        >
                          {toStatusLabel(orderStatus)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-on-surface-variant font-medium">
                        <span>{formatDate(getOrderDate(order))}</span>

                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>

                        <span>
                          {orderItems.length}{" "}
                          {orderItems.length === 1 ? "Course" : "Courses"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest mb-0.5">
                        Total Amount
                      </p>

                      <p className="text-xl font-extrabold text-on-background">
                        {formatMoney(orderTotal, order?.currency || "PHP")}
                      </p>
                    </div>

                    <ChevronDown
                      size={20}
                      className={`text-slate-400 accordion-icon transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {isExpanded ? (
                  <div className="accordion-content bg-slate-50/50 border-t border-slate-100">
                    <div className="p-6 space-y-4">
                      {orderItems.map((item, itemIndex) => {
                        const courseImage = getCourseImage(item);
                        const title = getCourseTitle(item);

                        return (
                          <div
                            key={`${orderId}-item-${item?.id || itemIndex}`}
                            className={`flex items-center gap-6 p-4 rounded-xl border border-[#e2e8f099]/60 transition-all ${isCancelled ? "bg-white/60 grayscale opacity-60" : "bg-white group/item hover:shadow-md"}`}
                          >
                            <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 relative">
                              {courseImage === "/placeholder-cover.webp" ? (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <ImageOff size={20} />
                                </div>
                              ) : (
                                <Image
                                  src={courseImage}
                                  alt={title}
                                  fill
                                  className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                                />
                              )}
                            </div>

                            <div className="flex-1">
                              <h4 className="font-bold text-on-background text-lg group-hover/item:text-primary transition-colors">
                                {title}
                              </h4>

                              <p className="text-sm text-on-surface-variant font-medium">
                                Instructor: {getCourseInstructor(item)}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-lg font-bold text-on-background">
                                {formatMoney(
                                  item?.totalAmount || item?.price || 0,
                                  order?.currency || "PHP",
                                )}
                              </span>

                              {isCancelled ? (
                                <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                                  Transaction Void
                                </p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}

                      {isCancelled ? (
                        <div className="p-4 bg-red-50 rounded-xl flex items-center gap-4 border border-red-100">
                          <Info size={18} className="text-red-500" />

                          <p className="text-sm text-red-700 font-medium">
                            This order was cancelled by the user. If you believe
                            this was an error, please contact our support.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="border border-outline rounded-2xl bg-white p-10 text-center text-on-surface-variant">
            No orders found.
          </div>
        )}
      </div>

      {/* Pagination / Footer Stats */}
      <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-[#e2e8f0]/50">
        <p className="text-sm text-on-surface-variant font-medium">
          Showing {startItem} - {endItem} of {totalOrders} orders
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1 || isLoading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-outline text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>

          {visiblePages.map((itemPage) => (
            <button
              key={`page-${itemPage}`}
              onClick={() => setPage(itemPage)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${itemPage === currentPage ? "bg-primary text-on-primary shadow-sm" : "border border-outline text-slate-600 hover:bg-slate-50"}`}
            >
              {itemPage}
            </button>
          ))}

          <button
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-outline text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </main>
  );
}
