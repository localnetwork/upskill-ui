import { useRef, useState } from "react";
import { Check, ShoppingCart, Star } from "lucide-react";
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
export default function CourseCard({ course }) {
  const cardRef = useRef(null);
  const [placement, setPlacement] = useState("top");
  const [showTooltip, setShowTooltip] = useState(false);

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
    if (!course) return;
    toast.dismiss();

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

      if (error.status == 409) {
        toast.error("Course is already in cart.");
      } else {
        toast.error("Failed to add course to cart. Please try again later.");
      }
    }
  };

  return (
    <div
      ref={cardRef}
      id={`course-${course.uuid}`}
      className="group relative flex border-[1px] border-solid border-[oklch(86.72%_0.0192_282.72deg)] rounded-[10px] p-[15px] flex-col"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // onClick={() => {
      //   router.push(`/courses/${course.slug}`);
      // }}
    >
      <Link href={`/courses/${course.slug}`}>
        {course?.cover_image?.path ? (
          <Image
            src={process.env.NEXT_PUBLIC_API_DOMAIN + course?.cover_image?.path}
            alt={course.title}
            width={400}
            height={200}
            className="rounded-[10px] object-cover h-[250px] w-full"
          />
        ) : (
          <div className="rounded-[10px] overflow-hidden object-cover h-[250px] w-full flex items-center justify-center bg-[#ddd]">
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

      <h2 className="font-semibold text-lg mt-4">{course.title}</h2>

      <div
        className="font-normal line-clamp-2 grow"
        dangerouslySetInnerHTML={{ __html: firstParagraphText }}
      />

      <div className="mt-2 flex items-center gap-2">
        <div className="inline-flex items-center text-sm text-gray-600 border-[1px] border-solid border-[oklch(86.72%_0.0192_282.72deg)] rounded-sm px-3 py-[5px]">
          <Star className="inline-block w-4 h-4 text-yellow-500 mr-1" />
          4.5
        </div>
        <div className="inline-flex items-center text-sm text-gray-600 border-[1px] border-solid border-[oklch(86.72%_0.0192_282.72deg)] rounded-sm px-3 py-[5px]">
          0 ratings
        </div>

        {course?.instructional_level?.title && (
          <div className="inline-flex items-center text-sm text-gray-600 border-[1px] border-solid border-[oklch(86.72%_0.0192_282.72deg)] rounded-sm px-3 py-[5px]">
            {course.instructional_level.title}
          </div>
        )}

        {course?.resources_count && (
          <div className="inline-flex items-center text-sm text-gray-600 border-[1px] border-solid border-[oklch(86.72%_0.0192_282.72deg)] rounded-sm px-3 py-[5px]">
            {course.resources_count.curriculum_count} lectures
          </div>
        )}
      </div>

      <div className="flex justify-between items-center gap-[15px] mt-5">
        <span className="font-semibold text-lg flex items-center whitespace-nowrap">
          ₱ {course?.price_tier?.price ? course.price_tier.price : "Null"}
        </span>

        <div className="w-full text-[14px] flex justify-end items-center max-w-[350px]">
          {course?.is_enrolled ? (
            <div>
              <Link
                href=""
                className="border-[2px] hover:text-white text-[#0056D2] border-[#0056D2] flex items-center justify-center gap-[5px] text-center font-semibold px-[20px] py-[5px] rounded-[5px] hover:bg-[#1d6de0]"
              >
                Go to course
              </Link>
            </div>
          ) : (
            <>
              {course?.is_in_cart ? (
                <div className="border-[2px] hover:text-white text-[#0056D2] border-[#0056D2] select-none opacity-50 flex items-center justify-center gap-[5px] text-center max-w-[calc(100%-66px)] font-semibold px-[20px] py-[5px] rounded-[5px] hover:bg-[#1d6de0]">
                  <Check size={15} /> Already in Cart
                </div>
              ) : (
                <button
                  onClick={(e) => handleCart(e)}
                  className="border-[2px] hover:text-white text-[#0056D2] border-[#0056D2] flex items-center justify-center gap-[5px] text-center max-w-[calc(100%-66px)] font-semibold px-[20px] py-[5px] rounded-[5px] hover:bg-[#1d6de0]"
                >
                  <ShoppingCart size={15} />
                  Add to Cart
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {course?.goals?.what_you_will_learn_data && (
        <div
          className={`bg-white shadow-md border-[1px] border-solid border-[oklch(86.72%_0.0192_282.72deg)] rounded-[10px] !p-[30px] tooltip tooltip-${placement}`}
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
