import ORDERAPI from "@/lib/api/orders/request";
import { ChevronDown, Search } from "lucide-react";
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
        setAuthors(Array.isArray(payload?.filters?.authors) ? payload.filters.authors : []);

        const rawMeta = payload?.pagination || payload?.meta || {};
        setPagination((prev) => ({
          page: Number(rawMeta.page || 1),
          limit: Number(rawMeta.limit || prev.limit || 10),
          total: Number(rawMeta.total || 0),
          totalPages: Math.max(1, Number(rawMeta.totalPages || rawMeta.total_pages || 1)),
        }));
      } catch (_error) {
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [page, sort, search, status, authorId]);

  const statusOptions = useMemo(() => DEFAULT_STATUS_OPTIONS, []);
  const authorOptions = useMemo(
    () => [{ id: "ALL", name: "All Authors" }, ...authors],
    [authors],
  );

  const currentPage = Math.min(Math.max(1, pagination.page), Math.max(1, pagination.totalPages));
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

  return (
    <main className="mt-16 px-4 pt-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-secondary mb-2">My Orders</h1>
      <p className="text-[#64748b] mb-6">
        View your purchases. Expand an order to see purchased courses.
      </p>

      <div className="relative w-full mb-4">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-[#6b7280]" />
        </div>
        <input
          className="w-full h-12 pl-12 pr-4 bg-[#F8FAFC] rounded-full text-[#475569] placeholder:text-[#94a3b8] focus:ring-2 focus:ring-[#6b7280]/20 transition-all"
          placeholder="Search by order ID or course title..."
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <select
          className="border border-[#e2e8f0] rounded-lg px-3 py-2"
          value={authorId}
          onChange={(e) => {
            setPage(1);
            setAuthorId(e.target.value);
          }}
        >
          {authorOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
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
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="border border-[#e2e8f0] rounded-lg px-3 py-2"
          value={sort}
          onChange={(e) => {
            setPage(1);
            setSort(e.target.value);
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`order-loading-${index}`}
              className="border border-[#e2e8f0] rounded-lg p-4 animate-pulse"
            >
              <div className="h-4 w-52 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-40 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-64 bg-gray-200 rounded" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="border border-[#e2e8f0] rounded-lg p-10 text-center text-[#64748b]">
            No orders found.
          </div>
        ) : (
          rows.map((order) => {
            const isExpanded = expandedOrderIds.includes(order.id);
            const totalItems = Array.isArray(order.items) ? order.items.length : 0;

            return (
              <article
                key={order.id}
                className="border border-[#e2e8f0] rounded-lg bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleExpanded(order.id)}
                  className="w-full text-left p-4 hover:bg-[#f8fafc] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-[16px] text-on-surface">
                        Order #{order.id}
                      </h2>
                      <p className="text-[13px] text-[#64748b] mt-1">
                        {formatDate(order.createdAt)} • {toStatusLabel(order.status)} •{" "}
                        {totalItems} {totalItems === 1 ? "course" : "courses"}
                      </p>
                      <p className="text-[14px] text-[#334155] mt-1">
                        Total: {formatMoney(order.totalAmount, order.currency)}
                      </p>
                    </div>
                    <ChevronDown
                      className={`mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      size={18}
                    />
                  </div>
                </button>

                {isExpanded ? (
                  <div className="border-t border-[#e2e8f0] p-4 bg-[#fcfdff]">
                    {totalItems === 0 ? (
                      <p className="text-sm text-[#64748b]">No courses found in this order.</p>
                    ) : (
                      <ul className="space-y-3">
                        {order.items.map((item) => {
                          const course = item.course || {};
                          const authorName = `${course?.educator?.firstName || ""} ${course?.educator?.lastName || ""}`.trim() || course?.educator?.username || "Unknown author";
                          return (
                            <li
                              key={item.id}
                              className="border border-[#e2e8f0] rounded-lg p-3 bg-white"
                            >
                              <p className="font-semibold text-[15px] text-on-surface">
                                {course.title || "Untitled course"}
                              </p>
                              <p className="text-xs text-[#64748b] mt-1">
                                Author: {authorName}
                              </p>
                              <p className="text-xs text-[#64748b] mt-1">
                                Price: {formatMoney(item.totalAmount, order.currency)}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>

      <div className="mt-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-[#64748b]">
          Showing {rows.length} of {pagination.total} orders
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
