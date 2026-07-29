import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import persistentStore from "@/lib/store/persistentStore";
import { useEffect, useMemo, useState } from "react";
import { parseCookies } from "nookies";
import CARTAPI from "@/lib/api/cart/request";
import cartStore from "@/lib/store/cartStore";
import CartItemCard from "@/components/entities/cart/CartItemCard";
import { MoveRight } from "lucide-react";
import toast from "react-hot-toast";

function asCurrency(value) {
  return Number(value || 0).toFixed(2);
}

export default function Cart() {
  const profile = persistentStore((state) => state.profile);
  const cart = cartStore((state) => state.cart);
  const cartTotal = cartStore((state) => state.cartTotal);
  const appliedCourseCoupons = cartStore((state) => state.appliedCourseCoupons || {});
  const isCartLoading = cartStore((state) => state.isCartLoading);
  const cookies = parseCookies();
  const router = useRouter();

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    if (!profile && !cookies[process.env.NEXT_PUBLIC_TOKEN]) {
      router.replace("/login");
    }
  }, [profile, router]);

  useEffect(() => {
    if (!Array.isArray(cart)) return;

    const courseIds = new Set(cart.map((row) => String(row?.course?.id || "")));
    const current = cartStore.getState().appliedCourseCoupons || {};
    const next = {};

    for (const [courseId, coupon] of Object.entries(current)) {
      if (courseIds.has(String(courseId))) {
        next[courseId] = coupon;
      }
    }

    if (Object.keys(next).length !== Object.keys(current).length) {
      cartStore.setState({ appliedCourseCoupons: next });
    }
  }, [cart]);

  const totalDiscount = useMemo(
    () =>
      Object.values(appliedCourseCoupons || {}).reduce((sum, entry) => {
        return sum + Number(entry?.discountAmount || 0);
      }, 0),
    [appliedCourseCoupons],
  );

  const payableTotal = useMemo(() => {
    const subtotal = Number(cartTotal || 0);
    return Math.max(0, subtotal - totalDiscount);
  }, [cartTotal, totalDiscount]);

  const appliedCouponCodes = useMemo(
    () =>
      Object.values(appliedCourseCoupons || {})
        .map((entry) => String(entry?.code || "").trim().toUpperCase())
        .filter(Boolean),
    [appliedCourseCoupons],
  );

  const checkoutHref =
    appliedCouponCodes.length > 0
      ? `/checkout?coupons=${encodeURIComponent(appliedCouponCodes.join(","))}`
      : "/checkout";

  const handleApplyCoupon = async () => {
    const code = String(couponCodeInput || "")
      .trim()
      .toUpperCase();

    if (!code) {
      toast.error("Enter a coupon code.");
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const response = await CARTAPI.validateCoupon(code);
      const data = response?.data?.data || {};
      const couponCourseId = String(data?.coupon?.courseId || "");
      if (!couponCourseId) {
        toast.error("This coupon is not tied to a course promotion.");
        return;
      }
      const courseExistsInCart = Array.isArray(cart)
        ? cart.some((row) => String(row?.course?.id || "") === couponCourseId)
        : false;
      if (!courseExistsInCart) {
        toast.error("This coupon is for a course not in your cart.");
        return;
      }

      const discountAmount = Number(data?.discountAmount || 0);
      cartStore.setState({
        appliedCourseCoupons: {
          ...(cartStore.getState().appliedCourseCoupons || {}),
          [couponCourseId]: {
            code,
            couponId: String(data?.coupon?.id || ""),
            courseId: couponCourseId,
            discountAmount,
          },
        },
      });
      setCouponCodeInput("");
      toast.success("Coupon applied.");
    } catch (error) {
      toast.error(error?.data?.message || "Unable to apply coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCourseCoupon = (courseId) => {
    const normalizedCourseId = String(courseId || "");
    const next = { ...(cartStore.getState().appliedCourseCoupons || {}) };
    delete next[normalizedCourseId];
    cartStore.setState({ appliedCourseCoupons: next });
  };

  return (
    <div className="py-[30px]">
      <div className="max-w-[1244px] mx-auto px-[15px] w-full">
        <h1 className="text-[40px] font-semibold mb-5">Shopping Cart</h1>

        {isCartLoading && (!Array.isArray(cart) || cart.length === 0) ? (
          <>
            <div className="flex gap-[50px] animate-pulse">
              <div className="flex w-[calc(100%-300px)] flex-col gap-[20px]">
                <div className="pb-[10px] border-b mb-[15px]">
                  <div className="h-6 w-48 rounded-md bg-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite]" />
                  </div>
                </div>

                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex gap-4 border-b pb-6 relative overflow-hidden"
                  >
                    <div className="h-28 w-40 rounded-xl bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-3/4 rounded bg-gray-200" />
                      <div className="h-4 w-1/2 rounded bg-gray-200" />
                      <div className="h-4 w-1/3 rounded bg-gray-200" />
                      <div className="flex justify-between items-center pt-2">
                        <div className="h-6 w-24 rounded bg-gray-200" />
                        <div className="h-5 w-20 rounded bg-gray-200" />
                      </div>
                    </div>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />
                  </div>
                ))}
              </div>

              <div className="w-[350px]">
                <div className="h-5 w-20 rounded bg-gray-200 mb-3 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite]" />
                </div>
                <div className="h-10 w-40 rounded bg-gray-200 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite]" />
                </div>
                <div className="h-[56px] w-full rounded-[10px] bg-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite]" />
                </div>
                <div className="h-4 w-40 rounded bg-gray-200 mt-4 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {cart && cart.length > 0 ? (
              <div className="flex gap-[50px]">
                <div className="flex w-[calc(100%-300px)] flex-col gap-[15px]">
                  <div className="pb-[10px] border-bottom mb-[15px] flex gap-[15px] text-[18px] font-semibold">
                    {cart.length} Courses in Cart
                  </div>

                  {cart.map((item, index) => {
                    const courseId = String(item?.course?.id || "");
                    const appliedCoupon = appliedCourseCoupons?.[courseId] || null;
                    return (
                      <CartItemCard
                        key={item.id}
                        item={item}
                        isLast={index === cart.length - 1}
                        appliedCoupon={appliedCoupon}
                      />
                    );
                  })}
                </div>

                <div className="w-[350px]">
                  <span className="text-[18px] font-semibold text-gray-500">
                    Total:
                  </span>
                  <p className="font-semibold text-[35px]">₱{asCurrency(payableTotal)}</p>
                  {Number(totalDiscount || 0) > 0 ? (
                    <p className="text-[14px] text-emerald-700 mt-1">
                      Discounts applied: ₱{asCurrency(totalDiscount)}
                    </p>
                  ) : null}
                  {appliedCouponCodes.length > 0 ? (
                    <p className="text-[13px] text-gray-500 mt-2">
                      Applied coupons: {appliedCouponCodes.join(", ")}
                    </p>
                  ) : null}

                  <div className="mt-4">
                    <label className="text-[14px] font-semibold text-gray-600">
                      Apply coupon code
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(event) =>
                          setCouponCodeInput(event.target.value.toUpperCase())
                        }
                        placeholder="Enter coupon code"
                        className="w-full rounded-[8px] border border-gray-300 px-3 py-2 text-[14px]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon}
                        className={`px-4 py-2 rounded-[8px] font-semibold text-white bg-[#0056D2] ${
                          isApplyingCoupon
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:opacity-90"
                        }`}
                      >
                        {isApplyingCoupon ? "Applying..." : "Apply"}
                      </button>
                    </div>
                  </div>

                  {Object.keys(appliedCourseCoupons || {}).length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {Object.entries(appliedCourseCoupons).map(
                        ([courseId, coupon]) => {
                          const course = Array.isArray(cart)
                            ? cart.find(
                                (row) =>
                                  String(row?.course?.id || "") === String(courseId),
                              )?.course
                            : null;
                          return (
                            <div
                              key={courseId}
                              className="rounded-md border border-[#e2e8f0] px-3 py-2 text-[12px]"
                            >
                              <div className="font-semibold text-gray-700">
                                {course?.title || "Course"}
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <span className="text-emerald-700 font-semibold">
                                  {String(coupon?.code || "").toUpperCase()} (-₱
                                  {asCurrency(coupon?.discountAmount || 0)})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCourseCoupon(courseId)}
                                  className="text-[#b91c1c] font-semibold hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <Link
                      href={checkoutHref}
                      className="flex justify-center text-center shadow-md bg-[#0056D2] text-white font-semibold px-[30px] py-[15px] rounded-[10px] items-center gap-[10px] hover:opacity-90"
                    >
                      Proceed to Checkout <MoveRight />
                    </Link>
                  </div>
                  <p className="text-gray-400 mt-3 text-[14px]">
                    You won't be charged yet
                  </p>
                </div>
              </div>
            ) : (
              <div className="[box-shadow:0_0_2px_oklch(86.72%_.0192_282.72deg)] flex flex-col justify-center items-center w-full p-[50px]">
                <Image
                  src="/cart-placeholder.webp"
                  width={300}
                  height={200}
                  alt="Course Cover"
                />
                <p className="font-light text-[24px]">
                  Your cart is empty. Keep shopping to find a course!
                </p>

                <div className="mt-4">
                  <Link
                    href="/courses"
                    className="flex shadow-md bg-[#0056D2] text-white font-semibold px-[30px] py-[10px] rounded-[10px] items-center gap-[10px] hover:opacity-90"
                  >
                    Keep Shopping
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
