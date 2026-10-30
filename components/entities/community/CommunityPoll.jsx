import { useState } from "react";
import { BarChart3, Check, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import COMMUNITYAPI from "@/lib/api/community/request";
import { errorMessage } from "./CommunityShared";

export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 10;

export function PollComposer({ poll, onChange, onRemove }) {
  const setOption = (i, value) =>
    onChange({
      ...poll,
      options: poll.options.map((o, j) => (j === i ? value : o)),
    });
  return (
    <div className="mt-3 rounded-lg border border-slate-300 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <BarChart3 size={18} className="text-amber-500" /> Poll options
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove poll"
          className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
        >
          <X size={16} />
        </button>
      </div>
      <div className="space-y-2">
        {poll.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={opt}
              maxLength={120}
              onChange={(e) => setOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
            {poll.options.length > MIN_POLL_OPTIONS ? (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...poll,
                    options: poll.options.filter((_, j) => j !== i),
                  })
                }
                aria-label="Remove option"
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {poll.options.length < MAX_POLL_OPTIONS ? (
        <button
          type="button"
          onClick={() => onChange({ ...poll, options: [...poll.options, ""] })}
          className="mt-2 flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
        >
          <Plus size={16} /> Add option
        </button>
      ) : null}
      <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
        Poll duration
        <select
          value={poll.endsInDays ?? ""}
          onChange={(e) =>
            onChange({
              ...poll,
              endsInDays: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">No end</option>
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="7">1 week</option>
          <option value="30">30 days</option>
        </select>
      </label>
    </div>
  );
}

export function isPollValid(poll) {
  if (!poll) return true;
  const filled = poll.options.map((o) => o.trim()).filter(Boolean);
  return filled.length >= MIN_POLL_OPTIONS;
}

export function PollView({ post, onChange }) {
  const poll = post.poll;
  const [busy, setBusy] = useState(false);
  if (!poll) return null;
  const hasVoted = Boolean(poll.myVoteId);
  const showResults = hasVoted || poll.closed;

  const vote = async (optionId) => {
    if (busy || poll.closed) return;
    setBusy(true);
    try {
      const res =
        poll.myVoteId === optionId
          ? await COMMUNITYAPI.removeVote(post.id)
          : await COMMUNITYAPI.vote(post.id, optionId);
      if (res?.data?.data) onChange(res.data.data);
    } catch (e) {
      toast.error(errorMessage(e, "Failed to vote"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {poll.options.map((o) => {
        const pct = poll.totalVotes
          ? Math.round((o.votes / poll.totalVotes) * 100)
          : 0;
        const mine = poll.myVoteId === o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={busy || poll.closed}
            onClick={() => vote(o.id)}
            className={`relative w-full overflow-hidden rounded-lg border px-3 py-2.5 text-left text-sm ${
              mine ? "border-blue-500" : "border-slate-300 hover:bg-slate-50"
            } disabled:cursor-default`}
          >
            {showResults ? (
              <span
                className={`absolute inset-y-0 left-0 ${mine ? "bg-blue-100" : "bg-slate-100"}`}
                style={{ width: `${pct}%` }}
              />
            ) : null}
            <span className="relative flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 break-words font-medium">
                {mine ? <Check size={16} className="text-blue-600" /> : null}
                {o.text}
              </span>
              {showResults ? (
                <span className="shrink-0 text-xs font-semibold text-slate-600">
                  {pct}% · {o.votes}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
      <p className="text-xs text-slate-500">
        {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
        {poll.closed
          ? " · Poll ended"
          : poll.endsAt
            ? ` · Ends ${new Date(poll.endsAt).toLocaleDateString()}`
            : ""}
        {!poll.closed && hasVoted ? " · Tap your choice again to remove" : ""}
      </p>
    </div>
  );
}
