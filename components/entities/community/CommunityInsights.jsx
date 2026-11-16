import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Eye, Info, MessageCircle, ThumbsUp } from "lucide-react";
import COMMUNITYAPI from "@/lib/api/community/request";
import { errorMessage } from "./CommunityShared";

const AUDIENCES = [
  { value: "everyone", label: "Everyone" },
  { value: "members", label: "Members" },
  { value: "staff", label: "Admins & moderators" },
];
const RANGES = [
  { value: 7, label: "Last 7 days" },
  { value: 28, label: "Last 28 days" },
  { value: 90, label: "Last 90 days" },
];
const METRICS = [
  { key: "posts", label: "Posts" },
  { key: "comments", label: "Comments" },
  { key: "reactions", label: "Reactions" },
  { key: "all", label: "All" },
];
const SORTS = [
  { value: "top", label: "Top posts" },
  { value: "recent", label: "Most recent" },
];
const AUTHORS = [
  { value: "all", label: "By all" },
  { value: "admins", label: "By admins & moderators" },
  { value: "members", label: "By members" },
];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const SHORT_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function Pill({ value, onChange, options, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 outline-none hover:bg-slate-200 ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function Heading({ title, hint }) {
  return (
    <h3 className="flex items-center gap-1.5 text-base font-bold text-slate-900">
      {title}
      {hint ? (
        <span title={hint} className="text-slate-400">
          <Info size={14} />
        </span>
      ) : null}
    </h3>
  );
}

function toCsv(data) {
  const lines = ["date,posts,comments,reactions,all"];
  data.series.forEach((s) =>
    lines.push([s.date, s.posts, s.comments, s.reactions, s.all].join(",")),
  );
  return lines.join("\n");
}

export default function CommunityInsights({ slug }) {
  const [audience, setAudience] = useState("everyone");
  const [days, setDays] = useState(28);
  const [metric, setMetric] = useState("posts");
  const [sort, setSort] = useState("top");
  const [by, setBy] = useState("all");
  const [weekday, setWeekday] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    COMMUNITYAPI.insights(slug, {
      audience,
      days,
      sort,
      by,
      tzOffset: new Date().getTimezoneOffset(),
    })
      .then((res) => {
        if (cancelled) return;
        setData(res?.data?.data);
        setError("");
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, "Failed to load insights"));
      });
    return () => {
      cancelled = true;
    };
  }, [slug, audience, days, sort, by]);

  const chart = useMemo(
    () =>
      (data?.series || []).map((s) => ({
        label: SHORT_FMT.format(new Date(`${s.date}T00:00:00`)),
        value: s[metric],
      })),
    [data, metric],
  );
  const maxDay = Math.max(1, ...(data?.popularDays || [0]));
  const hours = data?.popularTimes?.[weekday] || [];
  const hoursData = hours.map((value, h) => ({
    label: `${h % 12 || 12}${h < 12 ? "a" : "p"}`,
    value,
  }));
  const hasHours = hours.some((v) => v > 0);

  if (error) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        {error}
      </p>
    );
  }
  if (!data) {
    return <p className="py-10 text-center text-slate-400">Loading insights…</p>;
  }

  const total = data.totals[metric];
  const prev = data.previous[metric];
  const change = prev ? Math.round(((total - prev) / prev) * 100) : total ? 100 : 0;

  const download = () => {
    const blob = new Blob([toCsv(data)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `community-insights-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill value={audience} onChange={setAudience} options={AUDIENCES} />
        <Pill
          value={days}
          onChange={(v) => setDays(Number(v))}
          options={RANGES}
        />
        <button
          type="button"
          onClick={download}
          className="ml-auto inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
        >
          <Download size={16} /> Download
        </button>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Heading
              title={`${total.toLocaleString()} ${METRICS.find((m) => m.key === metric).label.toLowerCase()}`}
              hint="Activity from the selected audience in the selected period"
            />
            <p className="text-xs text-slate-500">
              <span className={change < 0 ? "text-red-500" : "text-green-600"}>
                {change < 0 ? "▼" : "▲"} {Math.abs(change)}%
              </span>{" "}
              vs. {DATE_FMT.format(new Date(data.previousRange.from))} -{" "}
              {DATE_FMT.format(new Date(data.previousRange.to))}
            </p>
            <p className="text-xs text-slate-500">
              {DATE_FMT.format(new Date(data.range.from))} -{" "}
              {DATE_FMT.format(new Date(data.range.to))}
            </p>
          </div>
          <div className="flex gap-2">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMetric(m.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${metric === m.key ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chart}
              margin={{ top: 10, right: 12, bottom: 0, left: 0 }}
            >
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                allowDecimals={false}
                orientation="right"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Line
                type="linear"
                dataKey="value"
                name={METRICS.find((m) => m.key === metric).label}
                stroke="#1877f2"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <Heading
            title="Popular days"
            hint="Average activity per weekday in the selected period"
          />
          <p className="mt-1 text-xs text-slate-500">
            The average number of times members post, comment or react on a
            given day in the specified date range.
          </p>
          <div className="mt-4 flex h-44 items-end gap-3 border-b border-slate-200 px-2">
            {data.popularDays.map((v, i) => (
              <div
                key={i}
                className="flex h-full flex-1 flex-col items-center justify-end"
                title={`${v}`}
              >
                <div
                  className={`w-full rounded-t ${v === Math.max(...data.popularDays) && v > 0 ? "bg-blue-600" : "bg-blue-300"}`}
                  style={{ height: `${Math.max((v / maxDay) * 100, v > 0 ? 4 : 0)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-3 px-2 text-center text-xs text-slate-500">
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="flex-1">
                {d}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <Heading
            title="Popular times"
            hint="Average activity per hour for the selected weekday"
          />
          <p className="mt-1 text-xs text-slate-500">
            The average number of times members post, comment or react at a
            given hour of the day in the specified date range.
          </p>
          <div className="mt-3 flex gap-2">
            {WEEKDAYS.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setWeekday(i)}
                className={`h-9 w-9 rounded-full text-sm font-semibold ${weekday === i ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {d}
              </button>
            ))}
          </div>
          {hasHours ? (
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursData}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="value" name="Avg activity" fill="#60a5fa" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="flex h-40 items-center justify-center text-sm font-semibold text-slate-600">
              No data to show
            </p>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Heading
              title="Posts"
              hint="Posts published in the selected period"
            />
            <p className="text-xs text-slate-500">
              The posts with the most activity in the last {data.days} days.
            </p>
          </div>
          <div className="flex gap-2">
            <Pill value={sort} onChange={setSort} options={SORTS} />
            <Pill value={by} onChange={setBy} options={AUTHORS} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-[110px_1fr_auto] gap-x-4 border-b border-slate-100 pb-2 text-sm text-slate-500">
          <span>Date</span>
          <span>Post</span>
          <span />
        </div>
        {data.posts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No posts in this period.
          </p>
        ) : (
          data.posts.map((p) => {
            const d = new Date(p.createdAt);
            return (
              <div
                key={p.id}
                className="grid grid-cols-[110px_1fr_auto] items-center gap-x-4 border-b border-slate-50 py-3"
              >
                <div className="text-sm text-slate-700">
                  <p>{d.toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">
                    {d.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="line-clamp-2 break-words text-sm text-slate-900">
                      {p.body}
                    </p>
                    <p className="text-xs text-slate-500">Posted by {p.author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-sm text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle size={16} className="text-slate-500" />
                    {p.comments}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ThumbsUp size={16} className="text-slate-500" />
                    {p.likes}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 text-slate-400"
                    title="Views are not tracked yet"
                  >
                    <Eye size={16} />–
                  </span>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
