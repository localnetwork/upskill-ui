import CARTAPI from "@/lib/api/cart/request";
import { forwardRef, useEffect } from "react";
import cartStore from "@/lib/store/cartStore";
import Image from "next/image";
import UserAvatar from "../user/UserAvatar";
import Link from "next/link";
import globalStore from "@/lib/store/globalStore";

const CartDrawer = forwardRef((props, ref) => {
  const cart = cartStore((state) => state.cart);
  const cartTotal = cartStore((state) => state.cartTotal);

  return (
    <div
      ref={ref}
      className="cart-drawer p-[25px] absolute top-[100%] right-0 "
    >
      <div className="w-[350px] bg-white rounded shadow-lg z-50 max-h-[calc(90vh-120px)] overflow-y-auto p-[15px] border-[1px] border-solid border-[oklch(86.72%_0.0192_282.72deg)] flex flex-col gap-y-[15px]">
        <div className="cart-items">
          {cart &&
            cart.map((item, index) => (
              <div
                key={index}
                className="flex gap-[15px] pb-[15px] border-bottom mb-[15px] mx-[-15px] px-[15px]"
              >
                <div className="w-[80px]">
                  {item?.course?.cover_image && (
                    <Image
                      src={
                        process.env.NEXT_PUBLIC_API_DOMAIN +
                        item.course.cover_image.path
                      }
                      width={300}
                      height={200}
                      alt={item.course.title}
                      className="w-full h-[50px] block object-cover border border-[oklch(86.72%_0.0192_282.72deg)]"
                    />
                  )}
                </div>
                <div className="w-[calc(100%-80px)]">
                  <h2 className="font-semibold">{item.course.title}</h2>
                  <div className="font-light text-[14px]">
                    {item.course.author?.data.firstname}{" "}
                    {item.course.author?.data.lastname}
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div className="text-[20px] flex justify-between mt-[-15px]">
          <span>Total:</span> <span>PHP {cartTotal}</span>
        </div>
        <div>
          <Link
            href="/cart"
            onClick={() => globalStore.setState({ cartDrawerOpen: false })}
            className="flex justify-center text-center shadow-md bg-[#0056D2] text-white font-semibold px-[30px] py-[10px] rounded-[10px] items-center gap-[10px] hover:opacity-90"
          >
            Go to cart
          </Link>
        </div>
      </div>
    </div>
  );
});

export default CartDrawer;
