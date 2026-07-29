import Image from "next/image";
import CARTAPI from "@/lib/api/cart/request";
import { mutate } from "swr";
import { useMemo, useState } from "react";

function asCurrency(value) {
  return Number(value || 0).toFixed(2);
}

export default function CartItemCard({ item, isLast, appliedCoupon }) {
  const [isRemoving, setIsRemoving] = useState(false);

  const originalPrice = Number(item?.course?.price_tier?.price || 0);
  const discountAmount = Number(appliedCoupon?.discountAmount || 0);
  const discountedPrice = Math.max(0, originalPrice - discountAmount);
  const hasDiscount = discountAmount > 0;

  const couponLabel = useMemo(
    () => String(appliedCoupon?.code || "").trim().toUpperCase(),
    [appliedCoupon?.code],
  );

  const handleDelete = async (cartItemId) => {
    if (isRemoving) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this item from the cart?",
    );
    if (!confirmed) return;

    try {
      setIsRemoving(true);
      await CARTAPI.removeItem(cartItemId);

      mutate(`${process.env.NEXT_PUBLIC_API_URL}/cart/count`);
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/cart`);
    } catch (error) {
      console.error("Error removing item from cart:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div
      key={item.course.id}
      className={`${!isLast ? "pb-[15px] border-bottom mb-[15px]" : ""} flex gap-[15px]`}
    >
      <div className="w-[150px] h-[100px] relative flex-shrink-0">
        {item.course.cover_image && (
          <Image
            src={item.course.cover_image.path}
            alt={item.course.title}
            fill
            className="object-cover border-[1px] border-solid border-[oklch(86.72%_0.0192_282.72deg)]"
          />
        )}
      </div>
      <div className="w-[calc(100%-150px)] grid grid-cols-6 justify-between">
        <div className="col-span-4">
          <h2 className="text-[18px] font-semibold">{item.course.title}</h2>
          <p className="font-light text-[14px] mt-[5px]">
            by {item.course.author.data.firstname}{" "}
            {item.course.author.data.lastname}
          </p>
          {appliedCoupon ? (
            <p className="mt-2 text-[12px] text-emerald-700">
              Coupon applied: {couponLabel}
            </p>
          ) : null}
        </div>
        <div className="col-span-1 flex font-light justify-end text-[#0056D2]">
          <div>
            <button
              className={`px-[15px] py-[5px] rounded-md ${
                isRemoving
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-[#F0F6FF] cursor-pointer"
              }`}
              disabled={isRemoving}
              onClick={() => {
                handleDelete(item.id);
              }}
            >
              {isRemoving ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
        <div className="col-span-1 flex flex-col items-end">
          {hasDiscount ? (
            <>
              <div className="text-[12px] text-gray-400 line-through">
                ₱{asCurrency(originalPrice)}
              </div>
              <div className="text-[18px] font-semibold text-emerald-700">
                ₱{asCurrency(discountedPrice)}
              </div>
              <div className="text-[12px] text-emerald-700">
                -₱{asCurrency(discountAmount)}
              </div>
            </>
          ) : (
            <div className="text-[18px] font-semibold">
              ₱{asCurrency(originalPrice)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

