import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import COMMUNICATIONAPI from "@/lib/api/communication/request";
import persistentStore from "@/lib/store/persistentStore";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "needs_reply", label: "Needs reply" },
  { key: "unread", label: "Unread" },
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

function Conversation({ row, onChanged }) {
  const profile = persistentStore((state) => state.profile);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await COMMUNICATIONAPI.getChatMessages(row.id, { page: 1, limit: 50 });
      setMessages(Array.isArray(res?.data?.data) ? res.data.data : []);
      if (row.unread) {
        await COMMUNICATIONAPI.markChatRead(row.id);
        onChanged();
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load the conversation.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.id]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await COMMUNICATIONAPI.sendChatMessage(row.id, body);
      setText("");
      const res = await COMMUNICATIONAPI.getChatMessages(row.id, { page: 1, limit: 50 });
      setMessages(Array.isArray(res?.data?.data) ? res.data.data : []);
      onChanged();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <ul className="max-h-80 space-y-3 overflow-y-auto">
          {messages
            .filter((item) => item.type !== "SYSTEM")
            .map((item) => {
              const mine = item.senderId === profile?.id;
              return (
                <li key={item.id} className={mine ? "text-right" : ""}>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {mine ? "You" : row.learner.name}
                    </span>{" "}
                    · {formatDateTime(item.createdAt)}
                  </p>
                  <p
                    className={`mt-1 inline-block max-w-[80%] whitespace-pre-wrap rounded px-3 py-2 text-left text-sm ${
                      mine ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {item.deletedForEveryone
                      ? "Message removed"
                      : item.body || (item.mediaPath ? "[attachment]" : "")}
                  </p>
                </li>
              );
            })}
        </ul>
      )}

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") send();
        }}
        rows={3}
        maxLength={5000}
        placeholder={`Reply to ${row.learner.name}`}
        className="mt-4 w-full rounded border border-slate-300 bg-white p-3 text-sm outline-none focus:border-primary"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <Link
          href={`/messages?conversationId=${row.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Open in Messages
        </Link>
        <button
          type="button"
          onClick={send}
          disabled={sending || !text.trim()}
          className="rounded bg-primary px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default function InstructorMessagesPanel({ courses = [] }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [summary, setSummary] = useState({ unreadMessages: 0, unansweredMessages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [courseId, setCourseId] = useState("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const params = { page, limit: PAGE_SIZE, courseId };
      if (query) params.q = query;
      if (filter === "needs_reply") params.notAnswered = true;
      if (filter === "unread") params.unread = true;
      const res = await COMMUNICATIONAPI.getInstructorMessages(params);
      setRows(Array.isArray(res?.data?.data) ? res.data.data : []);
      setMeta({
        page: Number(res?.data?.meta?.page || 1),
        totalPages: Number(res?.data?.meta?.totalPages || 1),
        total: Number(res?.data?.meta?.total || 0),
      });
      setSummary(res?.data?.summary || { unreadMessages: 0, unansweredMessages: 0 });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load messages.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, courseId, query, page]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const changeFilter = (next) => {
    setFilter(next);
    setPage(1);
    setOpenId(null);
  };

  const counts = {
    needs_reply: summary.unansweredMessages,
    unread: summary.unreadMessages,
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
                filter === item.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
              {counts[item.key] ? ` (${counts[item.key]})` : ""}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search learner or message"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
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
      </div>

      {loading ? (
        <p className="px-4 py-8 text-sm text-slate-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-slate-500">
          {filter === "all" && !query
            ? "No direct messages from your learners yet. Learners enrolled in your courses can message you from Messages."
            : "Nothing matches this filter."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-200">
          {rows.map((row) => {
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
                    <span
                      className={`block truncate text-sm text-slate-900 ${
                        row.unread ? "font-bold" : "font-semibold"
                      }`}
                    >
                      {row.learner.name}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-slate-600">
                      {row.lastFromLearner ? "" : "You: "}
                      {row.preview}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {row.courses.map((course) => course.title).join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-xs">
                    <span className="block text-slate-500">{formatDateTime(row.lastMessageAt)}</span>
                    {row.unread ? (
                      <span className="font-semibold text-primary">{row.unreadCount} new</span>
                    ) : row.needsReply ? (
                      <span className="font-semibold text-amber-700">Needs reply</span>
                    ) : null}
                  </span>
                </button>
                {open ? <Conversation row={row} onChanged={load} /> : null}
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
