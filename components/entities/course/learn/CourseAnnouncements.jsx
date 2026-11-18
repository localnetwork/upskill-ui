import { useEffect, useState } from "react";
import { Megaphone, MessageSquare } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AnnouncementComments({ notificationId }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const url = `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/comments`;

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    BaseApi.get(url, { params: { page: 1, limit: 100 } })
      .then((response) => {
        if (active) {
          setComments(
            Array.isArray(response?.data?.data) ? response.data.data : [],
          );
        }
      })
      .catch(() => {
        if (active) setError("Unable to load comments.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, url]);

  const submit = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || posting) return;
    try {
      setPosting(true);
      setError("");
      const response = await BaseApi.post(url, { body });
      const created = response?.data?.data;
      if (created) setComments((previous) => [...previous, created]);
      setDraft("");
    } catch (_error) {
      setError("Unable to post comment.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary"
      >
        <MessageSquare size={16} />
        {open ? "Hide comments" : "Comments"}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No comments yet. Start the conversation.
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-md bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-800">
                    {comment.author?.fullName ||
                      comment.author?.username ||
                      "Learner"}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line break-words text-sm text-slate-700">
                  {comment.body}
                </p>
              </div>
            ))
          )}

          <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="Write a comment..."
              className="min-w-0 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={posting || !draft.trim()}
              className="cursor-pointer self-end rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </form>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      )}
    </div>
  );
}

export default function CourseAnnouncements({ courseId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) return;
    let active = true;
    setLoading(true);
    setError("");
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      params: {
        kind: "INSTRUCTOR_ANNOUNCEMENT",
        courseId,
        page: 1,
        limit: 30,
      },
    })
      .then((response) => {
        if (!active) return;
        setItems(Array.isArray(response?.data?.data) ? response.data.data : []);
      })
      .catch(() => {
        if (active) setError("Unable to load announcements.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map((key) => (
          <div key={key} className="h-24 rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
        <Megaphone size={28} />
        <p className="text-sm">No announcements for this course yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const sender = item?.metadata?.sender;
        return (
          <li
            key={item.id}
            className="rounded-lg border border-slate-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-slate-800">{item.title}</h3>
              <span className="shrink-0 text-xs text-slate-500">
                {formatDate(item.createdAt)}
              </span>
            </div>
            {sender?.fullName || sender?.username ? (
              <p className="mt-0.5 text-xs text-slate-500">
                by {sender.fullName || sender.username}
              </p>
            ) : null}
            <p className="mt-2 whitespace-pre-line break-words text-sm text-slate-700">
              {item.message}
            </p>
            <AnnouncementComments notificationId={item.id} />
          </li>
        );
      })}
    </ul>
  );
}
