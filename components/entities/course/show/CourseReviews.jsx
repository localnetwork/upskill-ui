import BaseApi from "@/lib/api/_base.api";
import modalState from "@/lib/store/modalState";
import persistentStore from "@/lib/store/persistentStore";
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
      key={`review-star-${index}`}
      size={14}
      className={
        index < rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"
      }
    />
  ));
}

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
  const profile = persistentStore((state) => state.profile);
  const [sort, setSort] = useState("recent");
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [],
  });
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [likingReviewIds, setLikingReviewIds] = useState([]);
  const [replyingReviewIds, setReplyingReviewIds] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});

  const normalizeReview = (review) => ({
    ...review,
    likesCount: Number(review?.likesCount || 0),
    likedByMe: Boolean(review?.likedByMe),
    canLike: Boolean(review?.canLike),
    canReply: Boolean(review?.canReply),
    authorReply: String(review?.authorReply || ""),
    authorReplyAt: review?.authorReplyAt || null,
  });

  const currentUserId = profile?.id || null;

  const fetchReviews = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews/courses/${encodeURIComponent(courseId)}?page=1&limit=6&sort=${encodeURIComponent(sort)}`,
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
  }, [courseId, sort]);

  useEffect(() => {
    fetchEligibility();
  }, [courseId]);

  const displayedReviews = useMemo(() => reviews.slice(0, 3), [reviews]);
  const canWriteReview = Boolean(eligibility?.canReview);
  const eligibilityMessage = getEligibilityMessage(eligibility);

  const openWriteReviewModal = () => {
    if (!courseId) return;
    if (!canWriteReview) {
      if (eligibilityMessage) {
        toast.error(eligibilityMessage);
      }
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
        title: "All reviews",
        size: "lg",
        data: {
          mode: "list",
          courseId,
          sort,
        },
      },
    });
  };

  const getReplyDraftValue = (review) => {
    const draft = replyDrafts?.[review.id];
    if (typeof draft === "string") return draft;
    return String(review?.authorReply || "");
  };

  const setReplyDraftValue = (reviewId, value) => {
    setReplyDrafts((prev) => ({
      ...prev,
      [reviewId]: value,
    }));
  };

  const handleSubmitReply = async (review) => {
    if (!review?.id || !review?.canReply || !currentUserId) return;
    if (replyingReviewIds.includes(review.id)) return;

    const authorReply = String(getReplyDraftValue(review) || "").trim();
    if (!authorReply) {
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
      setReviews((prev) =>
        prev.map((row) => (row.id === review.id ? { ...row, ...updated } : row)),
      );
      setReplyDraftValue(review.id, updated.authorReply || authorReply);
      toast.success("Reply saved.");
    } catch (error) {
      toast.error(error?.data?.message || "Unable to save reply.");
    } finally {
      setReplyingReviewIds((prev) => prev.filter((id) => id !== review.id));
    }
  };

  const handleToggleLike = async (reviewId) => {
    if (!reviewId) return;
    if (likingReviewIds.includes(reviewId)) return;

    let previous = null;
    let canToggle = false;

    setReviews((prev) =>
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
          likesCount: Math.max(
            0,
            Number(review.likesCount || 0) + (nextLiked ? 1 : -1),
          ),
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
      setReviews((prev) =>
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
        setReviews((prev) =>
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

  const averageRating = Number(summary?.averageRating || 0);
  const totalReviews = Number(summary?.totalReviews || 0);
  const ratingDistribution = Array.isArray(summary?.ratingDistribution)
    ? summary.ratingDistribution
    : [];

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 p-6 bg-white">
        <div className="flex flex-col md:flex-row gap-8 md:items-center">
          <div className="text-center md:text-left">
            <div className="text-5xl font-extrabold text-slate-900">
              {averageRating ? averageRating.toFixed(1) : "0.0"}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 my-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {totalReviews} review{totalReviews > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 space-y-2">
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
                  <span className="text-xs font-semibold text-slate-600 w-4">
                    {rating}
                  </span>
                  <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0056D2] rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, percentage))}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-10">
                    {Math.round(percentage)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={openWriteReviewModal}
          disabled={!canWriteReview}
          className={`w-full mt-6 py-3 rounded-lg font-semibold transition ${
            canWriteReview
              ? "bg-[#0056D2] text-white hover:bg-[#1d6de0]"
              : "bg-slate-200 text-slate-500 cursor-not-allowed"
          }`}
        >
          Write a review
        </button>
        {eligibilityMessage ? (
          <p className="text-xs text-slate-500 mt-2 text-center">
            {eligibilityMessage}
          </p>
        ) : null}
      </div>

      <div className="space-y-4" id="reviews">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Reviews</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSort("recent")}
              className={`px-4 py-2 rounded-full text-xs font-bold border ${
                sort === "recent"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              Most Recent
            </button>
            <button
              onClick={() => setSort("highest")}
              className={`px-4 py-2 rounded-full text-xs font-bold border ${
                sort === "highest"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              Highest Rated
            </button>
            <button
              onClick={() => setSort("lowest")}
              className={`px-4 py-2 rounded-full text-xs font-bold border ${
                sort === "lowest"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              Lowest Rated
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading reviews...</p>
        ) : null}

        {!loading && displayedReviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {displayedReviews.map((review) => (
              <div
                key={review.id}
                className="p-5 border border-slate-200 rounded-2xl bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">
                      {review?.author?.fullName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        {renderStars(review?.rating)}
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDate(review?.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                {review?.title ? (
                  <p className="font-semibold text-slate-800 mt-3">
                    {review.title}
                  </p>
                ) : null}
                <p className="text-slate-600 mt-2 whitespace-pre-wrap">
                  {review?.comment || "No written comment."}
                </p>
                {review?.authorReply ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0056D2] text-xs font-bold text-white">
                          {String(
                            review?.courseAuthor?.fullName ||
                              review?.courseAuthor?.username ||
                              "A",
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {review?.courseAuthor?.fullName ||
                              review?.courseAuthor?.username ||
                              "Course author"}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1D4ED8]">
                        Author
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                      {review.authorReply}
                    </p>
                    {review?.authorReplyAt ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(review.authorReplyAt)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-4">
                  <button
                    type="button"
                    disabled={
                      !review?.canLike || likingReviewIds.includes(review.id)
                    }
                    onClick={() => handleToggleLike(review.id)}
                    className={`inline-flex items-center gap-2 text-xs font-semibold transition ${
                      review?.canLike
                        ? review?.likedByMe
                          ? "text-[#0056D2]"
                          : "text-slate-600 hover:text-[#0056D2]"
                        : "text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <ThumbsUp
                      size={14}
                      className={review?.likedByMe ? "fill-[#0056D2]" : ""}
                    />
                    Helpful ({Number(review?.likesCount || 0)})
                  </button>
                </div>
                {review?.canReply ? (
                  <div className="mt-4 space-y-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Reply as author
                    </label>
                    <textarea
                      value={getReplyDraftValue(review)}
                      onChange={(event) =>
                        setReplyDraftValue(review.id, event.target.value)
                      }
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Write a reply to this learner review"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSubmitReply(review)}
                        disabled={replyingReviewIds.includes(review.id)}
                        className="rounded-lg bg-[#0056D2] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {replyingReviewIds.includes(review.id)
                          ? "Saving..."
                          : review?.authorReply
                            ? "Update reply"
                            : "Reply"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {totalReviews > displayedReviews.length ? (
          <button
            onClick={openReviewsListModal}
            className="w-full py-3 border-2 border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition"
          >
            Show more reviews
          </button>
        ) : null}
      </div>
    </section>
  );
}
