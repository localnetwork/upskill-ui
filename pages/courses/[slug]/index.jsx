import CourseAuthor from "@/components/entities/course/show/CourseAuthor";
import CourseAlsoBought from "@/components/entities/course/show/CourseAlsoBought";
import CourseDescription from "@/components/entities/course/show/CourseDescription";
import CourseInclusions from "@/components/entities/course/show/CourseInclusions";
import CourseLearnings from "@/components/entities/course/show/CourseLearnings";
import CourseRequirements from "@/components/entities/course/show/CourseRequirements";
import CourseSections from "@/components/entities/course/show/CourseSections";
import BaseApi from "@/lib/api/_base.api";
import {
  BadgeCheck,
  Check,
  CheckCircle,
  CheckCircle2,
  CheckCircle2Icon,
  ChevronRight,
  Globe,
  Heart,
  History,
  MonitorPlay,
  Play,
  PlayCircle,
  ShoppingCart,
  Smartphone,
  SquarePlay,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import cartStore from "@/lib/store/cartStore";
import CARTAPI from "@/lib/api/cart/request";
import WISHLISTAPI from "@/lib/api/wishlist/request";

import { mutate } from "swr";
import globalStore from "@/lib/store/globalStore";
import modalState from "@/lib/store/modalState";
import { isLoggedIn } from "@/lib/services/auth";
import CourseAccessButton from "@/components/entities/subscription/CourseAccessButton";
import CourseFeedback from "@/components/entities/course/show/CourseFeedback";
import CourseReviews from "@/components/entities/course/show/CourseReviews";
import persistentStore from "@/lib/store/persistentStore";
import { trackAnalyticsEvent } from "@/lib/services/analytics";
import useSubscriptionAccess from "@/lib/hooks/useSubscriptionAccess";
const shimmer =
  "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded";

function formatPhpPrice(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatMonthYear(value) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-PH", {
    month: "2-digit",
    year: "numeric",
  });
}

function formatTotalLength(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function CoursePageSkeleton() {
  return (
    <div className="pb-[50px]">
      <header className="bg-[#0f172a] text-white py-12 lg:py-20 px-4 lg:px-8">
        <div className="container mx-auto grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="space-y-6">
            <div className={`${shimmer} h-4 w-[260px] bg-slate-700`} />
            <div className={`${shimmer} h-12 w-[85%] bg-slate-700`} />
            <div className={`${shimmer} h-8 w-[70%] bg-slate-700`} />
            <div className="flex flex-wrap items-center gap-6">
              <div className={`${shimmer} h-6 w-[220px] bg-slate-700`} />
              <div className={`${shimmer} h-6 w-[160px] bg-slate-700`} />
            </div>
            <div className="flex gap-6">
              <div className={`${shimmer} h-5 w-[130px] bg-slate-700`} />
              <div className={`${shimmer} h-5 w-[90px] bg-slate-700`} />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="py-12 space-y-16">
            <section className="space-y-4">
              <div className={`${shimmer} h-10 w-[260px]`} />
              <div className={`${shimmer} h-5 w-full`} />
              <div className={`${shimmer} h-5 w-[96%]`} />
              <div className={`${shimmer} h-5 w-[75%]`} />
            </section>

            <section className="space-y-4">
              <div className={`${shimmer} h-10 w-[220px]`} />
              <div className="space-y-3">
                <div className={`${shimmer} h-14 w-full`} />
                <div className={`${shimmer} h-14 w-full`} />
                <div className={`${shimmer} h-14 w-full`} />
              </div>
            </section>

            <section className="space-y-4">
              <div className={`${shimmer} h-10 w-[190px]`} />
              <div className={`${shimmer} h-5 w-[80%]`} />
              <div className={`${shimmer} h-5 w-[65%]`} />
            </section>

            <section className="space-y-4">
              <div className={`${shimmer} h-10 w-[150px]`} />
              <div className={`${shimmer} h-24 w-full`} />
            </section>
          </div>

          <aside className="relative lg:-mt-90 z-10">
            <div className="lg:sticky lg:top-24 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className={`${shimmer} w-full aspect-video`} />
              <div className="p-8 space-y-5">
                <div className={`${shimmer} h-10 w-[140px]`} />
                <div className={`${shimmer} h-14 w-full`} />
                <div className={`${shimmer} h-12 w-full`} />
                <div className="space-y-3">
                  <div className={`${shimmer} h-4 w-[80%]`} />
                  <div className={`${shimmer} h-4 w-[85%]`} />
                  <div className={`${shimmer} h-4 w-[70%]`} />
                  <div className={`${shimmer} h-4 w-[75%]`} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function Course() {
  const router = useRouter();
  const rawSlug = router.query.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const [course, setCourse] = useState(null);
  const [isCourseLoading, setIsCourseLoading] = useState(true);
  const [isWishlistSubmitting, setIsWishlistSubmitting] = useState(false);
  const [isShareSubmitting, setIsShareSubmitting] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [purchaseMode, setPurchaseMode] = useState("subscribe");
  const [subPlans, setSubPlans] = useState([]);
  const [hasSubscription, setHasSubscription] = useState(false);
  const {
    canStartWithPlan,
    startWithPlan,
    starting: startingWithPlan,
  } = useSubscriptionAccess(course, course?.is_enrolled);
  const [catalogCount, setCatalogCount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  const [notFound, setNotFound] = useState(false);

  const updateCart = cartStore((state) => state.setCartCount);
  const cartItems = cartStore((state) => state.cart);
  const appliedCourseCoupons = cartStore(
    (state) => state.appliedCourseCoupons || {},
  );

  const profile = persistentStore((state) => state.profile);
  const averageRating = Number(course?.stats?.average_rating || 0);
  const totalReviews = Number(course?.stats?.total_reviews || 0);
  const totalEnrollees = Number(course?.stats?.total_enrollees || 0);
  const isBestseller = Boolean(course?.stats?.is_bestseller);
  const topics = Array.isArray(course?.topics) ? course.topics : [];
  const sectionCount = Array.isArray(course?.sections)
    ? course.sections.length
    : 0;
  const lectureCount = Array.isArray(course?.sections)
    ? course.sections.reduce(
        (sum, section) =>
          sum +
          (Array.isArray(section?.curriculums)
            ? section.curriculums.length
            : 0),
        0,
      )
    : 0;
  const totalLengthSeconds = Array.isArray(course?.sections)
    ? course.sections.reduce(
        (total, section) =>
          total +
          (Array.isArray(section?.curriculums)
            ? section.curriculums.reduce(
                (sectionTotal, curriculum) =>
                  sectionTotal + Number(curriculum?.estimated_duration || 0),
                0,
              )
            : 0),
        0,
      )
    : 0;
  const activeCourseId = String(course?.id || "");
  const appliedCourseCoupon = activeCourseId
    ? appliedCourseCoupons?.[activeCourseId] || null
    : null;
  const isFreeCourse =
    String(course?.price_tier?.title || "").toLowerCase() === "free";
  const baseCoursePrice = Number(course?.price_tier?.price || 0);
  const appliedDiscountAmount = Number(
    appliedCourseCoupon?.discountAmount || 0,
  );
  const effectiveDiscountAmount = appliedDiscountAmount;
  const effectiveCoursePrice = Math.max(
    0,
    baseCoursePrice - effectiveDiscountAmount,
  );
  const hasDiscountedPrice = !isFreeCourse && effectiveDiscountAmount > 0;

  useEffect(() => {
    if (!course?.id || !Array.isArray(cartItems)) return;
    const inCart = cartItems.some(
      (item) => String(item?.course?.id || "") === String(course.id),
    );
    setCourse((prev) => (prev ? { ...prev, is_in_cart: inCart } : prev));
  }, [cartItems, course?.id]);

  const addCurrentCourseToCart = async ({ showModal = true } = {}) => {
    if (!course?.id) return false;

    try {
      await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
        course_id: course.id,
      });
      setCourse((prev) => ({ ...prev, is_in_cart: true }));
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/cart/count`);
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/cart`);
      if (showModal) {
        modalState.setState({
          cartDrawerOpen: true,
          modalInfo: {
            type: "ADD_TO_CART",
            title: "Added to cart",
            message: `"${course.title}" has been added to your cart.`,
            data: course,
          },
        });
      }
      return true;
    } catch (error) {
      if (error?.status === 409) {
        setCourse((prev) => ({ ...prev, is_in_cart: true }));
        return true;
      }

      console.error("Error adding to cart:", error);
      toast.error("Failed to add course to cart. Please try again later.");
      return false;
    }
  };

  const applyCouponToCurrentCourse = async (
    rawCode,
    { silent = false, promptLogin = true } = {},
  ) => {
    const code = String(rawCode || "")
      .trim()
      .toUpperCase();
    if (!course?.id || !code) return;

    const isLogged = await isLoggedIn();
    if (!isLogged) {
      if (promptLogin) {
        modalState.setState({
          modalInfo: {
            type: "LOGIN",
            message: "Please log in to redeem a coupon code.",
          },
        });
      }
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const response = await CARTAPI.validateCoupon(code);
      const data = response?.data?.data || {};
      const couponCourseId = String(data?.coupon?.courseId || "");
      if (couponCourseId !== String(course.id)) {
        toast.error("This coupon is not valid for this course.");
        return;
      }

      const discountAmount = Number(data?.discountAmount || 0);
      cartStore.setState({
        appliedCourseCoupons: {
          ...(cartStore.getState().appliedCourseCoupons || {}),
          [String(course.id)]: {
            code,
            couponId: String(data?.coupon?.id || ""),
            courseId: String(course.id),
            discountAmount,
          },
        },
      });
      setCouponCodeInput("");
      if (!silent) {
        toast.success("Coupon applied.");
      }
    } catch (error) {
      if (!silent) {
        toast.error(error?.data?.message || "Unable to apply coupon.");
      }
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCart = async (e) => {
    e.preventDefault();
    if (!course) return;

    const isLogged = await isLoggedIn();
    if (!isLogged) {
      modalState.setState({
        modalInfo: {
          type: "LOGIN",
          message: "Please log in to add courses to your cart.",
        },
      });
      return;
    }

    const added = await addCurrentCourseToCart({ showModal: true });
    if (!added) return;
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!course) return;
    if (isWishlistSubmitting) return;

    const isLogged = await isLoggedIn();
    if (!isLogged) {
      modalState.setState({
        modalInfo: {
          type: "LOGIN",
          message: "Please log in to save courses to your wishlist.",
        },
      });
      return;
    }

    const previousWishlistState = Boolean(course?.is_in_wishlist);
    const nextWishlistState = !previousWishlistState;
    setCourse((prev) =>
      prev ? { ...prev, is_in_wishlist: nextWishlistState } : prev,
    );
    setIsWishlistSubmitting(true);

    try {
      if (previousWishlistState) {
        await WISHLISTAPI.remove(course.id);
        toast.success("Removed from wishlist");
      } else {
        await WISHLISTAPI.add(course.id);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      setCourse((prev) =>
        prev ? { ...prev, is_in_wishlist: previousWishlistState } : prev,
      );
      console.error("Error updating wishlist:", error);
      toast.error(error?.data?.message || "Failed to update wishlist");
    } finally {
      setIsWishlistSubmitting(false);
    }
  };

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL;
    BaseApi.get(`${api}/subscription/plans`)
      .then((res) => setSubPlans(res?.data?.data || []))
      .catch(() => setSubPlans([]));
    BaseApi.get(`${api}/subscription/catalog-summary`)
      .then((res) => setCatalogCount(Number(res?.data?.data?.courseCount || 0)))
      .catch(() => {});
    if (isLoggedIn()) {
      BaseApi.get(`${api}/subscription/me`)
        .then((res) =>
          setHasSubscription(Boolean(res?.data?.data?.hasSubscription)),
        )
        .catch(() => {});
    }
  }, []);

  // Lowest effective monthly price across plans, with the regular monthly price as the strike-through.
  const subscriptionOffer = (() => {
    const priced = subPlans
      .map((plan) => ({
        perMonth:
          (plan.firstCyclePrice ?? plan.price) /
          (plan.interval === "YEAR" ? 12 : 1),
        regular: plan.interval === "YEAR" ? plan.price / 12 : plan.price,
      }))
      .sort((a, b) => a.perMonth - b.perMonth);
    return priced[0] || null;
  })();
  const showSubscribeOption =
    Boolean(subscriptionOffer) && !hasSubscription && !isFreeCourse;

  const handleStartSubscription = async () => {
    if (!course) return;
    if (!(await isLoggedIn())) {
      modalState.setState({
        modalInfo: { type: "LOGIN", message: "Please log in to subscribe." },
      });
      return;
    }
    router.push(
      `/checkout/express?slug=${encodeURIComponent(course.slug)}&mode=subscribe`,
    );
  };

  const handleBuyNow = async () => {
    if (!course) return;

    const isLogged = await isLoggedIn();
    if (!isLogged) {
      modalState.setState({
        modalInfo: {
          type: "LOGIN",
          message: "Please log in to continue with express checkout.",
        },
      });
      return;
    }

    if (course?.is_enrolled) {
      router.push(`/courses/${course.slug}/learn`);
      return;
    }

    const expressCouponCode = String(appliedCourseCoupon?.code || "")
      .trim()
      .toUpperCase();

    const queryParams = new URLSearchParams({
      slug: String(course.slug),
    });
    if (expressCouponCode) {
      queryParams.set("coupon", expressCouponCode);
    }

    router.push(`/checkout/express?${queryParams.toString()}`);
  };

  const handleShare = async () => {
    if (!course?.slug || isShareSubmitting) return;

    try {
      setIsShareSubmitting(true);
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/share/courses/${encodeURIComponent(course.slug)}`,
      );
      const payload = response?.data?.data || {};
      const shortUrl =
        payload?.short_url ||
        (typeof window !== "undefined"
          ? `${window.location.origin}/share/${payload?.code || ""}`
          : "");
      if (!shortUrl || /\/share\/$/.test(shortUrl)) {
        throw new Error("Missing short URL");
      }

      modalState.setState({
        modalInfo: {
          type: "SHARE_SOCIAL",
          title: "Share course",
          size: "sm",
          data: {
            url: shortUrl,
            title: `Check out this course: ${course?.title || "Upskill course"}`,
            description: "Share this short course link.",
            copyButtonLabel: "Copy short URL",
            copiedMessage: "Short URL copied.",
            copyFailedMessage: "Failed to copy short URL.",
          },
        },
      });
    } catch (error) {
      toast.error(error?.data?.message || "Unable to create share link.");
    } finally {
      setIsShareSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsCourseLoading(true);
        setNotFound(false);
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/route/${encodeURIComponent(slug)}`,
        );

        setCourse(response?.data);
      } catch (error) {
        console.error("Error fetching course data:", error);
        if (error?.status === 404) {
          setNotFound(true);
        }
      } finally {
        setIsCourseLoading(false);
      }
    };
    if (router.isReady && slug) {
      fetchData();
    }

    const scrollTest = () => {
      const offset = window.pageYOffset;

      if (offset > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", scrollTest);
    window.addEventListener("load", scrollTest);

    return () => {
      window.removeEventListener("scroll", scrollTest);
      window.removeEventListener("load", scrollTest);
    };
  }, [router.isReady, slug]);

  useEffect(() => {
    if (!course?.id) return;
    const storageKey = `analytics:course-page-view:${course.id}`;
    if (
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(storageKey)
    ) {
      return;
    }
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, "1");
    }
    trackAnalyticsEvent({
      eventType: "COURSE_PAGE_VIEW",
      courseId: course.id,
      courseSlug: course.slug,
      dedupeWindowSeconds: 90,
    });
  }, [course?.id, course?.slug]);

  if (isCourseLoading) {
    return <CoursePageSkeleton />;
  }

  if (notFound) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <h1 className="text-3xl font-black font-secondary">Course not found</h1>
      </div>
    );
  }

  const openPromoVideo = () => {
    modalState.setState({
      modalInfo: {
        type: "COURSE_PROMO_VIDEO",
        title: course?.title,
        size: "xl",
        data: { video_path: course?.promo_video?.path },
      },
    });
  };

  const educator = course?.author?.data;
  const educatorName = `${educator?.firstname || ""} ${educator?.lastname || ""}`.trim();
  const educatorInitials =
    `${educator?.firstname?.[0] || ""}${educator?.lastname?.[0] || ""}`.toUpperCase();
  const educatorPicturePath = educator?.user_picture?.path;
  const educatorPictureSrc = educatorPicturePath
    ? /^https?:\/\//.test(educatorPicturePath)
      ? educatorPicturePath
      : `${process.env.NEXT_PUBLIC_API_DOMAIN || ""}${educatorPicturePath}`
    : null;
  const canShowPurchaseActions = Boolean(
    profile?.permissions?.includes("view-own-learnings"),
  );

  return (
    <div className="pb-28 lg:pb-[50px]">
      <header className="bg-white text-slate-900 lg:bg-[#0f172a] lg:text-white pt-4 pb-6 lg:py-20 px-4 lg:px-8">
        <div className="container mx-auto grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="space-y-6">
            <nav className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#0056D2] lg:text-[#9dc4ff]">
              {[...(course?.categories || [])]
                .sort((a, b) => (a.parent_id === null ? -1 : 1))
                .map((cat, index) => (
                  <>
                    {index > 0 && (
                      <ChevronRight
                        key={`chevron-${cat.id}`}
                        className="inline-block text-accent"
                        size={16}
                      />
                    )}
                    <Link
                      key={cat.id}
                      className="hover:underline"
                      href={"/categories/" + cat.slug}
                    >
                      {cat.title}
                    </Link>
                  </>
                ))}
            </nav>
            <div
              className="relative -mx-4 cursor-pointer lg:hidden"
              onClick={openPromoVideo}
            >
              <Image
                alt="Course Preview"
                className="w-full aspect-video object-cover"
                width={500}
                height={280}
                src={
                  course?.cover_image
                    ? course.cover_image.path
                    : "/placeholder-cover.webp"
                }
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xl">
                  <Play className="text-primary" size={24} />
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-bold text-white drop-shadow-md">
                Preview this course
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-secondary lg:text-6xl font-black serif-heading leading-tight">
              {course?.title}
            </h1>
            <div
              className="text-lg lg:text-xl text-slate-700 lg:text-slate-300 max-w-2xl"
              dangerouslySetInnerHTML={{ __html: course?.subtitle }}
            />

            <div className="space-y-4 lg:hidden">
              {isBestseller ? (
                <span className="inline-block rounded bg-teal-100 px-3 py-1.5 text-sm font-bold text-teal-900">
                  Bestseller
                </span>
              ) : null}
              {educatorName ? (
                <div className="flex items-center gap-4">
                  {educatorPictureSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={educatorPictureSrc}
                      alt={educatorName}
                      className="h-14 w-14 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 font-semibold text-white">
                      {educatorInitials}
                    </span>
                  )}
                  <div className="min-w-0 text-sm text-slate-700">
                    <p>Created by</p>
                    <Link
                      href={`/user/${educator?.username || ""}`}
                      className="font-semibold text-primary underline"
                    >
                      {educatorName}
                    </Link>
                  </div>
                </div>
              ) : null}
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <History className="text-slate-600" size={18} />
                  <span>Last updated {formatMonthYear(course?.updated_at)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="text-slate-600" size={18} />
                  <span>{course?.language || "English"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-300 rounded-xl border border-slate-300 py-4 text-center">
                <div className="px-3">
                  <div className="flex items-center justify-center gap-1 font-bold text-slate-900">
                    {averageRating.toFixed(1)}
                    <Star size={16} className="fill-amber-600 text-amber-600" />
                  </div>
                  <p className="mt-1 text-sm text-slate-600 underline">
                    {totalReviews.toLocaleString("en-PH")} ratings
                  </p>
                </div>
                <div className="px-3">
                  <div className="flex items-center justify-center gap-1 font-bold text-slate-900">
                    <UsersRound size={16} />
                    {totalEnrollees.toLocaleString("en-PH")}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">learners</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                {isBestseller ? (
                  <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded">
                    Bestseller
                  </span>
                ) : null}
                <div className="flex items-center gap-1 text-yellow-400">
                  <span className="font-bold text-white">
                    {averageRating.toFixed(1)}
                  </span>
                  <Star className="inline-block w-4 h-4 text-yellow-500" />
                </div>
                <span className="text-slate-400 text-sm">
                  ({totalReviews.toLocaleString("en-PH")} ratings)
                </span>
              </div>
              <div className="text-sm text-slate-300">
                <span className="font-bold text-white">
                  {totalEnrollees.toLocaleString("en-PH")}
                </span>{" "}
                students enrolled
              </div>
            </div>
            <div className="hidden lg:flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                {/* <span className="material-symbols-outlined text-slate-400"></span> */}
                <History className="inline text-slate-400" size={18} />
                <span>Last updated {formatMonthYear(course?.updated_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="inline text-slate-400" size={18} />
                <span>{course?.language || "English"}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="grid lg:grid-cols-[1fr_400px] gap-0 lg:gap-12">
          <div className="py-12 space-y-16">
            <section id="about">
              <h2 className="text-3xl font-black serif-heading mb-6 font-secondary">
                About this course
              </h2>

              <div className="prose prose-slate max-w-none">
                <CourseDescription description={course?.description} />
                <CourseLearnings course={course} />
                {topics.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">
                      Explore Related Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {topics.map((topic) => (
                        <Link
                          key={topic.id}
                          href={`/courses?topic=${encodeURIComponent(topic.slug)}`}
                          className="px-3 py-1 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 no-underline hover:border-primary hover:text-primary transition-colors"
                        >
                          {topic.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="content">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black font-secondary">
                  Course content
                </h2>
                <span className="text-sm font-bold text-slate-500">
                  {sectionCount} section{sectionCount === 1 ? "" : "s"} •{" "}
                  {lectureCount} lecture{lectureCount === 1 ? "" : "s"} •{" "}
                  {formatTotalLength(totalLengthSeconds)} total length
                </span>
              </div>

              <CourseSections course={course} />
            </section>

            <section id="requirements">
              <div className="mt-[30px]">
                <h2 className="text-3xl font-black font-secondary mb-6">
                  Requirements
                </h2>
                <CourseRequirements course={course} />
              </div>
            </section>

            <section id="instructor">
              <h2 className="text-3xl font-black font-secondary mb-6">
                Instructor
              </h2>
              <CourseAuthor author={course?.author?.data} />
            </section>

            {/* <section id="ratings">
              <h2 className="text-3xl font-black mb-6 font-secondary">
                Student Feedback
              </h2>
              <CourseFeedback courseId={course?.id} />
            </section> */}
          </div>
          <aside className="relative order-first lg:order-none pt-8 lg:pt-0 lg:-mt-90 z-10">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 lg:hidden">
              Purchase options
            </h2>
            <div className="lg:sticky lg:top-24 bg-white rounded-lg lg:rounded-2xl lg:shadow-2xl border border-gray-100 overflow-hidden">
              <div
                className={`relative group hidden lg:block cursor-pointer transition-all ${isScrolled ? "lg:mt-[-225px]" : ""}`}
                onClick={() => {
                  modalState.setState({
                    modalInfo: {
                      type: "COURSE_PROMO_VIDEO",
                      title: course?.title,
                      size: "xl",
                      data: {
                        video_path: course?.promo_video?.path,
                      },
                    },
                  });
                }}
              >
                <Image
                  alt="Course Preview"
                  className="w-full aspect-video object-cover"
                  width={500}
                  height={250}
                  src={
                    course?.cover_image
                      ? course.cover_image.path
                      : "/placeholder-cover.webp"
                  }
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                    <Play className="text-primary" size={24} />
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-bold text-sm drop-shadow-md">
                  Preview this course
                </div>
              </div>

              <div className="p-4 lg:p-8">
                <div className={`${showSubscribeOption ? "hidden lg:flex" : "flex"} items-baseline gap-3 mb-6`}>
                  {isFreeCourse ? (
                    <span className="text-4xl font-black">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-black">
                        {formatPhpPrice(effectiveCoursePrice)}
                      </span>
                      {hasDiscountedPrice ? (
                        <span className="text-lg text-slate-500 line-through">
                          {formatPhpPrice(baseCoursePrice)}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>

                {profile?.permissions?.includes("view-own-learnings") && (
                  <div className="space-y-3 mb-8">
                    {course?.is_enrolled ? (
                      <Link
                        href={`/courses/${course.slug}/learn`}
                        className="block px-4 text-center w-full py-4 bg-primary text-white font-black text-lg rounded-xl hover:brightness-110 active:scale-95 transition-all"
                      >
                        Continue Learning
                      </Link>
                    ) : canStartWithPlan ? (
                      <button
                        type="button"
                        onClick={startWithPlan}
                        disabled={startingWithPlan}
                        className="block px-4 text-center w-full py-4 bg-primary text-white font-black text-lg rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                      >
                        {startingWithPlan ? "Opening..." : "Start Learning"}
                      </button>
                    ) : showSubscribeOption ? (
                      <div className="rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
                        <label className="block cursor-pointer p-4">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              className="mt-1.5 h-4 w-4 accent-primary"
                              checked={purchaseMode === "subscribe"}
                              onChange={() => setPurchaseMode("subscribe")}
                            />
                            <div>
                              <p className="text-slate-700">
                                Subscribe and save
                              </p>
                              <p className="font-bold text-xl">
                                From{" "}
                                {formatPhpPrice(
                                  Math.round(subscriptionOffer.perMonth),
                                )}
                                {subscriptionOffer.regular >
                                  subscriptionOffer.perMonth && (
                                  <span className="ml-2 text-base font-normal text-slate-500 line-through">
                                    {formatPhpPrice(
                                      Math.round(subscriptionOffer.regular),
                                    )}
                                  </span>
                                )}
                                <span className="ml-1 text-sm font-normal text-slate-600">
                                  /month
                                </span>
                              </p>
                            </div>
                          </div>
                          {purchaseMode === "subscribe" && (
                            <div className="mt-4 space-y-2 pl-7 text-sm text-slate-700">
                              <p>
                                {catalogCount > 0
                                  ? `Access to ${catalogCount}+ top-rated courses`
                                  : "Access to our top-rated courses"}
                              </p>
                              <p>Cancel anytime</p>
                              <button
                                type="button"
                                onClick={handleStartSubscription}
                                className="mt-3 block w-full rounded-lg bg-primary py-3.5 text-center font-bold text-white hover:brightness-110"
                              >
                                Start subscription
                              </button>
                            </div>
                          )}
                        </label>
                        <label className="block cursor-pointer p-4">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              className="mt-1.5 h-4 w-4 accent-primary"
                              checked={purchaseMode === "buy"}
                              onChange={() => setPurchaseMode("buy")}
                            />
                            <div>
                              <p className="text-slate-700">
                                Buy individual course
                              </p>
                              <p className="font-bold text-xl">
                                {formatPhpPrice(effectiveCoursePrice)}
                                {hasDiscountedPrice && (
                                  <span className="ml-2 text-base font-normal text-slate-500 line-through">
                                    {formatPhpPrice(baseCoursePrice)}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          {purchaseMode === "buy" && (
                            <div className="mt-4 space-y-3 pl-7">
                              {course?.is_in_cart ? (
                                <Link
                                  href="/cart"
                                  className="block w-full rounded-lg bg-primary py-3.5 text-center font-bold text-white hover:brightness-110"
                                >
                                  Go to Cart
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => handleCart(e)}
                                  className="block w-full rounded-lg bg-primary py-3.5 text-center font-bold text-white hover:brightness-110"
                                >
                                  Add to Cart
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleBuyNow}
                                className="block w-full rounded-lg border border-slate-900 py-3 font-bold text-slate-900 hover:bg-slate-50"
                              >
                                Buy Now
                              </button>
                            </div>
                          )}
                        </label>
                        <div className="flex justify-end bg-slate-50 px-4 py-3">
                          <button
                            type="button"
                            onClick={handleWishlist}
                            disabled={isWishlistSubmitting}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg border ${course?.is_in_wishlist ? "border-red-200 bg-red-50 text-red-500" : "border-slate-200 bg-white text-slate-600 hover:text-red-500"}`}
                          >
                            <Heart
                              size={18}
                              fill={
                                course?.is_in_wishlist ? "currentColor" : "none"
                              }
                            />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {course?.is_in_cart ? (
                          <Link
                            href="/cart"
                            className="block px-4 text-center w-full py-4 bg-primary text-white font-black text-lg rounded-xl hover:brightness-110 active:scale-95 transition-all"
                          >
                            Go to Cart
                          </Link>
                        ) : (
                          <button
                            onClick={(e) => handleCart(e)}
                            className="block px-4 text-center w-full py-4 bg-primary text-white font-black text-lg rounded-xl hover:brightness-110 active:scale-95 transition-all"
                          >
                            Add to Cart
                          </button>
                        )}
                      </>
                    )}

                    <CourseAccessButton
                      course={course}
                      enabled={!canStartWithPlan}
                    />

                    {!course?.is_enrolled && !showSubscribeOption && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleBuyNow}
                          className="flex-1 py-3 border border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          Buy Now
                        </button>
                        <button
                          onClick={handleWishlist}
                          disabled={isWishlistSubmitting}
                          className={`w-12 h-12 flex items-center justify-center border rounded-xl transition-all ${
                            course?.is_in_wishlist
                              ? "border-red-200 bg-red-50 text-red-500"
                              : "border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                          } ${isWishlistSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                          <Heart
                            size={20}
                            fill={
                              course?.is_in_wishlist ? "currentColor" : "none"
                            }
                          />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="font-bold mb-4">This course includes:</h4>
                  <CourseInclusions course={course} />
                </div>
                {!course?.is_enrolled && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="font-bold mb-3">Redeem coupon</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(event) =>
                          setCouponCodeInput(
                            String(event.target.value || "").toUpperCase(),
                          )
                        }
                        placeholder="Enter coupon code"
                        className="w-full rounded-[8px] border border-gray-300 px-3 py-2 text-[14px]"
                      />
                      <button
                        type="button"
                        disabled={isApplyingCoupon}
                        onClick={() =>
                          applyCouponToCurrentCourse(couponCodeInput, {
                            silent: false,
                          })
                        }
                        className={`px-4 py-2 rounded-[8px] font-semibold text-white bg-[#0056D2] ${
                          isApplyingCoupon
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:opacity-90"
                        }`}
                      >
                        {isApplyingCoupon ? "Applying..." : "Apply"}
                      </button>
                    </div>
                    {appliedCourseCoupon ? (
                      <p className="mt-2 text-[12px] text-emerald-700 font-semibold">
                        Applied:{" "}
                        {String(appliedCourseCoupon?.code || "").toUpperCase()}{" "}
                        (-{" "}
                        {formatPhpPrice(
                          appliedCourseCoupon?.discountAmount || 0,
                        )}
                        )
                      </p>
                    ) : null}
                  </div>
                )}
                <div className="mt-8 flex justify-center gap-6">
                  <button
                    onClick={handleShare}
                    disabled={isShareSubmitting}
                    className={`text-sm font-bold border-b-2 border-slate-900 ${
                      isShareSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isShareSubmitting ? "Sharing..." : "Share"}
                  </button>
                  <button className="text-sm text-red-600 font-bold border-b-2 border-red-600">
                    Report Abuse
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <div className="container mx-auto px-4 lg:px-8">
        <CourseAlsoBought slug={course?.slug} />
      </div>
      <div className="container">
        <CourseReviews courseId={course?.id} />
      </div>

      {canShowPurchaseActions ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] lg:hidden">
          {course?.is_enrolled ? (
            <Link
              href={`/courses/${course.slug}/learn`}
              className="block w-full rounded-lg bg-primary py-3.5 text-center font-bold text-white"
            >
              Continue Learning
            </Link>
          ) : canStartWithPlan ? (
            <button
              type="button"
              onClick={startWithPlan}
              disabled={startingWithPlan}
              className="block w-full rounded-lg bg-primary py-3.5 text-center font-bold text-white disabled:opacity-60"
            >
              {startingWithPlan ? "Opening..." : "Start Learning"}
            </button>
          ) : showSubscribeOption && purchaseMode === "subscribe" ? (
            <>
              <button
                type="button"
                onClick={handleStartSubscription}
                className="block w-full rounded-lg bg-primary py-3.5 text-center font-bold text-white"
              >
                Start subscription
              </button>
              <p className="mt-2 text-center text-sm text-slate-600">
                Starting at{" "}
                {subscriptionOffer.regular > subscriptionOffer.perMonth ? (
                  <span className="line-through">
                    {formatPhpPrice(Math.round(subscriptionOffer.regular))}
                  </span>
                ) : null}{" "}
                {formatPhpPrice(Math.round(subscriptionOffer.perMonth))} per
                month. Cancel anytime.
              </p>
            </>
          ) : course?.is_in_cart ? (
            <Link
              href="/cart"
              className="block w-full rounded-lg bg-primary py-3.5 text-center font-bold text-white"
            >
              Go to Cart
            </Link>
          ) : (
            <button
              type="button"
              onClick={(e) => handleCart(e)}
              className="block w-full rounded-lg bg-primary py-3.5 text-center font-bold text-white"
            >
              Add to Cart
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
