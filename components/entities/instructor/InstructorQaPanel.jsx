import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import COMMUNICATIONAPI from "@/lib/api/communication/request";
import persistentStore from "@/lib/store/persistentStore";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "needs_reply", label: "Needs reply" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
];

const PAGE_SIZE = 15;

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function fullName(user) {
  return `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username || "User";
}

function statusOf(row) {
  if (row.isResolved) return { label: "Resolved", className: "text-emerald-700" };
  if (row.answered) return { label: "Answered", className: "text-slate-600" };
  return { label: "Needs reply", className: "text-amber-700" };
}

function ThreadDetail({ row, onChanged }) {
  const profile = persistentStore((state) => state.profile);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await COMMUNICATIONAPI.getDiscussionThread(row.id);
      setThread(res?.data?.data || null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load the conversation.");
    } finally {
      setLoading(false);
    }
  }, [row.id]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await COMMUNICATIONAPI.replyToDiscussion(row.id, body);
      setReply("");
      await load();
      onChanged();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  const toggleResolved = async () => {
    if (!thread || toggling) return;
    setToggling(true);
    try {
      const res = await COMMUNICATIONAPI.setDiscussionResolved(row.id, !thread.isResolved);
      setThread(res?.data?.data || thread);
      onChanged();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update the thread.");
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <p className="px-4 py-5 text-sm text-slate-500">Loading...</p>;
  if (!thread) return <p className="px-4 py-5 text-sm text-slate-500">Conversation unavailable.</p>;

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
      <p className="whitespace-pre-wrap text-sm text-slate-800">{thread.body}</p>
      {thread.imagePath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thread.imagePath}
          alt="Attachment"
          className="mt-3 max-h-64 rounded border border-slate-200"
        />
      ) : null}
      {row.course?.slug ? (
        <a
          href={`/courses/${row.course?.slug}/learn`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        >
          Open course
        </a>
      ) : null}

      {thread.replies?.length ? (
        <ul className="mt-4 space-y-3 border-l-2 border-slate-200 pl-4">
          {thread.replies.map((item) => {
            const mine = item.author?.id && item.author.id === profile?.id;
            return (
              <li key={item.id}>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {mine ? "You" : fullName(item.author)}
                  </span>{" "}
                  · {formatDateTime(item.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{item.body}</p>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="mt-4">
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") send();
          }}
          rows={3}
          maxLength={5000}
          placeholder="Write a reply"
          className="w-full rounded border border-slate-300 bg-white p-3 text-sm outline-none focus:border-primary"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={toggleResolved}
            disabled={toggling}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {thread.isResolved ? "Reopen" : "Mark as resolved"}
          </button>
          <button
            type="button"
            onClick={send}
            disabled={sending || !reply.trim()}
            className="rounded bg-primary px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {sending ? "Sending..." : "Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InstructorQaPanel({ courses = [] }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [courseId, setCourseId] = useState("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = { page, limit: PAGE_SIZE, courseId };
      if (filter === "needs_reply") params.onlyUnanswered = true;
      if (filter === "open" || filter === "resolved") params.status = filter;
      const res = await COMMUNICATIONAPI.getInstructorQa(params);
      setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
      setMeta({
        page: Number(res?.data?.meta?.page || 1),
        totalPages: Number(res?.data?.meta?.totalPages || 1),
        total: Number(res?.data?.meta?.total || 0),
      });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load Q&A.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, courseId, page]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const changeFilter = (next) => {
    setFilter(next);
    setPage(1);
    setOpenId(null);
  };

  return (
    <section className="rounded-lg border border-[#e2e8f0] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex gap-1">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => changeFilter(item.key)}
              className={`rounded px-3 py-1.5 text-sm font-medium ${
                filter === item.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <select
          value={courseId}
          onChange={(event) => {
            setCourseId(event.target.value);
            setPage(1);
            setOpenId(null);
          }}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="all">All courses</option>
          {courses
            .filter((course) => course.id !== "all")
            .map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
        </select>
      </div>

      {loading ? (
        <p className="px-4 py-8 text-sm text-slate-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-slate-500">
          {filter === "all" ? "No learner questions yet." : "Nothing matches this filter."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-200">
          {rows.map((row) => {
            const status = statusOf(row);
            const open = openId === row.id;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : row.id)}
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {row.question}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {row.learner?.fullName} · {row.course?.title} ·{" "}
                      {formatDateTime(row.createdAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs">
                    <span className={`block font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="text-slate-500">
                      {row.repliesCount} {row.repliesCount === 1 ? "reply" : "replies"}
                    </span>
                  </span>
                </button>
                {open ? <ThreadDetail row={row} onChanged={load} /> : null}
              </li>
            );
          })}
        </ul>
      )}

      {meta.totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
          <span>
            Page {meta.page} of {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
