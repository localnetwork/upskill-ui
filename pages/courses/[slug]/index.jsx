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
  Heart,
  MonitorPlay,
  Newspaper,
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

import { mutate } from "swr";
export default function Course() {
  const router = useRouter();
  const { slug } = router.query;
  const [course, setCourse] = useState(null);

  const [notFound, setNotFound] = useState(false);

  const updateCart = cartStore((state) => state.setCartCount);

  const handleCart = async (e) => {
    e.preventDefault();
    if (!course) return;

    try {
      await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
        course_id: course.id,
      });
      toast.success("Course added successfully.");
      setCourse((prev) => ({ ...prev, is_in_cart: true }));
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/cart/count`);
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
          process.env.NEXT_PUBLIC_API_URL + "/courses/route/" + slug
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
    <div>
      <div className="relative py-[50px] px-[30px]">
        <span className="absolute inset-0 bg-[#16161D] h-[350px] z-0" />
        <div className="container relative">
          <div className="grid max-w-[1180px] mx-auto grid-cols-3">
            <div className="col-span-2 pr-[50px]">
              <h1 className="text-[35px] text-white mb-3 font-semibold ">
                {course?.title}
              </h1>

              {course?.subtitle && (
                <div
                  className="text-[20px] text-white mb-[20px] font-light"
                  dangerouslySetInnerHTML={{ __html: course.subtitle }}
                />
              )}
              {course?.author && (
                <div className="text-white">
                  Created by{" "}
                  <Link
                    className="text-[18px] text-[#7fb4ff]"
                    href={`/user/${course?.author?.data?.username}`}
                  >
                    {course?.author?.data?.firstname}{" "}
                    {course?.author?.data?.lastname}
                  </Link>
                </div>
              )}
              <div className="mt-[30px] text-[#a1a4b8]">
                Last updated {new Date(course?.updated_at).toDateString()}
              </div>

              <div className="bg-white border border-[#d1d2e0] mt-[10px] rounded-[15px] overflow-hidden grid grid-cols-4 text-[#292c42]">
                <div className="col-span-2 grid grid-cols-3">
                  <div className="col-span-1 bg-[#0056D2] p-[15px] text-white font-semibold flex flex-col gap-[5px] items-center justify-center">
                    <BadgeCheck className="" size={30} />
                    Premium
                  </div>
                  <div className="col-span-2 flex flex-col p-[15px] ">
                    <p className="font-light">
                      Access this top-rated course, plus 26,000+ more top-rated
                      courses, with Upskill.
                    </p>

                    <div className="mt-1">
                      <Link
                        href="/pricing"
                        className="underline text-[#0056D2] font-bold"
                      >
                        See Pricing
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-[15px]">
                  <div className="border-l-1 border-[#ddd] h-full flex justify-center items-center flex-col">
                    <p className="font-bold text-[30px]">4.6</p>
                    <div>
                      <Star className="inline text-[#f4c150]" size={15} />
                      <Star className="inline text-[#f4c150]" size={15} />
                      <Star className="inline text-[#f4c150]" size={15} />
                      <Star className="inline text-[#f4c150]" size={15} />
                      <Star className="inline text-[#f4c150]" size={15} />
                    </div>
                    <p className="underline text-center font-light mt-2">
                      15,974 ratings
                    </p>
                  </div>
                </div>
                <div className="p-[15px] ">
                  <div className="flex flex-col h-full items-center justify-center border-l-1 border-[#ddd]">
                    <UsersRound className="inline" size={30} />
                    <p className="font-bold grow">56,926</p>
                    <p>Learners</p>
                  </div>
                </div>
              </div>

              <div className="mt-[30px] p-[30px] border border-[#d1d2e0]">
                <h2 className="font-semibold text-[25px] mb-3">
                  What you'll learn
                </h2>
                <CourseLearnings course={course} />
              </div>
              <div className="mt-[30px] prose prose-invert max-w-none">
                <h2 className="font-semibold text-[25px] mb-3">
                  This course includes
                </h2>

                <CourseInclusions course={course} />
              </div>

              <div className="mt-[30px]">
                <h2 className="font-semibold text-[25px] mb-3">
                  Course Content
                </h2>
                <CourseSections course={course} />
              </div>

              <div className="mt-[30px]">
                <h2 className="font-semibold text-[25px] mb-3">Requirements</h2>
                <CourseRequirements course={course} />
              </div>

              <div className="mt-[30px] mb-[50px] prose prose-invert max-w-none">
                <h2 className="font-semibold text-[25px] mb-3">Description</h2>
                <CourseDescription description={course?.description} />
              </div>

              <div className="mb-[50px]">
                <h2 className="font-semibold text-[25px] mb-3">Instructor</h2>

                <CourseAuthor author={course?.author?.data} />
              </div>
            </div>
            <div className="col-span-1 justify-end">
              <div
                className="sticky top-[120px] [border-block-end:1px_solid_oklch(86.72%_0.0192_282.72deg)] box-border [box-shadow:0_2px_4px_color-mix(in_oklch,oklch(27.54%_0.1638_265.98deg)_8%,transparent),0_4px_12px_color-mix(in_oklch,oklch(27.54%_0.1638_265.98deg)_8%,transparent)]
  [background-color:oklch(100%_0_0deg)] w-full max-w-[400px] p-[15px]"
              >
                <div className="m-[-15px_-15px_0] h-[250px] relative">
                  <span className="absolute top-0 left-0 w-full h-full inset-0 bg-black opacity-10 z-0" />
                  <PlayCircle
                    size={50}
                    className="absolute text-white top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  />
                  {course?.cover_image && (
                    <Image
                      src={
                        process.env.NEXT_PUBLIC_API_DOMAIN +
                        course?.cover_image?.path
                      }
                      width={500}
                      height={250}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-[30px]">
                  <div className="text-[25px] mb-[15px] font-bold">₱639</div>
                  <div className="flex flex-wrap gap-[5px]">
                    {course?.is_in_cart ? (
                      <div className="bg-[#0056D2] opacity-50 flex items-center justify-center gap-[5px] text-center max-w-[calc(100%-66px)] font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full hover:bg-[#1d6de0]">
                        <Check size={20} /> Already in Cart
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleCart(e)}
                        className="bg-[#0056D2] flex items-center justify-center gap-[5px] text-center max-w-[calc(100%-66px)] font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full hover:bg-[#1d6de0]"
                      >
                        <ShoppingCart size={20} />
                        Add to Cart
                      </button>
                    )}
                    <button className="px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded">
                      <Heart size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
