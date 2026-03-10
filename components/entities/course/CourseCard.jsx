import { useRef, useState } from "react";
import {
  Check,
  PlayCircle,
  ShoppingCart,
  SignalMedium,
  Star,
} from "lucide-react";
import Image from "next/image";
// import { getTooltipPlacement } from "@/lib/services/tooltipPlacement";
import { getOppositeTooltipPlacement } from "@/lib/services/tooltipPlacement";
import elementPosition from "@/lib/services/elementPosition";
import { useRouter } from "next/router";
import BaseApi from "@/lib/api/_base.api";
import { mutate } from "swr";
import modalState from "@/lib/store/modalState";
import Link from "next/link";
import toast from "react-hot-toast";
import persistentStore from "@/lib/store/persistentStore";
export default function CourseCard({ course }) {
  const cardRef = useRef(null);
  const [placement, setPlacement] = useState("top");
  const [showTooltip, setShowTooltip] = useState(false);
  const profile = persistentStore((state) => state.profile);
  const router = useRouter();

  // Get the first paragraph by splitting on </p>
  const firstParagraphRaw = course.description
    ? course.description.split("</p>")[0] + "</p>"
    : "";
  const firstParagraphText = firstParagraphRaw.replace(/<\/?[^>]+(>|$)/g, "");

  function handleMouseEnter() {
    if (!cardRef.current) return;
    const tooltipSize = { width: 200, height: 60 };
    const elPos = elementPosition(cardRef.current);
    const pos = getOppositeTooltipPlacement(elPos, tooltipSize);
    setPlacement(pos);
    setShowTooltip(true);
  }

  function handleMouseLeave() {
    setShowTooltip(false);
  }

  const handleCart = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Add this to prevent event bubbling
    toast.dismiss();

    if (!course) return;

    if (!profile) {
      return modalState.setState({
        loginModalOpen: true,
        modalInfo: {
          type: "LOGIN",
          title: "",
        },
      });
    }

    try {
      await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
        course_id: course.id,
      });
      course.is_in_cart = true;
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
      switch (error.status) {
        case 401:
          toast.error("An error occurred while adding to cart.");
          break;
        default:
          toast.error("An error occurred while adding to cart.");
      }
    }
  };

  return (
    <div
      ref={cardRef}
      id={`course-${course.uuid}`}
      className="bg-white flex flex-col relative group rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="overflow-hidden rounded-t-2xl relative z-[1]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
          {(course?.is_in_cart || course?.is_enrolled) && (
            <span className="bg-[#4992ff] text-white text-[14px] font-black uppercase px-2 py-1 rounded shadow-sm flex items-center gap-1">
              {course?.is_in_cart ? (
                <>
                  <span className="material-icons !text-[14px]">
                    shopping_cart
                  </span>
                  In Cart
                </>
              ) : (
                "Enrolled"
              )}
            </span>
          )}
        </div>
        <Link href={`/courses/${course.slug}`}>
          {course?.cover_image?.path ? (
            <Image
              src={
                process.env.NEXT_PUBLIC_API_DOMAIN + course?.cover_image?.path
              }
              alt={course.title}
              width={400}
              height={200}
              className="object-cover h-[250px] w-full"
            />
          ) : (
            <div className="overflow-hidden object-cover h-[250px] w-full flex items-center justify-center bg-[#ddd]">
              <Image
                src="/placeholder-cover.webp"
                alt="Placeholder"
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </Link>
      </div>

      <div className="p-5 overflow-hidden grow flex flex-col">
        <div className="grow">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex text-yellow-400">
              <Star className="inline-block w-4 h-4 text-yellow-500 mr-1" />
            </div>
            <span className="text-md font-bold">4.9</span>
            <span className="text-md text-slate-400">(4,215)</span>
          </div>
          <h2 className="text-lg font-bold mb-1 leading-tight group-hover:text-primary transition-colors serif-heading">
            {course.title}
          </h2>

          <div
            className="font-normal line-clamp-2 grow text-[13px] text-gray-600 mb-4"
            dangerouslySetInnerHTML={{ __html: firstParagraphText }}
          />
          <p className="text-xs text-slate-500 font-medium mb-4" />

          <div className="flex items-center gap-2 mb-4">
            <Image
              alt="Instructor"
              className="w-6 h-6 rounded-full object-cover"
              src={
                process.env.NEXT_PUBLIC_API_DOMAIN +
                course?.author?.data?.user_picture?.path
              }
              width={24}
              height={24}
            />
            <span className="text-xs text-slate-500 font-medium">
              {course?.author?.data?.firstname} {course?.author?.data?.lastname}
              {", "}
              {course?.author?.data?.headline}
            </span>
          </div>

          <div className="flex items-center gap-4 mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center">
              <SignalMedium className="text-sm mt-[-10px]" />
              <span>{course.instructional_level.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <PlayCircle className="text-sm" />
              <span>{course.resources_count.curriculum_count} Lectures</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between grow pt-4 border-t border-gray-50">
          <div className="flex flex-col">
            <span className="flex  items-center text-xl font-black text-slate-900">
              ₱ {course?.price_tier?.price ? course.price_tier.price : "Null"}
            </span>
          </div>

          <div className="text-[14px] flex justify-end items-center max-w-[350px]">
            {course?.is_enrolled ? (
              <div>
                <Link
                  href={`/courses/${course.slug}/learn`}
                  className="border-[2px] hover:text-white text-[#0056D2] border-[#0056D2] flex items-center justify-center gap-[5px] text-center font-semibold px-[20px] py-[5px] rounded-[5px] hover:bg-[#1d6de0]"
                >
                  Go to course
                </Link>
              </div>
            ) : (
              <>
                {course?.is_in_cart ? (
                  <div className="w-10 h-10 rounded-xl cursor-pointer flex items-center justify-center bg-[#0056D2] text-white transition-colors shadow-sm">
                    <span className="material-icons">check</span>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleCart(e)}
                    className="p-4 cursor-pointer flw-10 h-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center hover:bg-[#0056D2] hover:text-white transition-colors shadow-sm"
                  >
                    <span className="material-icons">
                      add_shopping_cart
                    </span>{" "}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {course?.goals?.what_you_will_learn_data && (
        <div
          className={`z-[20] bg-white shadow-md border-[1px] border-solid border-[oklch(86.72%_0.0192_282.72deg)] rounded-[10px] !p-[30px] tooltip tooltip-${placement}`}
          data-show={showTooltip ? "true" : "false"}
        >
          <h3 className="font-semibold mb-2 text-[20px]">What you'll learn</h3>
          {course?.goals?.what_you_will_learn_data.map((goal, index) => (
            <div
              key={index}
              className="text-[14px] flex gap-y-[10px] text-gray-700 mb-1"
            >
              <span className="inline-block mr-2">
                <Check width={15} />
              </span>{" "}
              {goal}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
