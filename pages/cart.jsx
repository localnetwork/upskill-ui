import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import persistentStore from "@/lib/store/persistentStore";
import { useEffect } from "react";
import { parseCookies } from "nookies";
// import CARTAPI from "@/lib/api/cart/request";
import cartStore from "@/lib/store/cartStore";
import CartItemCard from "@/components/entities/cart/CartItemCard";
import { MoveRight } from "lucide-react";
export default function Cart() {
  const profile = persistentStore((state) => state.profile);

  const cart = cartStore((state) => state.cart);
  const cartTotal = cartStore((state) => state.cartTotal);

  const isCartLoading = cartStore((state) => state.isCartLoading);

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

        {isCartLoading && cart.length === 0 ? (
          <>
            {" "}
            <div className="flex gap-[50px] animate-pulse">
              {/* LEFT: Cart items */}
              <div className="flex w-[calc(100%-300px)] flex-col gap-[20px]">
                {/* Header */}
                <div className="pb-[10px] border-b mb-[15px]">
                  <div className="h-6 w-48 rounded-md bg-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite]" />
                  </div>
                </div>

                {/* Cart item skeletons */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex gap-4 border-b pb-6 relative overflow-hidden"
                  >
                    {/* Course image */}
                    <div className="h-28 w-40 rounded-xl bg-gray-200 shrink-0" />

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-3/4 rounded bg-gray-200" />
                      <div className="h-4 w-1/2 rounded bg-gray-200" />
                      <div className="h-4 w-1/3 rounded bg-gray-200" />

                      <div className="flex justify-between items-center pt-2">
                        <div className="h-6 w-24 rounded bg-gray-200" />
                        <div className="h-5 w-20 rounded bg-gray-200" />
                      </div>
                    </div>

                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite]" />
                  </div>
                ))}
              </div>

              {/* RIGHT: Summary */}
              <div className="w-[350px]">
                <div className="h-5 w-20 rounded bg-gray-200 mb-3 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite]" />
                </div>

                <div className="h-10 w-40 rounded bg-gray-200 mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite]" />
                </div>

                {/* Button */}
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
          </>
        )}
      </div>
    </div>
  );
}
