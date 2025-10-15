import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import persistentStore from "@/lib/store/persistentStore";
import { useEffect } from "react";
import { parseCookies } from "nookies";
import CARTAPI from "@/lib/api/cart/request";
import cartStore from "@/lib/store/cartStore";
import CartItemCard from "@/components/entities/cart/CartItemCard";
import { MoveRight } from "lucide-react";
export default function Cart() {
  const profile = persistentStore((state) => state.profile);

  const cart = cartStore((state) => state.cart);
  const cartTotal = cartStore((state) => state.cartTotal);

  const cookies = parseCookies();

  const cartItems = cartStore((state) => state.cartItems);

  const router = useRouter();

  useEffect(() => {
    if (!profile && !cookies[process.env.NEXT_PUBLIC_TOKEN]) {
      router.replace("/login");
    }
  }, [profile, router]);
  return (
    <div className="py-[30px]">
      <div className="max-w-[1244px] mx-auto px-[15px] w-full">
        <h1 className="text-[40px] font-semibold mb-5">Shopping Cart</h1>

        {cart && cart.length > 0 ? (
          <div className="flex gap-[50px]">
            <div className="flex w-[calc(100%-300px)] flex-col gap-[15px]">
              <div className="pb-[10px] border-bottom mb-[15px] flex gap-[15px] text-[18px] font-semibold">
                {cart.length} Courses in Cart
              </div>
              {cart.map((item, index) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  isLast={index === cart.length - 1}
                />
              ))}
            </div>

            <div className="w-[350px]">
              <span className="text-[18px] font-semibold text-gray-500">
                Total:
              </span>
              <p className="font-semibold text-[35px]">₱{cartTotal}</p>

              <div className="mt-4">
                <Link
                  href="/checkout"
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
      </div>
    </div>
  );
}
