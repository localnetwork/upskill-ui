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

import { mutate } from "swr";
import globalStore from "@/lib/store/globalStore";
import modalState from "@/lib/store/modalState";
import { isLoggedIn } from "@/lib/services/auth";
import CourseFeedback from "@/components/entities/course/show/CourseFeedback";
import CourseReviews from "@/components/entities/course/show/CourseReviews";
export default function Course() {
  const router = useRouter();
  const { slug } = router.query;
  const [course, setCourse] = useState(null);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await BaseApi.get(
          process.env.NEXT_PUBLIC_API_URL + "/courses/route/" + slug,
        );

        setCourse(response?.data);
      } catch (error) {
        console.error("Error fetching course data:", error);
        if (error.status === 404) {
          setNotFound(true);
        }
      }
    };
    if (slug) {
      fetchData();
    }
  }, [slug]);

  return (
    <div className="pb-[50px]">
      <header className="bg-[#0f172a] text-white py-12 lg:py-20 px-4 lg:px-8">
        <div className="container mx-auto grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="space-y-6">
            <nav className="flex items-center gap-2 text-sm font-bold text-[#9dc4ff]">
              <a className="hover:underline" href="#">
                Development
              </a>
              <ChevronRight className="inline-block text-accent" size={16} />
              <a className="hover:underline" href="#">
                Web Development
              </a>
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
                className="relative group cursor-pointer"
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
                      ? process.env.NEXT_PUBLIC_API_DOMAIN +
                        course.cover_image.path
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
                        <div className="block px-4 text-center w-full py-4 bg-primary text-white font-black text-lg rounded-xl hover:brightness-110 active:scale-95 transition-all">
                          Already in Cart
                        </div>
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
                    <button className="flex-1 py-3 border border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                      Buy Now
                    </button>
                    <button className="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all">
                      <Heart size={20} />
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
                  {/* <button className="text-sm font-bold border-b-2 border-slate-900">
                    Gift this course
                  </button> */}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
