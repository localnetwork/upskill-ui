import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import persistentStore from "@/lib/store/persistentStore";
import { useEffect } from "react";
import { parseCookies } from "nookies";
import CARTAPI from "@/lib/api/cart/request";
import cartStore from "@/lib/store/cartStore";
export default function Cart() {
  const profile = persistentStore((state) => state.profile);

  const cookies = parseCookies();

  const cartItems = cartStore((state) => state.cartItems);

  const router = useRouter();

  const fetchCartItems = async () => {
    const response = await CARTAPI.getCartItems();
    console.log("response.data.data", response.data.data);

    cartStore.setState({ cartItems: response.data.data });
  };

  useEffect(() => {
    if (!profile && !cookies[process.env.NEXT_PUBLIC_TOKEN]) {
      router.replace("/login");
    }

    fetchCartItems();
  }, [profile, router]);

  console.log("cartItems", cartItems);
  return (
    <div className="py-[30px]">
      <div className="max-w-[1244px] mx-auto px-[15px] w-full">
        <h1 className="text-[50px] font-semibold mb-1">Cart Page</h1>

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
      </div>
    </div>
  );
}
