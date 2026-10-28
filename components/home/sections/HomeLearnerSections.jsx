import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import toast from "react-hot-toast";
import { mutate } from "swr";
import BaseApi from "@/lib/api/_base.api";
import WISHLISTAPI from "@/lib/api/wishlist/request";
import modalState from "@/lib/store/modalState";
import persistentStore from "@/lib/store/persistentStore";
import useSubscriptionAccess from "@/lib/hooks/useSubscriptionAccess";
import PreferencesWizard from "../PreferencesWizard";

function formatPrice(value) {
  const amount = Number(value || 0);
  return amount <= 0 ? "Free" : `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function LearnerCourseCard({ course }) {
  const [inCart, setInCart] = useState(Boolean(course?.is_in_cart));
  const [saved, setSaved] = useState(Boolean(course?.is_in_wishlist));
  const [busy, setBusy] = useState(false);
  const { canStartWithTrial, startWithPlan, starting } = useSubscriptionAccess(
    course,
    Boolean(course?.is_enrolled),
  );

  const rating = Number(course?.stats?.average_rating || 0);
  const reviews = Number(course?.stats?.total_reviews || 0);
  const author = course?.author?.data;
  const instructor = `${author?.firstname || ""} ${author?.lastname || ""}`.trim();
  const price = Number(course?.price_tier?.price || 0);
  const badge = reviews > 0 && rating >= 4.5 ? "Highest Rated" : null;

  const addToCart = async (event) => {
    event.preventDefault();
    if (busy || inCart) return;
    setBusy(true);
    try {
      await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/cart`, { course_id: course.id });
      setInCart(true);
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
      setBusy(false);
    }
  };

  const toggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const next = !saved;
    setSaved(next);
    try {
      if (next) await WISHLISTAPI.add(course.id);
      else await WISHLISTAPI.remove(course.id);
    } catch (_error) {
      setSaved(!next);
      toast.error("Could not update wishlist.");
    }
  };

  return (
    <div className="flex w-[260px] shrink-0 snap-start flex-col">
      <Link href={`/courses/${course.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-lg border border-slate-200">
          <Image
            src={course?.cover_image?.path || "/placeholder-cover.webp"}
            alt={course.title}
            width={480}
            height={270}
            className="aspect-video w-full object-cover"
          />
          <button
            type="button"
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            onClick={toggleWishlist}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
          >
            <Heart size={16} className={saved ? "fill-rose-500 text-rose-500" : "text-slate-700"} />
          </button>
        </div>
        <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-primary">
          {course.title}
        </h3>
      </Link>
      <p className="mt-1 line-clamp-1 text-xs text-slate-500">{instructor || "Instructor"}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">Course</span>
        {reviews > 0 && (
          <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
            <span className="text-slate-500">({reviews.toLocaleString("en-PH")} ratings)</span>
          </span>
        )}
        {badge && (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-800">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 text-base font-bold text-slate-900">{formatPrice(price)}</p>
      {course?.is_enrolled ? (
        <Link
          href={`/courses/${course.slug}`}
          className="mt-2 rounded-lg border border-slate-900 px-3 py-2 text-center text-sm font-bold text-slate-900 hover:bg-slate-50"
        >
          Go to course
        </Link>
      ) : canStartWithTrial ? (
        <button
          type="button"
          onClick={startWithPlan}
          disabled={starting}
          className="mt-2 rounded-lg border border-slate-900 px-3 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
        >
          {starting ? "Opening..." : "Enroll"}
        </button>
      ) : (
        <button
          type="button"
          onClick={addToCart}
          disabled={busy}
          className="mt-2 rounded-lg border border-slate-900 px-3 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
        >
          {inCart ? "In cart" : "Add to cart"}
        </button>
      )}
    </div>
  );
}

function Carousel({ courses }) {
  const trackRef = useRef(null);
  const scrollBy = (direction) =>
    trackRef.current?.scrollBy({ left: direction * 540, behavior: "smooth" });

  return (
    <div className="relative mt-4">
      <button
        type="button"
        aria-label="Previous courses"
        onClick={() => scrollBy(-1)}
        className="absolute -left-4 top-[60px] z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-slate-50 md:flex"
      >
        <ChevronLeft size={18} />
      </button>
      <div
        ref={trackRef}
        className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((course) => (
          <LearnerCourseCard key={course.id} course={course} />
        ))}
      </div>
      <button
        type="button"
        aria-label="Next courses"
        onClick={() => scrollBy(1)}
        className="absolute -right-4 top-[60px] z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-slate-50 md:flex"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function Block({ eyebrow, title, action, tag, children }) {
  return (
    <section data-home-section="" className="container py-8">
      {eyebrow && <p className="text-sm font-semibold text-slate-500">{eyebrow}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {action}
        {tag && (
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
            {tag}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function TopicTabsBlock({ tabs }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((tab) => tab.id === activeId) || tabs[0];

  return (
    <Block title={`What people who learn ${active.name} take next`}>
      <div className="mt-3 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab.id === active.id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <Carousel key={active.id} courses={active.courses} />
    </Block>
  );
}

export default function HomeLearnerSections({ trendingOnly = false }) {
  const token = persistentStore((state) => state.token);
  const [data, setData] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const load = useCallback(() => {
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/recommendations`)
      .then((response) => setData(response?.data?.data || null))
      .catch(() => setData(null));
  }, []);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  if (!data) return null;

  const { learn_next, because_viewed, occupation, trending, top_rated, topic_next } = data;

  if (trendingOnly) {
    return trending?.length > 0 ? (
      <Block title="Trending courses">
        <Carousel courses={trending} />
      </Block>
    ) : null;
  }

  return (
    <>
      {learn_next?.length > 0 && (
        <Block eyebrow="What to learn next" title="Recommended for you">
          <Carousel courses={learn_next} />
        </Block>
      )}
      {because_viewed && (
        <Block
          title={
            <>
              Because you viewed{" "}
              <Link
                href={`/courses/${because_viewed.course.slug}`}
                className="text-primary underline underline-offset-4"
              >
                “{because_viewed.course.title}”
              </Link>
            </>
          }
        >
          <Carousel courses={because_viewed.courses} />
        </Block>
      )}
      {occupation?.courses?.length > 0 && (
        <Block
          title={`Popular for ${occupation.name}`}
          tag="New – Inspired by your selections"
          action={
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="text-sm font-bold text-primary underline underline-offset-4"
            >
              Edit occupation
            </button>
          }
        >
          <Carousel courses={occupation.courses} />
        </Block>
      )}
      {trending?.length > 0 && (
        <Block title="Trending courses">
          <Carousel courses={trending} />
        </Block>
      )}
      {top_rated?.length > 0 && (
        <Block title="Recommended to you based on ratings">
          <Carousel courses={top_rated} />
        </Block>
      )}
      {topic_next?.length > 0 && <TopicTabsBlock tabs={topic_next} />}

      <PreferencesWizard
        open={wizardOpen}
        role="learner"
        onClose={() => setWizardOpen(false)}
        onSaved={load}
      />
    </>
  );
}
