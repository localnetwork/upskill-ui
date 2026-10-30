"use client";

import InstructorLayout from "@/components/partials/InstructorLayout";
import SubscriptionEarningsSection from "@/components/entities/subscription/SubscriptionEarningsSection";
import PAYOUTAPI from "@/lib/api/payouts/request";
import PayoutDashboard from "@/components/entities/instructor/payout/PayoutDashboard";
import PayoutAccountTour from "@/components/entities/instructor/payout/PayoutAccountTour";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { X } from "lucide-react";

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
    /(?:Xendit payout|PayPal batch) status:\s*([A-Z_]+)/i,
  );
  const paypalBatchStatus = String(paypalBatchStatusMatch?.[1] || "").toUpperCase();

  if (rawStatus === "REQUESTED") {
    return { label: "Pending", className: "bg-amber-100 text-amber-700" };
  }

  if (rawStatus === "APPROVED") {
    return { label: "Sent for Payment", className: "bg-blue-100 text-blue-700" };
  }

  if (rawStatus === "EXECUTED") {
    if (paypalBatchStatus && paypalBatchStatus !== "SUCCEEDED") {
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

const PAYOUT_CHANNELS = [
  { code: "PH_GCASH", label: "GCash", type: "EWALLET" },
  { code: "PH_PAYMAYA", label: "Maya", type: "EWALLET" },
  { code: "PH_BDO", label: "BDO Unibank", type: "BANK" },
  { code: "PH_BPI", label: "BPI", type: "BANK" },
  { code: "PH_UNIONBANK", label: "UnionBank", type: "BANK" },
  { code: "PH_METROBANK", label: "Metrobank", type: "BANK" },
];

const isEwalletChannel = (code) =>
  PAYOUT_CHANNELS.find((channel) => channel.code === code)?.type === "EWALLET";

const maskAccountNumber = (value) => {
  const text = String(value || "");
  return text.length > 4 ? `${"•".repeat(text.length - 4)}${text.slice(-4)}` : text;
};

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
  const batchStatusMatch = reviewNote.match(/Xendit payout status:\s*([A-Z_]+)/i);
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
    if (batchStatus && batchStatus !== "SUCCEEDED") {
      pushFallback(
        "PAYMENT.PAYOUTSBATCH.PROCESSING",
        `Xendit payout processing (${batchStatus})`,
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

  const salesTotal = transactions.reduce((sum, item) => sum + toNumber(item.amount, 0), 0);
  const snapshot = row?.calculationSnapshot || {};
  const subscriptionPool = toNumber(snapshot?.breakdown?.subscriptionPool, 0);
  const totalAmount = toNumber(snapshot?.grossPayoutAmount, salesTotal + subscriptionPool);
  return {
    transactions,
    totalAmount: Number(totalAmount.toFixed(2)),
    salesTotal: Number(salesTotal.toFixed(2)),
    subscriptionPool,
  };
}

export default function PayoutSettingsPage() {
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountModal, setAccountModal] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [verifyMethod, setVerifyMethod] = useState("password");
  const [verifiedCredentials, setVerifiedCredentials] = useState({});
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [accountForm, setAccountForm] = useState({
    channelCode: "PH_GCASH",
    accountHolderName: "",
    accountNumber: "",
  });
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [activePayout, setActivePayout] = useState(null);
  const [payoutActionId, setPayoutActionId] = useState("");
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
  const router = useRouter();
  const [showTour, setShowTour] = useState(false);
  const hasPayoutAccount = Boolean(summary?.payoutAccount?.accountNumber);

  useEffect(() => {
    if (router.query.tour === "payout-account" && summaryResponse && !hasPayoutAccount) {
      setShowTour(true);
    }
  }, [router.query.tour, summaryResponse, hasPayoutAccount]);

  const closeTour = () => {
    setShowTour(false);
    if (router.query.tour) {
      router.replace("/instructor/settings/payout", undefined, { shallow: true });
    }
  };
  const payoutRows = payoutsResponse?.data || [];
  const currencyCode = DISPLAY_CURRENCY;
  const payoutCycle = String(summary?.payoutCycle || "ANYTIME").toUpperCase();
  const payoutCycleLabel = payoutCycle.toLowerCase();
  const withdrawalFeeRate = toNumber(
    summary?.withdrawalFeeRate,
    DEFAULT_WITHDRAWAL_FEE_RATE,
  );

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

  const closeAccountModal = () => {
    setAccountModal(null);
    setPasswordInput("");
    setVerifiedCredentials({});
  };

  const startAccountUpdate = async () => {
    setIsVerifyingPassword(true);
    try {
      const res = await PAYOUTAPI.getVerificationMethod();
      const method = res?.data?.data?.method || "password";
      setVerifyMethod(method);
      setAccountModal(method === "none" ? "form" : "password");
    } catch (error) {
      toast.error(error?.data?.message || "Unable to start verification.");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleVerifyPassword = async (event) => {
    event.preventDefault();
    if (isVerifyingPassword || !passwordInput) return;
    setIsVerifyingPassword(true);
    const credentials =
      verifyMethod === "authenticator"
        ? { code: passwordInput.trim() }
        : { password: passwordInput };
    try {
      await PAYOUTAPI.verifyAccountPassword(credentials);
      setVerifiedCredentials(credentials);
      setPasswordInput("");
      setAccountModal("form");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          (verifyMethod === "authenticator"
            ? "Invalid authenticator code."
            : "Incorrect password."),
      );
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleSaveAccount = async (event) => {
    event.preventDefault();
    if (isSavingAccount) return;
    setIsSavingAccount(true);
    try {
      await PAYOUTAPI.connectPayoutAccount({
        channelCode: accountForm.channelCode,
        accountHolderName: accountForm.accountHolderName.trim(),
        accountNumber: accountForm.accountNumber.replace(/\s+/g, ""),
        ...(hasPayoutAccount ? verifiedCredentials : {}),
      });
      toast.success("Payout account saved.");
      setAccountForm((prev) => ({ ...prev, accountNumber: "" }));
      closeAccountModal();
      await mutateSummary();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to save payout account.");
    } finally {
      setIsSavingAccount(false);
    }
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

  const handlePayoutRecovery = async (action, payoutId) => {
    if (payoutActionId) return;
    setPayoutActionId(payoutId);
    try {
      if (action === "retry") {
        await PAYOUTAPI.retryPayout(payoutId);
        toast.success("Payout retried and submitted to Xendit.");
      } else {
        await PAYOUTAPI.returnPayout(payoutId);
        toast.success("Amount returned to your available balance.");
      }
      setActivePayout(null);
    } catch (error) {
      toast.error(
        error?.data?.message ||
          (action === "retry" ? "Failed to retry payout." : "Failed to return amount."),
      );
    } finally {
      await Promise.all([mutateSummary(), mutatePayouts()]);
      setPayoutActionId("");
    }
  };

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

        <SubscriptionEarningsSection />

        <PayoutDashboard
          summary={summary}
          payoutRows={payoutRows}
          earningsTrendData={earningsTrendData}
          estimatedNextPayoutAmount={estimatedNextPayoutAmount}
          getFriendlyStatus={getFriendlyStatus}
          onViewPayout={setActivePayout}
          rangeControls={
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
          }
        />

        {showTour ? <PayoutAccountTour onClose={closeTour} /> : null}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-xl font-semibold text-on-surface">
              Payout account
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Payouts are sent through Xendit to your GCash, Maya, or bank
              account. Make sure the account name matches the account holder.
            </p>

            {hasPayoutAccount ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-on-surface">
                    Connected account
                  </p>
                  <p className="mt-1">
                    {`${PAYOUT_CHANNELS.find((c) => c.code === summary.payoutAccount.channelCode)?.label || summary.payoutAccount.channelCode} • ${summary.payoutAccount.accountHolderName} • ${maskAccountNumber(summary.payoutAccount.accountNumber)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startAccountUpdate}
                  disabled={isVerifyingPassword}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Update payout account
                </button>
              </div>
            ) : null}

            {accountModal === "password" ? (
              <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
                <form
                  onSubmit={handleVerifyPassword}
                  className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl"
                >
                  <h3 className="text-lg font-semibold text-on-surface">
                    {verifyMethod === "authenticator"
                      ? "Enter authenticator code"
                      : "Confirm your password"}
                  </h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {verifyMethod === "authenticator"
                      ? "Enter the 6-digit code from your authenticator app to update your payout account."
                      : "For your security, enter your password to update your payout account."}
                  </p>
                  <input
                    type={verifyMethod === "authenticator" ? "text" : "password"}
                    inputMode={verifyMethod === "authenticator" ? "numeric" : undefined}
                    maxLength={verifyMethod === "authenticator" ? 6 : 200}
                    autoFocus
                    required
                    autoComplete={
                      verifyMethod === "authenticator" ? "one-time-code" : "current-password"
                    }
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder={verifyMethod === "authenticator" ? "123456" : "Password"}
                    className="mt-4 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm"
                  />
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeAccountModal}
                      className="rounded-full border border-[#cbd5e1] px-5 py-2.5 text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifyingPassword || !passwordInput}
                      className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isVerifyingPassword ? "Verifying..." : "Continue"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {!hasPayoutAccount || accountModal === "form" ? (
              <div
                className={
                  hasPayoutAccount
                    ? "fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/40 p-4"
                    : ""
                }
              >
                <div
                  className={
                    hasPayoutAccount
                      ? "max-h-full w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-2xl"
                      : ""
                  }
                >
            <form onSubmit={handleSaveAccount} className="mt-6 space-y-4">
              {hasPayoutAccount ? (
                <h3 className="text-lg font-semibold text-on-surface">
                  Update payout account
                </h3>
              ) : (
              <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-on-surface">
                  Connected account
                </p>
                <p className="mt-1">
                  Not connected yet
                </p>
              </div>
              )}
              <label
                id="payout-tour-channel"
                className="block text-sm font-medium text-on-surface"
              >
                Channel
                <select
                  value={accountForm.channelCode}
                  onChange={(e) =>
                    setAccountForm((prev) => ({
                      ...prev,
                      channelCode: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm"
                >
                  {PAYOUT_CHANNELS.map((channel) => (
                    <option key={channel.code} value={channel.code}>
                      {channel.label}
                    </option>
                  ))}
                </select>
              </label>
              <label
                id="payout-tour-name"
                className="block text-sm font-medium text-on-surface"
              >
                Account holder name
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={accountForm.accountHolderName}
                  onChange={(e) =>
                    setAccountForm((prev) => ({
                      ...prev,
                      accountHolderName: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm"
                />
              </label>
              <label
                id="payout-tour-number"
                className="block text-sm font-medium text-on-surface"
              >
                {isEwalletChannel(accountForm.channelCode)
                  ? "Mobile number (09XXXXXXXXX)"
                  : "Account number"}
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={accountForm.accountNumber}
                  onChange={(e) =>
                    setAccountForm((prev) => ({
                      ...prev,
                      accountNumber: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm"
                />
              </label>
              <button
                id="payout-tour-save"
                type="submit"
                disabled={isSavingAccount}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSavingAccount ? "Saving..." : "Save payout account"}
              </button>
              {hasPayoutAccount ? (
                <button
                  type="button"
                  onClick={closeAccountModal}
                  className="ml-2 rounded-full border border-[#cbd5e1] px-5 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
              ) : null}
            </form>
                </div>
              </div>
            ) : null}
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

            <div className="grid grid-cols-1 gap-4 border-b border-slate-200 px-6 py-4 md:grid-cols-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Payout account
                </p>
                <p className="mt-1 break-all text-sm font-semibold text-on-surface">
                  {summary?.payoutAccount?.accountNumber
                    ? `${PAYOUT_CHANNELS.find((c) => c.code === summary.payoutAccount.channelCode)?.label || summary.payoutAccount.channelCode} ${maskAccountNumber(summary.payoutAccount.accountNumber)}`
                    : "Not connected"}
                </p>
              </div>
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

            {String(activePayout.status || "").toUpperCase() === "FAILED" ? (
              <div className="border-b border-slate-200 bg-orange-50 px-6 py-4">
                <p className="text-sm text-orange-800">
                  This payout failed and the amount was not received. You can retry
                  sending it to your payout account, or return the amount to your
                  available balance.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(payoutActionId)}
                    onClick={() => handlePayoutRecovery("retry", activePayout.id)}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {payoutActionId === activePayout.id ? "Processing..." : "Retry payout"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(payoutActionId)}
                    onClick={() => handlePayoutRecovery("return", activePayout.id)}
                    className="rounded-full border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-slate-50 disabled:opacity-60"
                  >
                    Return amount to balance
                  </button>
                </div>
              </div>
            ) : null}

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
                    {activePayoutDetails?.subscriptionPool > 0 ? (
                      <tr>
                        <td className="px-4 py-3 text-sm text-slate-600" colSpan={4}>
                          Subscription earnings
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-[#0056d2]">
                          {formatCurrency(
                            activePayoutDetails.subscriptionPool,
                            activePayout.currency || currencyCode,
                          )}
                        </td>
                      </tr>
                    ) : null}
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
              {[
                ["Course sales", summary?.salesBalance, true],
                ["Subscription earnings", summary?.subscriptionEarningsBalance, false],
              ]
                .filter(([, amount, always]) => always || toNumber(amount, 0) > 0)
                .map(([label, amount]) => (
                  <div key={label} className="flex items-center justify-between pl-3 text-slate-500">
                    <span>{label}</span>
                    <span>{formatCurrency(toNumber(amount, 0), currencyCode)}</span>
                  </div>
                ))}
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
              This request will be auto-approved and submitted for Xendit payout
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
