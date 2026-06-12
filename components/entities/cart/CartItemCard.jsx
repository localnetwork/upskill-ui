import Image from "next/image";
import CARTAPI from "@/lib/api/cart/request";
import { mutate } from "swr";
import { useState } from "react";
export default function CartItemCard({ item, isLast }) {
  const [isRemoving, setIsRemoving] = useState(false);

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
              onClick={(e) => {
                handleDelete(item.id);
              }}
            >
              {isRemoving ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
        <div className="col-span-1 flex flex-col items-end">
          <div className="text-[18px] font-semibold">
            ₱{item?.course?.price_tier?.price}
          </div>
        </div>
      </div>
    </div>
  );
}
