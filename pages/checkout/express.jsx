import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import Spinner from "@/components/icons/Spinner";

export default function ExpressCheckout() {
  const router = useRouter();
  const { slug } = router.query;
  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const cookie = parseCookies();

  useEffect(() => {
    if (!cookie[process.env.NEXT_PUBLIC_TOKEN]) {
      router.replace("/login");
      return;
    }
  }, [cookie, router]);

  useEffect(() => {
    async function loadCourse() {
      if (!slug) return;

      try {
        setLoadingCourse(true);
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/route/${slug}`,
        );
        const data = response?.data || null;
        if (!data) {
          router.replace("/courses");
          return;
        }
        if (data?.is_enrolled) {
          router.replace(`/courses/${data.slug}/learn`);
          return;
        }
        setCourse(data);
      } catch (_error) {
        toast.error("Unable to load course for express checkout.");
        router.replace("/courses");
      } finally {
        setLoadingCourse(false);
      }
    }

    loadCourse();
  }, [slug, router]);

  const handleCheckout = async () => {
    if (!course) return;

    try {
      setIsLoading(true);
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/checkout`,
        { courseId: course.id },
      );

      if (response.data.redirect_url) {
        router.push(response.data.redirect_url);
        return;
      }

      setIsLoading(false);
      toast.error("Unable to start express checkout. Please try again.");
    } catch (error) {
      setIsLoading(false);
      toast.error(error?.data?.message || "Unable to process express checkout.");
    }
  };

  const price = course?.price_tier?.title?.toLowerCase() === "free" ? "Free" : `₱${course?.price_tier?.price || 0}`;

  return (
    <div className="bg-[linear-gradient(90deg,transparent_60%,oklch(97.59%_0.0029_264.54deg)_40%)] min-h-[calc(100vh-70px)] py-[30px]">
      <div className="max-w-[984px] mx-auto flex justify-between gap-[50px] px-[15px]">
        <div className="py-[50px] max-w-[calc(100%-320px)] w-full pr-[50px]">
          <Link
            href={course?.slug ? `/courses/${course.slug}` : "/courses"}
            className="flex items-center gap-[5px] mb-5 mt-[-50px]"
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-[20px] font-semibold mb-5">Express checkout</h1>

          {loadingCourse ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Spinner className="animate-spin" />
              Loading course...
            </div>
          ) : course ? (
            <div>
              <h2 className="text-[18px] font-semibold mb-2">Order details (1 course)</h2>
              <div className="flex justify-between">
                <div className="flex items-center gap-[10px]">
                  <Image
                    src={course?.cover_image?.path || "/placeholder-cover.webp"}
                    width={70}
                    height={50}
                    alt={course?.title || "Course"}
                    className="w-[70px] h-[50px] object-cover rounded-md border-[1px] border-[oklch(86.72%_0.0192_282.72deg)]"
                  />
                  <div className="font-semibold">{course?.title}</div>
                </div>
                <div className="font-light">{price}</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="w-[350px] pl-[10px] py-[50px]">
          <h2 className="font-semibold text-[25px] mb-2">Order summary</h2>
          <div className="flex justify-between">
            <div className="font-semibold text-[18px]">Total:</div>
            <div className="font-semibold text-[18px]">{price}</div>
          </div>

          <div className="border-t border-[#ddd] mt-[30px] pt-[30px]">
            <p className="text-[14px] text-gray-500">
              By completing your purchase, you agree to these{" "}
              <Link href="/terms-of-use" target="_blank" className="text-[#0056D2]">
                Terms of Use
              </Link>
              .
            </p>

            <button
              onClick={handleCheckout}
              disabled={isLoading || loadingCourse || !course}
              className={`${isLoading || loadingCourse || !course ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} bg-[#0056D2] gap-[5px] flex items-center justify-center w-full mt-[30px] min-w-[150px] font-semibold text-white px-[30px] py-[12px] rounded-[5px] hover:bg-[#1d6de0]`}
            >
              {isLoading ? (
                <Spinner className="animate-spin" />
              ) : (
                <>
                  <LockKeyhole size={20} />
                  Proceed
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
