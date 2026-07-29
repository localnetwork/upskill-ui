"use client";

import InstructorLayout from "@/components/partials/InstructorLayout";
import PAYOUTAPI from "@/lib/api/payouts/request";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import Link from "next/link";
import { X } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DISPLAY_CURRENCY = "PHP";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: DISPLAY_CURRENCY,
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

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date, withYear = false) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  }).format(date);
}

function getFriendlyStatus(row) {
  const rawStatus = String(row?.status || "").toUpperCase();
  const reviewNote = String(row?.reviewNote || "");
  const paypalBatchStatusMatch = reviewNote.match(
    /PayPal batch status:\s*([A-Z_]+)/i,
  );
  const paypalBatchStatus = String(paypalBatchStatusMatch?.[1] || "").toUpperCase();

  if (rawStatus === "REQUESTED") {
    return { label: "Pending", className: "bg-amber-100 text-amber-700" };
  }

  if (rawStatus === "APPROVED") {
    return { label: "Sent for Payment", className: "bg-blue-100 text-blue-700" };
  }

  if (rawStatus === "EXECUTED") {
    if (paypalBatchStatus && paypalBatchStatus !== "SUCCESS") {
      return { label: "Processing", className: "bg-indigo-100 text-indigo-700" };
    }
    return { label: "Paid", className: "bg-emerald-100 text-emerald-700" };
  }

  if (rawStatus === "REJECTED") {
    return { label: "Rejected", className: "bg-rose-100 text-rose-700" };
  }

  if (rawStatus === "FAILED") {
    return { label: "Failed", className: "bg-orange-100 text-orange-700" };
  }

  return { label: rawStatus || "Pending", className: "bg-slate-100 text-slate-700" };
}

const STATUS_COLORS = {
  EXECUTED: "#16a34a",
  APPROVED: "#2563eb",
  REQUESTED: "#f59e0b",
  FAILED: "#ea580c",
  REJECTED: "#e11d48",
};

const paidEvents = new Set([
  "PAYMENT.PAYOUTS-ITEM.SUCCEEDED",
  "PAYMENT.PAYOUTSBATCH.SUCCESS",
]);
const processingEvents = new Set([
  "PAYMENT.PAYOUTS-ITEM.HELD",
  "PAYMENT.PAYOUTSBATCH.PROCESSING",
]);
const failedEvents = new Set([
  "PAYMENT.PAYOUTS-ITEM.BLOCKED",
  "PAYMENT.PAYOUTS-ITEM.CANCELED",
  "PAYMENT.PAYOUTS-ITEM.FAILED",
  "PAYMENT.PAYOUTS-ITEM.REFUNDED",
  "PAYMENT.PAYOUTS-ITEM.RETURNED",
  "PAYMENT.PAYOUTS-ITEM.UNCLAIMED",
  "PAYMENT.PAYOUTSBATCH.DENIED",
]);

const DEFAULT_WITHDRAWAL_FEE_RATE = 0.02;

function formatEventLabel(eventType) {
  return String(eventType || "")
    .toLowerCase()
    .split(".")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" • ");
}

function getTimelineTone(eventType) {
  if (paidEvents.has(eventType)) {
    return {
      label: "Paid",
      dotClassName: "bg-emerald-500",
      textClassName: "text-emerald-700",
    };
  }
  if (processingEvents.has(eventType)) {
    return {
      label: "Processing",
      dotClassName: "bg-indigo-500",
      textClassName: "text-indigo-700",
    };
  }
  if (failedEvents.has(eventType)) {
    return {
      label: "Failed",
      dotClassName: "bg-rose-500",
      textClassName: "text-rose-700",
    };
  }
  return {
    label: "Update",
    dotClassName: "bg-slate-400",
    textClassName: "text-slate-700",
  };
}

function normalizeTimelineEvents(row) {
  const rawCollections = [
    row?.timeline,
    row?.events,
    row?.webhookEvents,
    row?.paypalEvents,
    row?.calculationSnapshot?.paypalEvents,
  ];
  const rawEvents = rawCollections
    .filter(Array.isArray)
    .flat()
    .filter(Boolean);

  if (rawEvents.length > 0) {
    return rawEvents
      .map((entry, index) => {
        const normalizedEntry =
          typeof entry === "string" ? { eventType: entry } : entry;
        const eventType = String(
          normalizedEntry?.eventType ||
            normalizedEntry?.event_type ||
            normalizedEntry?.type ||
            normalizedEntry?.name ||
            "",
        )
          .trim()
          .toUpperCase();
        if (!eventType) return null;

        const happenedAt =
          normalizedEntry?.happenedAt ||
          normalizedEntry?.occurredAt ||
          normalizedEntry?.createdAt ||
          normalizedEntry?.timestamp ||
          normalizedEntry?.time ||
          null;
        const tone = getTimelineTone(eventType);
        return {
          id:
            normalizedEntry?.id ||
            `${row?.id || "payout"}-${eventType}-${happenedAt || index + 1}`,
          eventType,
          label: formatEventLabel(eventType),
          statusLabel: tone.label,
          dotClassName: tone.dotClassName,
          textClassName: tone.textClassName,
          happenedAt,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const dateA = a?.happenedAt ? new Date(a.happenedAt).getTime() : 0;
        const dateB = b?.happenedAt ? new Date(b.happenedAt).getTime() : 0;
        return dateA - dateB;
      });
  }

  const fallback = [];
  const pushFallback = (id, label, statusLabel, happenedAt, dotClassName, textClassName) => {
    fallback.push({
      id: `${row?.id || "payout"}-${id}`,
      eventType: id,
      label,
      statusLabel,
      dotClassName,
      textClassName,
      happenedAt,
    });
  };

  const status = String(row?.status || "").toUpperCase();
  const reviewNote = String(row?.reviewNote || "");
  const requestedAt = row?.requestedAt || row?.createdAt || null;
  const reviewedAt = row?.reviewedAt || null;
  const executedAt = row?.executedAt || null;
  const batchStatusMatch = reviewNote.match(/PayPal batch status:\s*([A-Z_]+)/i);
  const batchStatus = String(batchStatusMatch?.[1] || "").toUpperCase();

  if (requestedAt) {
    pushFallback(
      "REQUESTED",
      "Payout request submitted",
      "Requested",
      requestedAt,
      "bg-amber-500",
      "text-amber-700",
    );
  }

  if (reviewedAt) {
    const reviewedAsRejected = status === "REJECTED";
    pushFallback(
      "REVIEWED",
      reviewedAsRejected ? "Payout request rejected" : "Payout request approved",
      reviewedAsRejected ? "Rejected" : "Approved",
      reviewedAt,
      reviewedAsRejected ? "bg-rose-500" : "bg-blue-500",
      reviewedAsRejected ? "text-rose-700" : "text-blue-700",
    );
  }

  if (status === "EXECUTED") {
    if (batchStatus && batchStatus !== "SUCCESS") {
      pushFallback(
        "PAYMENT.PAYOUTSBATCH.PROCESSING",
        `PayPal batch processing (${batchStatus})`,
        "Processing",
        executedAt,
        "bg-indigo-500",
        "text-indigo-700",
      );
    } else {
      pushFallback(
        "PAYMENT.PAYOUTS-ITEM.SUCCEEDED",
        "Payout released",
        "Paid",
        executedAt,
        "bg-emerald-500",
        "text-emerald-700",
      );
    }
  }

  if (status === "FAILED") {
    pushFallback(
      "PAYMENT.PAYOUTS-ITEM.FAILED",
      "Payout failed",
      "Failed",
      executedAt,
      "bg-rose-500",
      "text-rose-700",
    );
  }

  return fallback;
}

function buildTransactionsForPayout(row, currencyCode) {
  const payoutItems = Array.isArray(row?.items) ? row.items : [];
  const transactions = payoutItems.map((payoutItem, index) => {
    const orderItem = payoutItem?.orderItem || {};
    const learner = orderItem?.order?.user || {};
    const learnerName =
      `${learner?.firstName || ""} ${learner?.lastName || ""}`.trim() ||
      learner?.username ||
      "Unknown learner";
    const learnerEmail = learner?.email || "-";
    const purchasedAt = orderItem?.order?.createdAt || orderItem?.createdAt || null;
    const amount = toNumber(
      payoutItem?.amount,
      toNumber(orderItem?.educatorEarning, 0),
    );

    return {
      id: payoutItem?.id || `${row?.id || "payout"}-item-${index + 1}`,
      learnerName,
      learnerEmail,
      courseTitle: orderItem?.course?.title || "Unknown course",
      purchasedAt,
      amount: Number(amount.toFixed(2)),
      currency: DISPLAY_CURRENCY,
    };
  });

  const totalAmount = transactions.reduce((sum, item) => sum + toNumber(item.amount, 0), 0);
  return { transactions, totalAmount: Number(totalAmount.toFixed(2)) };
}

export default function PayoutSettingsPage() {
  const router = useRouter();
  const [isConnectingPaypal, setIsConnectingPaypal] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [activePayout, setActivePayout] = useState(null);
  const [isRequestConfirmOpen, setIsRequestConfirmOpen] = useState(false);
  const [earningsRange, setEarningsRange] = useState("6m");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const {
    data: summaryResponse,
    mutate: mutateSummary,
    isValidating: isSummaryLoading,
  } = PAYOUTAPI.getSummary();
  const { data: payoutsResponse, mutate: mutatePayouts } =
    PAYOUTAPI.getMyPayouts({
      page: 1,
      limit: 200,
    });

  const summary = summaryResponse?.data || {};
  const payoutRows = payoutsResponse?.data || [];
  const currencyCode = DISPLAY_CURRENCY;
  const payoutCycle = String(summary?.payoutCycle || "ANYTIME").toUpperCase();
  const payoutCycleLabel = payoutCycle.toLowerCase();
  const payoutEstimate = summary?.payoutEstimate || null;
  const withdrawalFeeRate = toNumber(
    summary?.withdrawalFeeRate,
    DEFAULT_WITHDRAWAL_FEE_RATE,
  );

  useEffect(() => {
    if (!router.isReady) return;
    const paypal = String(router.query?.paypal || "").toLowerCase();
    if (paypal === "connected") {
      toast.success("PayPal account connected.");
      mutateSummary();
      router.replace("/instructor/settings/payout", undefined, {
        shallow: true,
      });
    }
    if (paypal === "error") {
      toast.error("PayPal connection failed.");
      router.replace("/instructor/settings/payout", undefined, {
        shallow: true,
      });
    }
  }, [mutateSummary, router]);

  const cards = useMemo(
    () => [
      {
        label: "Available for payout",
        value: formatCurrency(summary?.availableBalance || 0, currencyCode),
      },
      {
        label: payoutCycle === "MONTHLY" ? "Income this month" : "Recent income",
        value: formatCurrency(summary?.thisMonthEarnings || 0, currencyCode),
      },
      {
        label: "Minimum payout",
        value: formatCurrency(summary?.minimumPayoutAmount || 500, "PHP"),
      },
      {
        label: "Next payout cycle",
        value: formatDate(summary?.nextPayoutDate),
      },
    ],
    [
      summary?.availableBalance,
      currencyCode,
      summary?.minimumPayoutAmount,
      summary?.nextPayoutDate,
      summary?.thisMonthEarnings,
    ],
  );

  const payoutStatusData = useMemo(() => {
    const statuses = ["REQUESTED", "APPROVED", "EXECUTED", "FAILED", "REJECTED"];
    const counts = statuses.reduce((accumulator, status) => {
      accumulator[status] = 0;
      return accumulator;
    }, {});

    payoutRows.forEach((row) => {
      const status = String(row?.status || "").toUpperCase();
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    });

    const hasActualData = Object.values(counts).some((value) => value > 0);
    if (!hasActualData) {
      return [
        { name: "Requested", value: 2, color: STATUS_COLORS.REQUESTED },
        { name: "Approved", value: 1, color: STATUS_COLORS.APPROVED },
        { name: "Paid", value: 4, color: STATUS_COLORS.EXECUTED },
        { name: "Failed", value: 1, color: STATUS_COLORS.FAILED },
      ];
    }

    return [
      { name: "Requested", value: counts.REQUESTED, color: STATUS_COLORS.REQUESTED },
      { name: "Approved", value: counts.APPROVED, color: STATUS_COLORS.APPROVED },
      { name: "Paid", value: counts.EXECUTED, color: STATUS_COLORS.EXECUTED },
      { name: "Failed", value: counts.FAILED + counts.REJECTED, color: STATUS_COLORS.FAILED },
    ].filter((item) => item.value > 0);
  }, [payoutRows]);

  const earningsEvents = useMemo(() => {
    const events = [];

    payoutRows.forEach((row) => {
      const payoutItems = Array.isArray(row?.items) ? row.items : [];
      payoutItems.forEach((payoutItem) => {
        const dateValue =
          payoutItem?.orderItem?.order?.createdAt ||
          payoutItem?.orderItem?.createdAt ||
          row?.requestedAt ||
          row?.createdAt;
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return;

        const amount = toNumber(
          payoutItem?.amount,
          toNumber(payoutItem?.orderItem?.educatorEarning, 0),
        );
        if (amount <= 0) return;

        events.push({
          date,
          amount: Number(amount.toFixed(2)),
        });
      });
    });

    return events;
  }, [payoutRows]);

  const earningsTrendData = useMemo(() => {
    const now = new Date();
    let rangeStart = null;
    let rangeEnd = endOfMonth(now);
    let groupBy = "month";
    let labelWithYear = false;

    if (earningsRange === "year") {
      rangeStart = new Date(now.getFullYear(), 0, 1);
      rangeEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      labelWithYear = false;
    } else if (earningsRange === "5y") {
      rangeStart = new Date(now.getFullYear() - 4, 0, 1);
      rangeEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      groupBy = "year";
    } else if (earningsRange === "custom") {
      const parsedStart = customStartDate ? new Date(customStartDate) : null;
      const parsedEnd = customEndDate ? new Date(customEndDate) : null;
      if (
        parsedStart &&
        parsedEnd &&
        !Number.isNaN(parsedStart.getTime()) &&
        !Number.isNaN(parsedEnd.getTime()) &&
        parsedStart.getTime() <= parsedEnd.getTime()
      ) {
        rangeStart = new Date(
          parsedStart.getFullYear(),
          parsedStart.getMonth(),
          parsedStart.getDate(),
        );
        rangeEnd = new Date(
          parsedEnd.getFullYear(),
          parsedEnd.getMonth(),
          parsedEnd.getDate(),
          23,
          59,
          59,
          999,
        );
        labelWithYear = true;
      } else {
        rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      }
    } else {
      rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    const rows = [];
    if (groupBy === "year") {
      const byYear = new Map();
      for (
        let year = rangeStart.getFullYear();
        year <= rangeEnd.getFullYear();
        year += 1
      ) {
        byYear.set(String(year), 0);
      }

      earningsEvents.forEach((entry) => {
        if (entry.date < rangeStart || entry.date > rangeEnd) return;
        const key = String(entry.date.getFullYear());
        if (!byYear.has(key)) return;
        byYear.set(key, Number((byYear.get(key) + entry.amount).toFixed(2)));
      });

      byYear.forEach((earnings, year) => {
        rows.push({
          month: year,
          earnings: Number(earnings.toFixed(2)),
        });
      });
      return rows;
    }

    const byMonth = new Map();
    let cursor = startOfMonth(rangeStart);
    const limit = startOfMonth(rangeEnd);
    while (cursor.getTime() <= limit.getTime()) {
      byMonth.set(formatMonthKey(cursor), {
        month: formatMonthLabel(cursor, labelWithYear),
        earnings: 0,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }

    earningsEvents.forEach((entry) => {
      if (entry.date < rangeStart || entry.date > rangeEnd) return;
      const key = formatMonthKey(entry.date);
      if (!byMonth.has(key)) return;
      const current = byMonth.get(key);
      current.earnings = Number((current.earnings + entry.amount).toFixed(2));
      byMonth.set(key, current);
    });

    byMonth.forEach((entry) => {
      rows.push({
        month: entry.month,
        earnings: Number(entry.earnings.toFixed(2)),
      });
    });

    if (!rows.length) {
      rows.push({
        month: formatMonthLabel(now, true),
        earnings: Number(toNumber(summary?.thisMonthEarnings, 0).toFixed(2)),
      });
    }

    return rows;
  }, [
    earningsEvents,
    earningsRange,
    customStartDate,
    customEndDate,
    summary?.thisMonthEarnings,
  ]);

  const previousPayouts = useMemo(
    () =>
      payoutRows
        .filter((row) => ["EXECUTED", "APPROVED"].includes(String(row?.status || "").toUpperCase()))
        .slice(0, 4),
    [payoutRows],
  );

  const estimatedNextPayoutAmount = useMemo(() => {
    const available = toNumber(summary?.availableBalance, 0);
    const monthEarnings = toNumber(summary?.thisMonthEarnings, 0);
    if (payoutCycle === "ANYTIME") {
      return Number(available.toFixed(2));
    }
    if (summary?.currentMonthRequest?.status === "REQUESTED") {
      return Number(available.toFixed(2));
    }
    return Number((available + monthEarnings * 0.45).toFixed(2));
  }, [
    payoutCycle,
    summary?.availableBalance,
    summary?.thisMonthEarnings,
    summary?.currentMonthRequest?.status,
  ]);

  const payoutRequestPreview = useMemo(() => {
    const grossAmount = Math.max(toNumber(summary?.availableBalance, 0), 0);
    const feeAmount = Number((grossAmount * withdrawalFeeRate).toFixed(2));
    const netAmount = Number(Math.max(grossAmount - feeAmount, 0).toFixed(2));
    return {
      grossAmount,
      feeAmount,
      netAmount,
    };
  }, [summary?.availableBalance, withdrawalFeeRate]);

  const activePayoutDetails = useMemo(() => {
    if (!activePayout) return null;
    return buildTransactionsForPayout(activePayout, currencyCode);
  }, [activePayout, currencyCode]);
  const activePayoutTimeline = useMemo(
    () => normalizeTimelineEvents(activePayout),
    [activePayout],
  );

  const handleConnectPaypal = () => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) {
      toast.error("Missing PayPal client ID.");
      return;
    }

    setIsConnectingPaypal(true);
    const appBaseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://127.0.0.1:3000");
    const redirectUri = `${appBaseUrl.replace(/\/$/, "")}/api/paypal/callback`;
    const state = btoa(
      JSON.stringify({
        returnTo: "/instructor/settings/payout",
      }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope:
        "openid profile email https://uri.paypal.com/services/paypalattributes",
      redirect_uri: redirectUri,
      state,
    });

    window.location.href = `https://www.sandbox.paypal.com/signin/authorize?flowEntry=static&${params.toString()}`;
  };

  const submitPayoutRequest = async () => {
    setIsRequestingPayout(true);
    try {
      await PAYOUTAPI.requestPayout({
        note: `Instructor ${payoutCycleLabel} payout request (auto-approved)`,
      });
      toast.success("Payout submitted and auto-approved.");
      setIsRequestConfirmOpen(false);
      await Promise.all([mutateSummary(), mutatePayouts()]);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to request payout.");
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const handleRequestPayout = () => {
    if (isRequestingPayout || isSummaryLoading || !summary?.canRequestPayout) {
      return;
    }
    setIsRequestConfirmOpen(true);
  };

  const closePayoutDetails = () => setActivePayout(null);

  return (
    <InstructorLayout>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex flex-wrap gap-2 border-b border-[#e2e8f0] pb-3">
          <Link
            href="/instructor/settings"
            className="rounded-full border border-[#cbd5e1] px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            General
          </Link>
          <Link
            href="/instructor/settings/payout"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Payout
          </Link>
        </div>

        <section className="rounded-lg border border-[#e2e8f0] bg-white p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-on-surface">
            Payout settings
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Payout availability is currently set to{" "}
            <strong>{payoutCycleLabel}</strong>. Minimum cashout is{" "}
            {formatCurrency(500, "PHP")}. A{" "}
            <strong>{(withdrawalFeeRate * 100).toFixed(0)}%</strong> withdrawal fee
            applies on payout requests.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-[#e2e8f0] bg-white p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {card.label}
              </p>
              <p className="mt-3 text-2xl font-bold text-[#0056d2]">
                {card.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-on-surface">
                Earnings
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={earningsRange}
                  onChange={(event) => setEarningsRange(event.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs outline-none"
                >
                  <option value="6m">Last 6 months</option>
                  <option value="year">Yearly</option>
                  <option value="5y">5 years</option>
                  <option value="custom">Custom range</option>
                </select>
                {earningsRange === "custom" ? (
                  <>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(event) => setCustomStartDate(event.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs outline-none"
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(event) => setCustomEndDate(event.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs outline-none"
                    />
                  </>
                ) : null}
              </div>
            </div>
            <div className="mt-4 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsTrendData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value, currencyCode)} />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#2563eb"
                    fill="#bfdbfe"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-xl font-semibold text-on-surface">Payout statuses</h2>
            <div className="mt-4 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payoutStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                  >
                    {payoutStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {payoutStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-lg font-semibold text-on-surface">
              Estimated next payout
            </h2>
            <p className="mt-2 text-3xl font-bold text-[#0056d2]">
              {formatCurrency(estimatedNextPayoutAmount, currencyCode)}
            </p>
            {payoutCycle !== "ANYTIME" ? (
              <p className="mt-2 text-sm text-slate-500">
                Est. release: {formatDate(payoutEstimate?.estimatedPayoutAt || summary?.nextPayoutDate)}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-slate-500">
              {payoutEstimate?.message || "Estimate based on current cycle and recent conversion rate."}
            </p>
          </div>

          <div className="rounded-lg border border-[#e2e8f0] bg-white p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-on-surface">Previous payouts</h2>
              <p className="text-xs text-slate-500">Recent activity</p>
            </div>
            <div className="mt-4 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(previousPayouts.length ? previousPayouts : payoutRows.slice(0, 4)).map((row, index) => ({
                    label: `#${index + 1}`,
                    amount: toNumber(row?.amount, 0),
                  }))}
                >
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value, currencyCode)} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="#0056d2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-xl font-semibold text-on-surface">
              Payout account
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Connect using your PayPal Sandbox login. We save the PayPal email
              returned by PayPal after successful sign-in.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-on-surface">
                  Connected PayPal email
                </p>
                <p className="mt-1">
                  {summary?.payoutAccount?.paypalEmail || "Not connected yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleConnectPaypal}
                disabled={isConnectingPaypal}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isConnectingPaypal
                  ? "Redirecting..."
                  : "Connect PayPal (Sandbox)"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-xl font-semibold text-on-surface">Payout request</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Requests include earnings eligible for the selected payout cycle.
            </p>

            <div className="mt-6 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
              {summary?.canRequestPayout
                ? "You can request your payout now."
                : summary?.cannotRequestReason ||
                  "You cannot request payout yet."}
            </div>

            <button
              type="button"
              onClick={handleRequestPayout}
              disabled={
                isRequestingPayout ||
                isSummaryLoading ||
                !summary?.canRequestPayout
              }
              className="mt-4 rounded-full bg-[#0056d2] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isRequestingPayout
                ? "Submitting..."
                : "Request payout / cashout"}
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
          <div className="border-b border-[#e2e8f0] px-6 py-4">
            <h2 className="text-xl font-semibold text-on-surface">
              Payout history
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Request date
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Executed date
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody>
                {payoutRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-8 text-sm text-slate-500"
                      colSpan={5}
                    >
                      No payout requests yet.
                    </td>
                  </tr>
                ) : (
                  payoutRows.map((row) => {
                    const statusMeta = getFriendlyStatus(row);
                    return (
                      <tr key={row.id} className="border-t border-[#e2e8f0]">
                        <td className="px-6 py-4 text-sm text-on-surface">
                          {formatDate(row.requestedAt || row.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-[#0056d2]">
                          {formatCurrency(row.amount, row.currency || currencyCode)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface">
                          {formatDate(row.executedAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface">
                          <button
                            type="button"
                            onClick={() => setActivePayout(row)}
                            className="rounded-full border border-[#cbd5e1] px-3 py-1 text-xs font-semibold text-[#334155] hover:bg-slate-50"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {activePayout ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closePayoutDetails}
            className="absolute inset-0 bg-black/50"
            aria-label="Close payout details"
          />
          <div className="relative z-[141] max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-on-surface">
                  Payout transactions
                </h3>
                <p className="text-xs text-slate-500">
                  Payout ID: {activePayout.id}
                </p>
              </div>
              <button
                type="button"
                onClick={closePayoutDetails}
                className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 border-b border-slate-200 px-6 py-4 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Requested
                </p>
                <p className="mt-1 text-sm font-semibold text-on-surface">
                  {formatDateTime(activePayout.requestedAt || activePayout.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Amount</p>
                <p className="mt-1 text-sm font-semibold text-[#0056d2]">
                  {formatCurrency(activePayout.amount, activePayout.currency || currencyCode)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <p className="mt-1 text-sm font-semibold text-on-surface">
                  {getFriendlyStatus(activePayout).label}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Transactions</p>
                <p className="mt-1 text-sm font-semibold text-on-surface">
                  {activePayoutDetails?.transactions?.length || 0}
                </p>
              </div>
            </div>

            <div className="border-b border-slate-200 px-6 py-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Payout timeline
              </h4>
              {(activePayoutTimeline || []).length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No timeline events yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {activePayoutTimeline.map((event, index) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex w-4 flex-col items-center">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${event.dotClassName}`} />
                        {index < activePayoutTimeline.length - 1 ? (
                          <span className="mt-1 h-full w-px bg-slate-200" />
                        ) : null}
                      </div>
                      <div className="pb-2">
                        <p className={`text-sm font-semibold ${event.textClassName}`}>
                          {event.statusLabel}
                        </p>
                        <p className="text-sm text-on-surface">{event.label}</p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(event.happenedAt)}
                        </p>
                        {event.eventType?.startsWith("PAYMENT.") ? (
                          <p className="mt-1 text-[11px] text-slate-500">{event.eventType}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4">
              <p className="mb-3 text-sm text-slate-500">
                Breakdown of learner purchases from payout request items.
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Learner
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Course bought
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Purchased at
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Payout share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activePayoutDetails?.transactions || []).length === 0 ? (
                      <tr className="border-t border-slate-200">
                        <td className="px-4 py-4 text-sm text-slate-500" colSpan={5}>
                          No payout request items found for this payout.
                        </td>
                      </tr>
                    ) : (
                      (activePayoutDetails?.transactions || []).map((transaction) => (
                        <tr key={transaction.id} className="border-t border-slate-200">
                          <td className="px-4 py-3 text-sm text-on-surface">
                            {transaction.learnerName}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {transaction.learnerEmail}
                          </td>
                          <td className="px-4 py-3 text-sm text-on-surface">
                            {transaction.courseTitle}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {formatDateTime(transaction.purchasedAt)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-[#0056d2]">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td className="px-4 py-3 text-sm font-semibold text-on-surface" colSpan={4}>
                        Eligible earnings total
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-[#0056d2]">
                        {formatCurrency(
                          activePayoutDetails?.totalAmount || 0,
                          activePayout.currency || currencyCode,
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-semibold text-on-surface" colSpan={4}>
                        Withdrawal fee
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-orange-600">
                        -{formatCurrency(
                          Math.max(
                            Number(
                              (
                                (activePayoutDetails?.totalAmount || 0) -
                                toNumber(activePayout?.amount, 0)
                              ).toFixed(2),
                            ),
                            0,
                          ),
                          activePayout.currency || currencyCode,
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-semibold text-on-surface" colSpan={4}>
                        Net payout
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-emerald-700">
                        {formatCurrency(
                          activePayout?.amount || 0,
                          activePayout.currency || currencyCode,
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isRequestConfirmOpen ? (
        <div className="fixed inset-0 z-[145] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsRequestConfirmOpen(false)}
            className="absolute inset-0 bg-black/50"
            aria-label="Close payout confirmation"
          />
          <div className="relative z-[146] w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-on-surface">
                Confirm payout request
              </h3>
              <button
                type="button"
                onClick={() => setIsRequestConfirmOpen(false)}
                className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Eligible earnings (gross)</span>
                <span className="font-semibold text-on-surface">
                  {formatCurrency(payoutRequestPreview.grossAmount, currencyCode)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">
                  Withdrawal fee ({(withdrawalFeeRate * 100).toFixed(0)}%)
                </span>
                <span className="font-semibold text-orange-600">
                  -{formatCurrency(payoutRequestPreview.feeAmount, currencyCode)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="font-semibold text-on-surface">Net payout</span>
                <span className="text-lg font-bold text-[#0056d2]">
                  {formatCurrency(payoutRequestPreview.netAmount, currencyCode)}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              This request will be auto-approved and submitted for PayPal payout
              processing.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRequestConfirmOpen(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPayoutRequest}
                disabled={isRequestingPayout}
                className="rounded-full bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isRequestingPayout ? "Submitting..." : "Confirm request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </InstructorLayout>
  );
}
