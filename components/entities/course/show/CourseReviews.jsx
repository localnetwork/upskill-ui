import BaseApi from "@/lib/api/_base.api";
import modalState from "@/lib/store/modalState";
import { MessageSquareText, Star } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ReviewCard, normalizeReview, useReviewActions } from "./reviewShared";

const PAGE_SIZE = 5;

function getEligibilityMessage(eligibility) {
  if (!eligibility) return "";
  if (eligibility?.canReview) return "You can write a review for this course.";
  if (eligibility?.reason === "ALREADY_REVIEWED") {
    return "You already submitted a review for this course.";
  }
  if (eligibility?.reason === "COURSE_NOT_COMPLETED") {
    return "Finish the course first to write a review.";
  }
  if (eligibility?.reason === "NOT_ENROLLED") {
    return "Only enrolled learners can write reviews.";
  }
  if (eligibility?.reason === "AUTH_REQUIRED") {
    return "Log in as a learner to write a review.";
  }
  return "";
}

export default function CourseReviews({ courseId }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [],
  });
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const actions = useReviewActions(setReviews);

  const fetchReviews = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews/courses/${encodeURIComponent(courseId)}?page=1&limit=${PAGE_SIZE}&sort=recent`,
      );
      setReviews(
        Array.isArray(response?.data?.data)
          ? response.data.data.map(normalizeReview)
          : [],
      );
      setSummary(
        response?.data?.summary || {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: [],
        },
      );
    } catch (error) {
      toast.error(error?.data?.message || "Unable to load reviews.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibility = async () => {
    if (!courseId) return;
    try {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews/courses/${encodeURIComponent(courseId)}/eligibility`,
      );
      setEligibility(response?.data?.data || null);
    } catch (_error) {
      setEligibility(null);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchEligibility();
  }, [courseId]);

  const canWriteReview = Boolean(eligibility?.canReview);
  const eligibilityMessage = getEligibilityMessage(eligibility);

  const openWriteReviewModal = () => {
    if (!courseId) return;
    if (!canWriteReview) {
      if (eligibilityMessage) toast.error(eligibilityMessage);
      return;
    }
    modalState.setState({
      modalInfo: {
        type: "COURSE_REVIEW",
        title: "Write a review",
        size: "md",
        data: {
          mode: "write",
          courseId,
          onSubmitted: () => {
            fetchReviews();
            fetchEligibility();
          },
        },
      },
    });
  };

  const openReviewsListModal = () => {
    if (!courseId) return;
    modalState.setState({
      modalInfo: {
        type: "COURSE_REVIEW",
        title: "",
        size: "2xl",
        data: { mode: "list", courseId, sort: "recent" },
      },
    });
  };

  const averageRating = Number(summary?.averageRating || 0);
  const totalReviews = Number(summary?.totalReviews || 0);
  const ratingDistribution = Array.isArray(summary?.ratingDistribution)
    ? summary.ratingDistribution
    : [];

  return (
    <section id="reviews" className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Learner reviews</h2>

        <div className="mt-6 flex items-center gap-2">
          <Star size={20} className="fill-amber-700 text-amber-700" />
          <span className="text-4xl font-bold text-slate-900">
            {averageRating ? averageRating.toFixed(1) : "0.0"}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-700">
          {totalReviews.toLocaleString()} review{totalReviews === 1 ? "" : "s"}
        </p>

        <div className="mt-6 space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const row = ratingDistribution.find(
              (item) => item.rating === rating,
            );
            const percentage = Number(row?.percentage || 0);
            return (
              <div
                key={`distribution-${rating}`}
                className="flex items-center gap-3"
              >
                <span className="w-14 shrink-0 text-sm font-semibold text-slate-900">
                  {rating} {rating === 1 ? "star" : "stars"}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#0056D2]"
                    style={{
                      width: `${Math.min(100, Math.max(0, percentage))}%`,
                    }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-sm text-slate-600">
                  {percentage.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={openWriteReviewModal}
          disabled={!canWriteReview}
          className={`mt-6 w-full rounded-lg py-3 font-semibold transition ${
            canWriteReview
              ? "bg-[#0056D2] text-white hover:bg-[#1d6de0]"
              : "cursor-not-allowed bg-slate-200 text-slate-500"
          }`}
        >
          Write a review
        </button>
        {eligibilityMessage ? (
          <p className="mt-2 text-center text-xs text-slate-500">
            {eligibilityMessage}
          </p>
        ) : null}
      </div>

      <div className="min-w-0">
        {reviews.length > 0 ? (
          <p className="text-slate-500">
            Showing {reviews.length} of {totalReviews.toLocaleString()}
          </p>
        ) : null}

        {loading && reviews.length === 0 ? (
          <div className="space-y-4" aria-busy="true">
            {[0, 1].map((item) => (
              <div
                key={`review-skeleton-${item}`}
                className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        ) : null}
        {!loading && reviews.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <MessageSquareText size={26} className="text-amber-700" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">No reviews yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-600">
              Be the first to share your experience and help other learners decide
              if this course is right for them.
            </p>
            <div className="mt-4 flex items-center gap-1">
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={`empty-star-${index}`} size={18} className="text-amber-400" />
              ))}
            </div>
            {canWriteReview ? (
              <button
                onClick={openWriteReviewModal}
                className="mt-5 rounded-lg bg-[#0056D2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d6de0]"
              >
                Write the first review
              </button>
            ) : eligibilityMessage ? (
              <p className="mt-4 text-xs text-slate-500">{eligibilityMessage}</p>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} actions={actions} />
            ))}
          </div>
        )}

        {totalReviews > reviews.length ? (
          <button
            onClick={openReviewsListModal}
            className="mt-5 font-semibold text-[#0056D2] hover:underline"
          >
            Show all {totalReviews.toLocaleString()} reviews
          </button>
        ) : null}
      </div>
    </section>
  );
}
