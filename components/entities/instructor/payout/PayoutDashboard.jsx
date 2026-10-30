import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Banknote, CalendarClock, Coins, Wallet } from "lucide-react";

const toNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
};

const formatCurrency = (value, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
    maximumFractionDigits,
  }).format(toNumber(value));

const formatShortDate = (value) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(date);
};

const SOURCE_COLORS = {
  sales: "#2563eb",
  subscription: "#8b5cf6",
};

const SEVERITY_STYLES = {
  high: "bg-rose-50 text-rose-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-sky-50 text-sky-700",
};

const STATUS_DOT = {
  EXECUTED: "bg-emerald-500",
  APPROVED: "bg-blue-500",
  REQUESTED: "bg-amber-500",
  FAILED: "bg-orange-500",
  REJECTED: "bg-rose-500",
};

function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyNote({ children }) {
  return <p className="py-10 text-center text-sm text-slate-500">{children}</p>;
}

function Spark({ values, color }) {
  const max = Math.max(...values, 1);
  if (!values.length) return <div className="h-8" />;
  return (
    <div className="flex h-8 items-end gap-[3px]">
      {values.map((value, index) => (
        <span
          key={index}
          className="w-[6px] rounded-sm"
          style={{
            height: `${Math.max(8, (value / max) * 100)}%`,
            backgroundColor: color,
            opacity: value > 0 ? 1 : 0.25,
          }}
        />
      ))}
    </div>
  );
}

function Kpi({ label, value, hint, values, color, Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-0.5 min-h-4 text-xs text-slate-500">{hint}</p>
      <div className="mt-3">
        <Spark values={values} color={color} />
      </div>
    </div>
  );
}

export default function PayoutDashboard({
  summary,
  payoutRows,
  earningsTrendData,
  rangeControls,
  estimatedNextPayoutAmount,
  getFriendlyStatus,
  onViewPayout,
}) {
  const trendValues = earningsTrendData.map((row) => toNumber(row.earnings));

  const totalPaidOut = useMemo(
    () =>
      payoutRows
        .filter((row) => String(row?.status || "").toUpperCase() === "EXECUTED")
        .reduce((sum, row) => sum + toNumber(row?.amount), 0),
    [payoutRows],
  );

  const statusCounts = useMemo(() => {
    const counts = { EXECUTED: 0, APPROVED: 0, REQUESTED: 0, FAILED: 0, REJECTED: 0 };
    for (const row of payoutRows) {
      const status = String(row?.status || "").toUpperCase();
      if (status in counts) counts[status] += 1;
    }
    return counts;
  }, [payoutRows]);

  const sources = [
    { key: "sales", name: "Course sales", value: toNumber(summary?.salesBalance) },
    { key: "subscription", name: "Subscription earnings", value: toNumber(summary?.subscriptionEarningsBalance) },
  ];
  const sourcesTotal = sources.reduce((sum, item) => sum + item.value, 0);

  const attention = useMemo(() => {
    const items = [];
    const inProgress = statusCounts.APPROVED + statusCounts.REQUESTED;
    if (!summary?.hasVerifiedPayoutAccount) {
      items.push({
        severity: "high",
        tag: "Account",
        title: "Connect a payout account to receive your earnings.",
      });
    }
    if (statusCounts.FAILED > 0) {
      items.push({
        severity: "high",
        tag: "Failed",
        title: `${statusCounts.FAILED} payout${statusCounts.FAILED > 1 ? "s" : ""} failed. Open the details to retry or return the funds.`,
      });
    }
    if (statusCounts.REJECTED > 0) {
      items.push({
        severity: "medium",
        tag: "Rejected",
        title: `${statusCounts.REJECTED} payout request${statusCounts.REJECTED > 1 ? "s were" : " was"} rejected.`,
      });
    }
    if (inProgress > 0) {
      items.push({
        severity: "low",
        tag: "In progress",
        title: `${inProgress} payout${inProgress > 1 ? "s are" : " is"} being processed.`,
      });
    }
    if (summary?.hasVerifiedPayoutAccount && !summary?.canRequestPayout && summary?.cannotRequestReason) {
      items.push({ severity: "medium", tag: "Blocked", title: summary.cannotRequestReason });
    }
    if (summary?.canRequestPayout) {
      items.push({
        severity: "low",
        tag: "Ready",
        title: `${formatCurrency(summary.availableBalance)} is ready to cash out.`,
      });
    }
    const order = { high: 0, medium: 1, low: 2 };
    return items.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [summary, statusCounts]);

  const recent = useMemo(
    () =>
      [...payoutRows]
        .sort(
          (a, b) =>
            new Date(b?.requestedAt || b?.createdAt || 0) -
            new Date(a?.requestedAt || a?.createdAt || 0),
        )
        .slice(0, 5),
    [payoutRows],
  );

  const statusRows = [
    { key: "EXECUTED", label: "Paid" },
    { key: "APPROVED", label: "Sent for payment" },
    { key: "REQUESTED", label: "Pending" },
    { key: "FAILED", label: "Failed" },
    { key: "REJECTED", label: "Rejected" },
  ];
  const maxStatus = Math.max(...Object.values(statusCounts), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Available for payout"
          value={formatCurrency(summary?.availableBalance, 0)}
          hint={`Minimum ${formatCurrency(summary?.minimumPayoutAmount || 500, 0)}`}
          values={trendValues}
          color="#2563eb"
          Icon={Wallet}
        />
        <Kpi
          label="Recent income"
          value={formatCurrency(summary?.thisMonthEarnings, 0)}
          hint={`Cycle: ${String(summary?.payoutCycle || "ANYTIME").toLowerCase()}`}
          values={trendValues}
          color="#10b981"
          Icon={Coins}
        />
        <Kpi
          label="Estimated next payout"
          value={formatCurrency(estimatedNextPayoutAmount, 0)}
          hint={summary?.nextPayoutDate ? `Next cycle ${formatShortDate(summary.nextPayoutDate)}` : "Anytime"}
          values={trendValues}
          color="#f59e0b"
          Icon={CalendarClock}
        />
        <Kpi
          label="Total paid out"
          value={formatCurrency(totalPaidOut, 0)}
          hint={`${statusCounts.EXECUTED} completed payouts`}
          values={payoutRows.slice(0, 24).map((row) => toNumber(row?.amount)).reverse()}
          color="#8b5cf6"
          Icon={Banknote}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Earnings" subtitle="Earnings included in your payouts over time." action={rangeControls}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={earningsTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value, 0)}
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="earnings" name="Earnings" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Needs attention" subtitle="Highest priority first.">
          {attention.length === 0 ? (
            <EmptyNote>Nothing needs your attention.</EmptyNote>
          ) : (
            <ul className="space-y-3">
              {attention.map((item, index) => (
                <li key={index} className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-700">{item.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_STYLES[item.severity]}`}
                  >
                    {item.tag}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Payout statuses" subtitle={`${payoutRows.length} requests in total.`}>
          {payoutRows.length === 0 ? (
            <EmptyNote>No payout requests yet.</EmptyNote>
          ) : (
            <ul className="space-y-4">
              {statusRows.map((item) => (
                <li key={item.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[item.key]}`} />
                      {item.label}
                    </span>
                    <span className="text-slate-500">{statusCounts[item.key]}</span>
                  </div>
                  <div className="h-1.5 rounded bg-slate-100">
                    <div
                      className={`h-1.5 rounded ${STATUS_DOT[item.key]}`}
                      style={{ width: `${(statusCounts[item.key] / maxStatus) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Balance by source" subtitle="Where your available balance comes from.">
          {sourcesTotal <= 0 ? (
            <EmptyNote>No available balance yet.</EmptyNote>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sources.filter((item) => item.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {sources
                        .filter((item) => item.value > 0)
                        .map((item) => (
                          <Cell key={item.key} fill={SOURCE_COLORS[item.key]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-black text-slate-900">{formatCurrency(sourcesTotal, 0)}</span>
                  <span className="text-[11px] text-slate-500">available</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                {sources.map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SOURCE_COLORS[item.key] }} />
                      {item.name}
                    </span>
                    <span className="text-slate-500">{formatCurrency(item.value, 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Recent activity" subtitle="Latest payout requests.">
          {recent.length === 0 ? (
            <EmptyNote>No payouts yet.</EmptyNote>
          ) : (
            <ul className="space-y-3">
              {recent.map((row) => {
                const status = getFriendlyStatus(row);
                return (
                  <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{formatCurrency(row.amount)}</p>
                      <p className="text-xs text-slate-500">
                        {formatShortDate(row.requestedAt || row.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewPayout(row)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                    >
                      {status.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
