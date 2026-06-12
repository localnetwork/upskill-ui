import CourseAuthor from "@/components/entities/course/show/CourseAuthor";
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
  Code,
  Globe,
  Heart,
  History,
  Infinity,
  MonitorPlay,
  Newspaper,
  Play,
  PlayCircle,
  ShoppingCart,
  Smartphone,
  SquarePlay,
  Star,
  Trophy,
  TrophyIcon,
  UsersRound,
  Video,
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
import CourseFeedback from "@/components/entities/course/show/CourseFeedback";
import CourseReviews from "@/components/entities/course/show/CourseReviews";

const shimmer =
  "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded";

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
          <main className="py-12 space-y-16">
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
          </main>

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
  const { slug } = router.query;
  const [course, setCourse] = useState(null);
  const [isCourseLoading, setIsCourseLoading] = useState(true);
  const [isWishlistSubmitting, setIsWishlistSubmitting] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  const [notFound, setNotFound] = useState(false);

  const updateCart = cartStore((state) => state.setCartCount);

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

    try {
      await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
        course_id: course.id,
      });
      setCourse((prev) => ({ ...prev, is_in_cart: true }));
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
    } catch (error) {
      console.error("Error adding to cart:", error);

      if (error.status == 409) {
        toast.error("Course is already in cart.");
      } else {
        toast.error("Failed to add course to cart. Please try again later.");
      }
    }
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

    router.push(`/checkout/express?slug=${encodeURIComponent(course.slug)}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsCourseLoading(true);
        setNotFound(false);
        const response = await BaseApi.get(
          process.env.NEXT_PUBLIC_API_URL + "/courses/route/" + slug,
        );

        setCourse(response?.data);
      } catch (error) {
        console.error("Error fetching course data:", error);
        if (error.status === 404) {
          setNotFound(true);
        }
      } finally {
        setIsCourseLoading(false);
      }
    };
    if (slug) {
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
  }, [slug]);

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

  return (
    <div className="pb-[50px]">
      <header className="bg-[#0f172a] text-white py-12 lg:py-20 px-4 lg:px-8">
        <div className="container mx-auto grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="space-y-6">
            <nav className="flex items-center gap-2 text-sm font-bold text-[#9dc4ff]">
              {console.log("course.categories", course?.categories)}
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
            <h1 className="text-4xl font-secondary lg:text-6xl font-black serif-heading leading-tight">
              {course?.title}
            </h1>
            <div
              className="text-xl text-slate-300 max-w-2xl"
              dangerouslySetInnerHTML={{ __html: course?.subtitle }}
            />

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded">
                  Bestseller
                </span>
                <div className="flex items-center gap-1 text-yellow-400">
                  <span className="font-bold text-white">4.9</span>
                  <Star className="inline-block w-4 h-4 text-yellow-500" />
                  <Star className="inline-block w-4 h-4 text-yellow-500" />
                  <Star className="inline-block w-4 h-4 text-yellow-500" />
                  <Star className="inline-block w-4 h-4 text-yellow-500" />
                  <Star className="inline-block w-4 h-4 text-yellow-500" />
                </div>
                <span className="text-slate-400 text-sm">(12,415 ratings)</span>
              </div>
              <div className="text-sm text-slate-300">
                <span className="font-bold text-white">45,892</span> students
                enrolled
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                {/* <span className="material-symbols-outlined text-slate-400"></span> */}
                <History className="inline text-slate-400" size={18} />
                <span>Last updated 10/2023</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="inline text-slate-400" size={18} />
                <span>English</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="grid lg:grid-cols-[1fr_400px] gap-12">
          <main className="py-12 space-y-16">
            <section id="about">
              <h2 className="text-3xl font-black serif-heading mb-6 font-secondary">
                About this course
              </h2>

              <div className="prose prose-slate max-w-none">
                <CourseDescription description={course?.description} />
                <CourseLearnings course={course} />
              </div>
            </section>

            <section className="content">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black font-secondary">
                  Course content
                </h2>
                <span className="text-sm font-bold text-slate-500">
                  12 sections • 145 lectures • 20h 42m total length
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

            <section id="ratings">
              <h2 className="text-3xl font-black mb-6 font-secondary">
                Student Feedback
              </h2>
              <CourseFeedback courseId={course?.id} />
            </section>

            <CourseReviews />
          </main>
          <aside className="relative lg:-mt-90 z-10">
            <div className="lg:sticky lg:top-24 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div
                className={`relative group cursor-pointer transition-all ${isScrolled ? "mt-[-225px]" : ""}`}
                onClick={() => {
                  console.log("course", course);
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

              <div className="p-8">
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-4xl font-black">
                    {course?.price_tier?.title.toLowerCase() === "free"
                      ? "Free"
                      : course?.price_tier?.price}
                  </span>
                  {/* <span className="text-lg text-slate-400 line-through">
                    $129.99
                  </span>
                  <span className="text-accent font-bold text-sm">31% off</span> */}
                </div>
                <div className="space-y-3 mb-8">
                  {course?.is_enrolled ? (
                    <Link
                      href={`/courses/${course.slug}/learn`}
                      className="block px-4 text-center w-full py-4 bg-primary text-white font-black text-lg rounded-xl hover:brightness-110 active:scale-95 transition-all"
                    >
                      Continue Learning
                    </Link>
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
                        fill={course?.is_in_wishlist ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-4">This course includes:</h4>
                  <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex items-center gap-3">
                      <Video className="text-slate-400 text-lg" size={20} />
                      <span>20.5 hours on-demand video</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Newspaper className="text-slate-400 text-lg" size={20} />
                      <span>
                        {course?.resources_count?.article_count && (
                          <>
                            {course?.resources_count?.article_count || 0}{" "}
                            articles{" "}
                          </>
                        )}
                        &amp; 12 downloadable resources
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Code className="text-slate-400 text-lg" size={20} />
                      <span>15 coding exercises</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Infinity className="text-slate-400 text-lg" size={20} />
                      <span>Full lifetime access</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <TrophyIcon
                        className="text-slate-400 text-lg"
                        size={20}
                      />
                      <span>Certificate of completion</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 flex justify-center gap-6">
                  <button className="text-sm font-bold border-b-2 border-slate-900">
                    Share
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
    </div>
  );
}
