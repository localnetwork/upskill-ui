"use client";

import BaseApi from "@/lib/api/_base.api";
import modalState from "@/lib/store/modalState";
import { Star, ThumbsUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderStars(value) {
  const rating = Number(value || 0);
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={`star-${index}`}
      size={14}
      className={index < rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"}
    />
  ));
}

function ReviewCard({ review, liking, onToggleLike }) {
  return (
    <div className="p-4 border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">
            {review?.author?.fullName || review?.user?.username || "Learner"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">{renderStars(review?.rating)}</div>
            <span className="text-xs text-slate-500">{formatDate(review?.createdAt)}</span>
          </div>
        </div>
      </div>
      {review?.title ? (
        <p className="mt-3 font-semibold text-slate-800">{review.title}</p>
      ) : null}
      <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
        {review?.comment || "No written comment."}
      </p>
      <div className="mt-3">
        <button
          type="button"
          disabled={!review?.canLike || liking}
          onClick={() => onToggleLike?.(review?.id)}
          className={`inline-flex items-center gap-2 text-xs font-semibold transition ${
            review?.canLike
              ? review?.likedByMe
                ? "text-[#0056D2]"
                : "text-slate-600 hover:text-[#0056D2]"
              : "text-slate-400 cursor-not-allowed"
          }`}
        >
          <ThumbsUp size={14} className={review?.likedByMe ? "fill-[#0056D2]" : ""} />
          Helpful ({Number(review?.likesCount || 0)})
        </button>
      </div>
    </div>
  );
}

export default function CourseReviewModal() {
  const modalInfo = modalState((state) => state.modalInfo);
  const mode = modalInfo?.data?.mode || "write";
  const courseId = modalInfo?.data?.courseId || "";
  const sort = modalInfo?.data?.sort || "recent";

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loadingRows, setLoadingRows] = useState(false);
  const [likingReviewIds, setLikingReviewIds] = useState([]);

  const normalizeReview = (review) => ({
    ...review,
    likesCount: Number(review?.likesCount || 0),
    likedByMe: Boolean(review?.likedByMe),
    canLike: Boolean(review?.canLike),
  });

  const canSubmit = rating >= 1 && rating <= 5 && String(comment).trim().length > 0;

  const closeModal = () => {
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

  const fetchRows = async (targetPage = 1) => {
    if (!courseId) return;
    setLoadingRows(true);
    try {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews/courses/${encodeURIComponent(courseId)}?page=${targetPage}&limit=10&sort=${encodeURIComponent(sort)}`,
      );
      setRows(
        Array.isArray(response?.data?.data)
          ? response.data.data.map(normalizeReview)
          : [],
      );
      setMeta({
        page: Number(response?.data?.meta?.page || targetPage),
        totalPages: Number(response?.data?.meta?.totalPages || 1),
        total: Number(response?.data?.meta?.total || 0),
      });
    } catch (error) {
      toast.error(error?.data?.message || "Unable to load reviews.");
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    if (mode === "list") {
      fetchRows(1);
    }
  }, [mode, courseId, sort]);

  const onSubmitReview = async () => {
    if (!canSubmit || !courseId || submitting) return;
    setSubmitting(true);
    try {
      await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/reviews`, {
        courseId,
        rating,
        title: String(title || "").trim() || null,
        comment: String(comment || "").trim(),
      });
      toast.success("Review submitted.");
      if (typeof modalInfo?.data?.onSubmitted === "function") {
        modalInfo.data.onSubmitted();
      }
      closeModal();
    } catch (error) {
      toast.error(error?.data?.message || "Unable to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const listSummary = useMemo(() => {
    if (!meta.total) return "No reviews yet.";
    return `${meta.total} review${meta.total > 1 ? "s" : ""}`;
  }, [meta.total]);

  const onToggleLike = async (reviewId) => {
    if (!reviewId) return;
    if (likingReviewIds.includes(reviewId)) return;

    let previous = null;
    let canToggle = false;

    setRows((prev) =>
      prev.map((review) => {
        if (review.id !== reviewId) return review;
        if (!review.canLike) return review;
        canToggle = true;
        previous = {
          likedByMe: Boolean(review.likedByMe),
          likesCount: Number(review.likesCount || 0),
        };
        const nextLiked = !Boolean(review.likedByMe);
        return {
          ...review,
          likedByMe: nextLiked,
          likesCount: Math.max(0, Number(review.likesCount || 0) + (nextLiked ? 1 : -1)),
        };
      }),
    );

    if (!canToggle) {
      toast.error("Only other enrolled students of this course can like this review.");
      return;
    }

    setLikingReviewIds((prev) => [...prev, reviewId]);
    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews/${encodeURIComponent(reviewId)}/like`,
      );
      const payload = response?.data?.data || {};
      setRows((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                likedByMe: Boolean(payload.liked),
                likesCount: Math.max(0, Number(payload.likesCount || 0)),
              }
            : review,
        ),
      );
    } catch (error) {
      if (previous) {
        setRows((prev) =>
          prev.map((review) =>
            review.id === reviewId
              ? {
                  ...review,
                  likedByMe: previous.likedByMe,
                  likesCount: previous.likesCount,
                }
              : review,
          ),
        );
      }
      toast.error(error?.data?.message || "Unable to update review like.");
    } finally {
      setLikingReviewIds((prev) => prev.filter((id) => id !== reviewId));
    }
  };

  if (mode === "list") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">{listSummary}</p>
        {loadingRows ? <p className="text-sm text-slate-500">Loading reviews...</p> : null}
        {!loadingRows && rows.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews available.</p>
        ) : null}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {rows.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              liking={likingReviewIds.includes(review.id)}
              onToggleLike={onToggleLike}
            />
          ))}
        </div>
        {meta.totalPages > 1 ? (
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {Array.from({ length: meta.totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={`review-page-${page}`}
                onClick={() => fetchRows(page)}
                className={`px-3 py-1 border rounded ${page === meta.page ? "bg-[#0056D2] text-white border-[#0056D2]" : "bg-white text-slate-700 border-slate-300"}`}
              >
                {page}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Rating</p>
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }, (_, index) => index + 1).map((starValue) => (
            <button
              key={`rating-${starValue}`}
              type="button"
              onClick={() => setRating(starValue)}
              className="cursor-pointer"
            >
              <Star
                size={24}
                className={
                  starValue <= rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-slate-300"
                }
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">Title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
          placeholder="Short summary of your review"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          className="mt-1 w-full border border-slate-300 rounded px-3 py-2"
          placeholder="What did you like? What can be improved?"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={closeModal}
          className="px-4 py-2 border border-slate-300 rounded text-slate-700"
        >
          Cancel
        </button>
        <button
          disabled={!canSubmit || submitting}
          onClick={onSubmitReview}
          className={`px-4 py-2 rounded text-white ${canSubmit && !submitting ? "bg-[#0056D2]" : "bg-slate-400 cursor-not-allowed"}`}
        >
          {submitting ? "Submitting..." : "Submit review"}
        </button>
      </div>
    </div>
  );
}
