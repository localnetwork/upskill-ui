"use client";

import InstructorLayout from "@/components/partials/InstructorLayout";
import PAYOUTAPI from "@/lib/api/payouts/request";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

function formatCurrency(value, currencyCode = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currencyCode,
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

function statusPillClass(status) {
  if (status === "EXECUTED") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "REJECTED") {
    return "bg-rose-100 text-rose-700";
  }
  if (status === "APPROVED") {
    return "bg-sky-100 text-sky-700";
  }
  return "bg-amber-100 text-amber-700";
}

export default function PayoutSettingsPage() {
  const router = useRouter();
  const [isConnectingPaypal, setIsConnectingPaypal] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  const {
    data: summaryResponse,
    mutate: mutateSummary,
    isValidating: isSummaryLoading,
  } = PAYOUTAPI.getSummary();
  const { data: payoutsResponse, mutate: mutatePayouts } =
    PAYOUTAPI.getMyPayouts({
      page: 1,
      limit: 10,
    });

  const summary = summaryResponse?.data || {};
  const payoutRows = payoutsResponse?.data || [];
  const currencyCode = String(summary?.currency || "PHP").toUpperCase();
  const payoutCycle = String(summary?.payoutCycle || "ANYTIME").toUpperCase();
  const payoutCycleLabel = payoutCycle.toLowerCase();

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

  const handleRequestPayout = async () => {
    setIsRequestingPayout(true);
    try {
      await PAYOUTAPI.requestPayout({
        note: `Instructor ${payoutCycleLabel} payout request`,
      });
      toast.success("Payout request submitted.");
      await Promise.all([mutateSummary(), mutatePayouts()]);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to request payout.");
    } finally {
      setIsRequestingPayout(false);
    }
  };

  return (
    <InstructorLayout>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <section className="rounded-lg border border-[#e2e8f0] bg-white p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-on-surface">
            Payout settings
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Payout availability is currently set to{" "}
            <strong>{payoutCycleLabel}</strong>. Minimum cashout is{" "}
            {formatCurrency(500, "PHP")}.
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
                </tr>
              </thead>

              <tbody>
                {payoutRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-8 text-sm text-slate-500"
                      colSpan={4}
                    >
                      No payout requests yet.
                    </td>
                  </tr>
                ) : (
                  payoutRows.map((row) => (
                    <tr key={row.id} className="border-t border-[#e2e8f0]">
                      <td className="px-6 py-4 text-sm text-on-surface">
                        {formatDate(row.requestedAt || row.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#0056d2]">
                        {formatCurrency(row.amount, row.currency || currencyCode)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface">
                        {formatDate(row.executedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </InstructorLayout>
  );
}
