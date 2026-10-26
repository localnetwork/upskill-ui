import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";
import { Star, ThumbsUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import toast from "react-hot-toast";

export function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    const count = Math.floor(seconds / size);
    if (count >= 1) return `${count} ${unit}${count > 1 ? "s" : ""} ago`;
  }
  return "Just now";
}

export function normalizeReview(review) {
  return {
    ...review,
    likesCount: Number(review?.likesCount || 0),
    likedByMe: Boolean(review?.likedByMe),
    canLike: Boolean(review?.canLike),
    canReply: Boolean(review?.canReply),
    authorReply: String(review?.authorReply || ""),
    authorReplyAt: review?.authorReplyAt || null,
  };
}

export function ReviewStars({ value, size = 14 }) {
  const rating = Math.round(Number(value || 0));
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={`review-star-${index}`}
          size={size}
          className={
            index < rating
              ? "fill-amber-700 text-amber-700"
              : "fill-slate-200 text-slate-200"
          }
        />
      ))}
    </span>
  );
}

function getInitials(author) {
  const first = author?.firstName?.[0] || "";
  const last = author?.lastName?.[0] || "";
  const initials = `${first}${last}`.toUpperCase();
  return (
    initials ||
    String(author?.fullName || "L")
      .slice(0, 2)
      .toUpperCase()
  );
}

function resolvePicture(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_API_DOMAIN || ""}${path}`;
}

function ReviewAvatar({ author, className }) {
  const src = resolvePicture(author?.picture);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={author?.fullName || "Learner"}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-slate-900 font-semibold text-white ${className}`}
    >
      {getInitials(author)}
    </span>
  );
}

const TextEditor = dynamic(() => import("@/components/forms/TextEditor"), {
  ssr: false,
});

function ReplyForm({ review, actions, replying }) {
  if (!review?.canReply) return null;
  return (
    <div className="mt-4 space-y-2">
      <label className="text-xs font-semibold text-slate-700">
        Reply as author
      </label>
      <TextEditor
        name={`reply-${review.id}`}
        value={actions.getReplyDraftValue(review)}
        height={200}
        onChange={(event) =>
          actions.setReplyDraftValue(review.id, event.target.value)
        }
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => actions.submitReply(review)}
          disabled={replying}
          className="rounded-lg bg-[#0056D2] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          {replying
            ? "Saving..."
            : review?.authorReply
              ? "Update reply"
              : "Reply"}
        </button>
      </div>
    </div>
  );
}

function ReplyBody({ html }) {
  return (
    <div
      className="mt-1 break-words text-sm text-slate-700 [&_a]:text-[#0056D2] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function useReviewActions(setReviews) {
  const profile = persistentStore((state) => state.profile);
  const [likingReviewIds, setLikingReviewIds] = useState([]);
  const [replyingReviewIds, setReplyingReviewIds] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});

  const getReplyDraftValue = (review) => {
    const draft = replyDrafts?.[review.id];
    if (typeof draft === "string") return draft;
    return String(review?.authorReply || "");
  };

  const setReplyDraftValue = (reviewId, value) => {
    setReplyDrafts((prev) => ({ ...prev, [reviewId]: value }));
  };

  const patchReview = (reviewId, patch) =>
    setReviews((prev) =>
      prev.map((row) => (row.id === reviewId ? { ...row, ...patch } : row)),
    );

  const submitReply = async (review) => {
    if (!review?.id || !review?.canReply || !profile?.id) return;
    if (replyingReviewIds.includes(review.id)) return;

    const authorReply = String(getReplyDraftValue(review) || "").trim();
    if (!authorReply.replace(/<[^>]*>|&nbsp;/g, "").trim()) {
      toast.error("Reply is required.");
      return;
    }

    setReplyingReviewIds((prev) => [...prev, review.id]);
    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews/${encodeURIComponent(review.id)}/reply`,
        { authorReply },
      );
      const updated = normalizeReview(response?.data?.data || {});
      patchReview(review.id, updated);
      setReplyDraftValue(review.id, updated.authorReply || authorReply);
      toast.success("Reply saved.");
    } catch (error) {
      toast.error(error?.data?.message || "Unable to save reply.");
    } finally {
      setReplyingReviewIds((prev) => prev.filter((id) => id !== review.id));
    }
  };

  const toggleLike = async (review) => {
    const reviewId = review?.id;
    if (!reviewId || likingReviewIds.includes(reviewId)) return;
    if (!review.canLike) {
      toast.error(
        "Only other enrolled students of this course can like this review.",
      );
      return;
    }

    const previous = {
      likedByMe: Boolean(review.likedByMe),
      likesCount: Number(review.likesCount || 0),
    };
    const nextLiked = !previous.likedByMe;
    patchReview(reviewId, {
      likedByMe: nextLiked,
      likesCount: Math.max(0, previous.likesCount + (nextLiked ? 1 : -1)),
    });

    setLikingReviewIds((prev) => [...prev, reviewId]);
    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews/${encodeURIComponent(reviewId)}/like`,
      );
      const payload = response?.data?.data || {};
      patchReview(reviewId, {
        likedByMe: Boolean(payload.liked),
        likesCount: Math.max(0, Number(payload.likesCount || 0)),
      });
    } catch (error) {
      patchReview(reviewId, previous);
      toast.error(error?.data?.message || "Unable to update review like.");
    } finally {
      setLikingReviewIds((prev) => prev.filter((id) => id !== reviewId));
    }
  };

  return {
    likingReviewIds,
    replyingReviewIds,
    getReplyDraftValue,
    setReplyDraftValue,
    submitReply,
    toggleLike,
  };
}

export function ModalReviewCard({ review, actions }) {
  const author = review?.author;
  const liking = actions.likingReviewIds.includes(review.id);
  const replying = actions.replyingReviewIds.includes(review.id);

  return (
    <article className="border-t border-slate-300 py-6 first:border-t-0 first:pt-2">
      <div className="flex items-start gap-4">
        <ReviewAvatar author={author} className="h-[50px] w-[50px] text-base" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900">
            {author?.fullName || "Learner"}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={`modal-star-${index}`}
                  size={12}
                  className={
                    index < Math.round(Number(review?.rating || 0))
                      ? "fill-amber-700 text-amber-700"
                      : "text-amber-700"
                  }
                />
              ))}
            </span>
            <span className="font-bold text-slate-500">
              {formatRelativeTime(review?.createdAt)}
            </span>
          </div>

          {review?.title ? (
            <p className="mt-3 font-semibold text-slate-900">{review.title}</p>
          ) : null}
          <p className="mt-3 whitespace-pre-wrap break-words           leading-7 text-slate-700">
            {review?.comment || "No written comment."}
          </p>

          {review?.authorReply ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-800">
                  {review?.courseAuthor?.fullName ||
                    review?.courseAuthor?.username ||
                    "Course author"}
                </p>
                <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1D4ED8]">
                  Author
                </span>
              </div>
              <ReplyBody html={review.authorReply} />
              {review?.authorReplyAt ? (
                <p className="mt-1 text-xs text-slate-500">
                  {formatReviewDate(review.authorReplyAt)}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
            <span>Helpful?</span>
            <button
              type="button"
              aria-label="Mark as helpful"
              disabled={!review?.canLike || liking}
              onClick={() => actions.toggleLike(review)}
              className={`inline-flex items-center gap-1.5 rounded-full p-1.5 transition ${
                review?.canLike
                  ? review?.likedByMe
                    ? "text-[#0056D2]"
                    : "text-slate-700 hover:bg-slate-100"
                  : "cursor-not-allowed text-slate-400"
              }`}
            >
              <ThumbsUp
                size={18}
                className={review?.likedByMe ? "fill-[#0056D2]" : ""}
              />
              <span className="text-xs font-semibold">
                {Number(review?.likesCount || 0)}
              </span>
            </button>
          </div>

          <ReplyForm review={review} actions={actions} replying={replying} />
        </div>
      </div>
    </article>
  );
}

export function ReviewCard({ review, actions }) {
  const author = review?.author;
  const liking = actions.likingReviewIds.includes(review.id);
  const replying = actions.replyingReviewIds.includes(review.id);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
        <div className="flex shrink-0 items-center gap-3 sm:w-[140px] sm:items-start">
          <ReviewAvatar
            author={author}
            className="h-12 w-12 bg-[#0B3D91] text-xl sm:h-[60px] sm:w-[60px] sm:text-2xl"
          />
          <span className="text-sm font-bold text-slate-900 sm:mt-1">
            {author?.fullName || "Learner"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <ReviewStars value={review?.rating} />
            <span className="font-bold text-slate-900">
              {Number(review?.rating || 0).toFixed(1)}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600">
              Reviewed on {formatReviewDate(review?.createdAt)}
            </span>
          </div>

          {review?.title ? (
            <p className="mt-3 font-semibold text-slate-900">{review.title}</p>
          ) : null}
          <p className="mt-3 whitespace-pre-wrap break-words           leading-7 text-slate-800">
            {review?.comment || "No written comment."}
          </p>

          {review?.authorReply ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-800">
                  {review?.courseAuthor?.fullName ||
                    review?.courseAuthor?.username ||
                    "Course author"}
                </p>
                <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1D4ED8]">
                  Author
                </span>
              </div>
              <ReplyBody html={review.authorReply} />
              {review?.authorReplyAt ? (
                <p className="mt-1 text-xs text-slate-500">
                  {formatReviewDate(review.authorReplyAt)}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4">
            <button
              type="button"
              disabled={!review?.canLike || liking}
              onClick={() => actions.toggleLike(review)}
              className={`inline-flex items-center gap-2 text-xs font-semibold transition ${
                review?.canLike
                  ? review?.likedByMe
                    ? "text-[#0056D2]"
                    : "text-slate-600 hover:text-[#0056D2]"
                  : "cursor-not-allowed text-slate-400"
              }`}
            >
              <ThumbsUp
                size={14}
                className={review?.likedByMe ? "fill-[#0056D2]" : ""}
              />
              Helpful ({Number(review?.likesCount || 0)})
            </button>
          </div>

          <ReplyForm review={review} actions={actions} replying={replying} />
        </div>
      </div>
    </article>
  );
}
