import Image from "next/image";
import CARTAPI from "@/lib/api/cart/request";
import { mutate } from "swr";
export default function CartItemCard({ item, isLast }) {
  const handleDelete = async (id) => {
    console.log("e", id);
    const confirmed = window.confirm(
      "Are you sure you want to remove this item from the cart?"
    );
    if (!confirmed) return;

    try {
      const response = await CARTAPI.removeItem(id);

      console.log("response", response);
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/cart/count`);
      mutate(`${process.env.NEXT_PUBLIC_API_URL}/cart`);
    } catch (error) {
      console.error("Error removing item from cart:", error);
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
            src={
              process.env.NEXT_PUBLIC_API_DOMAIN + item.course.cover_image.path
            }
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
              className="hover:bg-[#F0F6FF] px-[15px] py-[5px] rounded-md cursor-pointer"
              onClick={(e) => {
                handleDelete(item.cart_id);
              }}
            >
              Remove
            </button>
          </div>
        </div>
        <div className="col-span-1 flex items-center justify-end"></div>
      </div>
    </div>
  );
}
