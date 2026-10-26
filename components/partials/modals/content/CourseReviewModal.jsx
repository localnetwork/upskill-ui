"use client";

import BaseApi from "@/lib/api/_base.api";
import modalState from "@/lib/store/modalState";
import { Star } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import ReviewsListView from "@/components/entities/course/show/ReviewsListView";

export default function CourseReviewModal() {
  const modalInfo = modalState((state) => state.modalInfo);
  const mode = modalInfo?.data?.mode || "write";
  const courseId = modalInfo?.data?.courseId || "";

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = rating >= 1 && rating <= 5 && String(comment).trim().length > 0;

  const closeModal = () => {
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

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

  if (mode === "list") {
    return (
      <ReviewsListView
        courseId={courseId}
        initialSort={modalInfo?.data?.sort || "recent"}
      />
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
