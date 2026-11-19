import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { createPortal } from "react-dom";
import { mutate } from "swr";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import modalState from "@/lib/store/modalState";
import persistentStore from "@/lib/store/persistentStore";
import useSubscriptionAccess from "@/lib/hooks/useSubscriptionAccess";

const toBool = (value) => value === true || value === "true" || value === 1 || value === "1";

export function FeaturedCard({ course }) {
  const cardRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [isInCart, setIsInCart] = useState(toBool(course?.is_in_cart));
  const [isAdding, setIsAdding] = useState(false);
  const profile = persistentStore((state) => state.profile);
  const isEnrolled = toBool(course?.is_enrolled);
  const { accessLoading, canStartWithPlan, canStartWithTrial, startWithPlan, starting } =
    useSubscriptionAccess(course, isEnrolled);
  const canPurchase =
    !profile || Boolean(profile?.permissions?.includes("view-own-learnings"));

  useEffect(() => setMounted(true), []);

  const learnings = course?.goals?.what_you_will_learn_data || [];
  const rating = Number(
    course?.stats?.average_rating ?? course?.average_rating ?? 0,
  );
  const reviews = Number(
    course?.stats?.total_reviews ?? course?.total_reviews ?? 0,
  );
  const totalSeconds = Number(course?.stats?.total_duration_seconds || 0);
  const lectures = Number(
    course?.stats?.total_lectures ?? course?.resources_count?.curriculum_count ?? 0,
  );
  const levelTitle = course?.instructional_level?.title;
  const durationLabel =
    totalSeconds >= 3600
      ? `${(totalSeconds / 3600).toFixed(1).replace(/\.0$/, "")} total hours`
      : totalSeconds > 0
        ? `${Math.max(1, Math.round(totalSeconds / 60))} total mins`
        : null;
  const author = course?.author?.data;
  const instructor = author?.fullName || "Instructor";
  const price = course?.price_tier?.price;
  const isFree = price === "0.00";

  const placeTooltip = () => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = 320;
    const gap = 10;
    const left =
      rect.right + gap + width > window.innerWidth
        ? rect.left - width - gap
        : rect.right + gap;
    setTooltipPosition({ top: Math.max(12, rect.top + 12), left: Math.max(12, left) });
  };

  useEffect(() => {
    if (!showTooltip) return;
    window.addEventListener("scroll", placeTooltip, true);
    window.addEventListener("resize", placeTooltip);
    return () => {
      window.removeEventListener("scroll", placeTooltip, true);
      window.removeEventListener("resize", placeTooltip);
    };
  }, [showTooltip]);

  const handleCart = async () => {
    if (isInCart || isAdding) return;
    if (!profile) {
      modalState.setState({
        modalInfo: {
          type: "LOGIN_ADD_TO_CART",
          title: "",
          message: "Please log in to add this course to your cart.",
        },
      });
      return;
    }
    setIsAdding(true);
    try {
      await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
        course_id: course.id,
      });
      setIsInCart(true);
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/cart/count`);
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/cart`);
      modalState.setState({
        cartDrawerOpen: true,
        modalInfo: {
          type: "ADD_TO_CART",
          title: "Added to cart",
          message: `"${course.title}" has been added to your cart.`,
          data: course,
        },
      });
    } catch (_error) {
      toast.error("An error occurred while adding to cart.");
    } finally {
      setIsAdding(false);
    }
  };

  const chip = "rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-600";

  return (
    <>
      <div
        ref={cardRef}
        onMouseEnter={() => {
          if (!learnings.length || window.innerWidth < 768) return;
          placeTooltip();
          setShowTooltip(true);
        }}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex w-full shrink-0 basis-full snap-start flex-col sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-3rem)/4)] rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-lg"
      >
        <Link href={`/courses/${course.slug}`} className="flex grow flex-col">
          <Image
            src={course?.cover_image?.path || "/placeholder-cover.webp"}
            alt={course.title}
            width={400}
            height={225}
            className="aspect-video w-full rounded-lg object-cover"
          />
          <h3 className="mt-4 line-clamp-3 min-h-[4.5rem] text-lg font-bold leading-snug text-slate-900">
            {course.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-slate-500">{instructor}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`${chip} flex items-center gap-1`}>
              <Star size={12} className="fill-amber-500 text-amber-500" />
              {rating.toFixed(1)}
            </span>
            <span className={chip}>
              {reviews.toLocaleString("en-PH")} ratings
            </span>
            {durationLabel && <span className={chip}>{durationLabel}</span>}
            {lectures > 0 && (
              <span className={chip}>
                {lectures.toLocaleString("en-PH")} {lectures === 1 ? "lecture" : "lectures"}
              </span>
            )}
            {levelTitle && <span className={chip}>{levelTitle}</span>}
          </div>
        </Link>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-lg font-bold text-slate-900">
            {isFree ? "Free" : `₱${price || "0.00"}`}
          </p>
          {!canPurchase ? null : isEnrolled ? (
            <Link
              href={`/courses/${course.slug}/learn`}
              className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-blue-50"
            >
              Continue
            </Link>
          ) : accessLoading ? (
            <span className="h-[38px] w-[110px] rounded-lg bg-slate-100 animate-pulse" />
          ) : canStartWithPlan || canStartWithTrial ? (
            <button
              type="button"
              onClick={startWithPlan}
              disabled={starting}
              className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-blue-50 disabled:opacity-50"
            >
              {starting ? "Opening..." : "Start learning"}
            </button>
          ) : isInCart ? (
            <Link
              href="/cart"
              className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-blue-50"
            >
              Go to cart
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleCart}
              disabled={isAdding}
              className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-blue-50 disabled:opacity-50"
            >
              {isAdding ? "Adding..." : "Add to cart"}
            </button>
          )}
        </div>
      </div>

      {mounted &&
        showTooltip &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              width: 320,
              zIndex: 9999,
            }}
            className="rounded-[10px] border border-slate-200 bg-white p-5 shadow-xl"
            onMouseLeave={() => setShowTooltip(false)}
          >
            <h3 className="mb-2 text-[18px] font-semibold">What you&apos;ll learn</h3>
            {learnings.slice(0, 5).map((goal, index) => (
              <div key={index} className="mb-1 flex text-[13px] text-slate-700">
                <Check width={14} className="mr-2 mt-[2px] shrink-0" />
                <span>{goal}</span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
export default function FeaturedCoursesCarouselSection() {
  const trackRef = useRef(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`)
      .then((response) => setCourses(response?.data?.data || []))
      .catch((error) => console.error("Error fetching courses:", error));
  }, []);

  const scrollBy = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * (track.clientWidth + 16), behavior: "smooth" });
  };

  if (!courses.length) return null;

  return (
    <section data-home-section="" className="bg-white py-12">
      <div className="container">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            Featured courses
          </h2>
          <Link
            href="/courses"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            View all courses <ArrowRight size={14} />
          </Link>
        </div>
        <div className="relative mt-5">
          <button
            type="button"
            aria-label="Previous courses"
            onClick={() => scrollBy(-1)}
            className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md hover:bg-slate-50 md:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <div
            ref={trackRef}
            className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {courses.map((course) => (
              <FeaturedCard key={course.id} course={course} />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next courses"
            onClick={() => scrollBy(1)}
            className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md hover:bg-slate-50 md:flex"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
