import { useEffect, useMemo, useRef, useState } from "react";
import { Check, PlayCircle, SignalMedium, Star } from "lucide-react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import BaseApi from "@/lib/api/_base.api";
import { mutate } from "swr";
import modalState from "@/lib/store/modalState";
import toast from "react-hot-toast";
import persistentStore from "@/lib/store/persistentStore";

function toBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export default function CourseCard({ course }) {
  const cardRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const profile = persistentStore((state) => state.profile);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsInCart(toBoolean(course?.is_in_cart));
    setIsEnrolled(toBoolean(course?.is_enrolled));
  }, [course?.is_in_cart, course?.is_enrolled]);

  const learnings = useMemo(
    () => course?.goals?.what_you_will_learn_data || [],
    [course?.goals?.what_you_will_learn_data],
  );

  const firstParagraphRaw = course?.description
    ? course.description.split("</p>")[0] + "</p>"
    : "";
  const firstParagraphText = firstParagraphRaw.replace(/<\/?[^>]+(>|$)/g, "");

  const updateTooltipPosition = () => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const tooltipWidth = 320;
    const gap = 10;
    const rightSideLeft = rect.right + gap;
    const leftSideLeft = rect.left - tooltipWidth - gap;
    const left =
      rightSideLeft + tooltipWidth > window.innerWidth
        ? leftSideLeft
        : rightSideLeft;
    const top = Math.max(12, rect.top + 12);
    setTooltipPosition({ top, left: Math.max(12, left) });
  };

  const handleMouseEnter = () => {
    if (!learnings.length) return;
    updateTooltipPosition();
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  useEffect(() => {
    if (!showTooltip) return;
    const handleReposition = () => updateTooltipPosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [showTooltip]);

  const handleCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.dismiss();

    if (!course || isEnrolled || isInCart || isAddingToCart) return;

    if (!profile) {
      modalState.setState({
        loginModalOpen: true,
        modalInfo: { type: "LOGIN", title: "" },
      });
      return;
    }

    setIsAddingToCart(true);

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
      setIsAddingToCart(false);
    } catch (_error) {
      setIsAddingToCart(false);
      toast.error("An error occurred while adding to cart.");
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        id={`course-${course?.uuid || course?.id}`}
        className="bg-white flex flex-col relative group rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="overflow-hidden rounded-t-2xl relative z-[1]">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
            {(isInCart || isEnrolled) && (
              <span className="bg-[#4992ff] text-white text-[14px] font-black uppercase px-2 py-1 rounded shadow-sm flex items-center gap-1">
                {isEnrolled ? "Enrolled" : "In Cart"}
              </span>
            )}
          </div>
          <Link href={`/courses/${course.slug}`}>
            {course?.cover_image ? (
              <Image
                src={course.cover_image.path}
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
              {course?.author?.data?.user_picture && (
                <Link
                  href={`/user/${course?.author?.data?.username}`}
                  className="w-6 h-6 rounded-full block"
                >
                  <Image
                    alt="Instructor"
                    className="object-cover min-w-6 min-h-6 rounded-full"
                    src={course.author.data.user_picture.path}
                    width={24}
                    height={24}
                  />
                </Link>
              )}

              <span className="text-xs text-slate-500 font-medium">
                {course?.author?.data?.firstname}{" "}
                {course?.author?.data?.lastname}
                {", "}
                {course?.author?.data?.headline}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">
              <div className="flex items-center">
                <SignalMedium className="text-sm mt-[-10px]" />
                <span>{course?.instructional_level?.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <PlayCircle className="text-sm" />
                <span>
                  {course?.resources_count?.curriculum_count} Lectures
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-[15px] items-center justify-between grow pt-4 border-t border-gray-50">
            <div className="flex flex-col">
              <span className="flex items-center text-xl font-black text-slate-900 whitespace-nowrap">
                {course?.price_tier?.price === "0.00" ? (
                  <span className="px-[15px] py-[5px] text-white bg-[#178617] text-[15px] rounded-sm">
                    Free
                  </span>
                ) : (
                  <>₱ {course?.price_tier?.price || "0.00"}</>
                )}
              </span>
            </div>

            <div className="text-[14px] flex justify-end items-center max-w-[350px]">
              {isEnrolled ? (
                <Link
                  href={`/courses/${course.slug}/learn`}
                  className="border-[2px] hover:text-white text-[#0056D2] border-[#0056D2] flex items-center justify-center gap-[5px] text-center font-semibold px-[20px] py-[5px] rounded-[5px] hover:bg-[#1d6de0]"
                >
                  Continue Learning
                </Link>
              ) : isInCart ? (
                <Link
                  href="/cart"
                  className="border-[2px] hover:text-white text-[#0056D2] border-[#0056D2] flex items-center justify-center gap-[5px] text-center font-semibold px-[20px] py-[5px] rounded-[5px] hover:bg-[#1d6de0]"
                >
                  Go to Cart
                </Link>
              ) : (
                <>
                  {isAddingToCart ? (
                    <span
                      disabled
                      className="opacity-50 border-[2px] hover:text-white text-[#0056D2] border-[#0056D2] flex items-center justify-center gap-[5px] text-center font-semibold px-[20px] py-[5px] rounded-[5px] hover:bg-[#1d6de0]"
                    >
                      Adding to cart
                    </span>
                  ) : (
                    <button
                      onClick={handleCart}
                      className="border-[2px] hover:text-white text-[#0056D2] border-[#0056D2] flex items-center justify-center gap-[5px] text-center font-semibold px-[20px] py-[5px] rounded-[5px] hover:bg-[#1d6de0]"
                    >
                      Add to Cart
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {mounted &&
        showTooltip &&
        learnings.length > 0 &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              width: "320px",
              zIndex: 9999,
            }}
            className="bg-white shadow-xl border border-[oklch(86.72%_0.0192_282.72deg)] rounded-[10px] p-[20px]"
            onMouseLeave={handleMouseLeave}
          >
            <h3 className="font-semibold mb-2 text-[18px]">
              What you'll learn
            </h3>
            {learnings.slice(0, 5).map((goal, index) => (
              <div
                key={index}
                className="text-[13px] flex gap-y-[10px] text-gray-700 mb-1"
              >
                <span className="inline-block mr-2 mt-[2px]">
                  <Check width={14} />
                </span>
                <span>{goal}</span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
