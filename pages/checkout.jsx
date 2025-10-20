import Image from "next/image";
import cartStore from "@/lib/store/cartStore";
import Link from "next/link";
import { ChevronLeft, Lock, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Spinner from "@/components/icons/Spinner";
import persistentStore from "@/lib/store/persistentStore";
import { parseCookies } from "nookies";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
export default function Checkout() {
  const cart = cartStore((state) => state.cart);
  const cartTotal = cartStore((state) => state.cartTotal);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const profile = persistentStore((state) => state.profile);

  const cookie = parseCookies();

  const [payload, setPayload] = useState({});

  const paymentMethods = [
    {
      id: "paypal",
      name: "Paypal",
      icon: "/hpp-paypal.svg",
      description:
        "In order to complete your transaction, we will transfer you over to PayPal's secure servers.",
    },
  ];

  useEffect(() => {
    if (!cookie[process.env.NEXT_PUBLIC_TOKEN]) {
      router.replace("/login");
      return;
    }
  }, [cookie, router]);

  const handleCheckout = async () => {
    setIsLoading(true);
    console.log("cartTotal", cartTotal);
    if (cartTotal === null) {
      setIsLoading(false);
      router.replace("/cart");
      return;
    } else {
      let payload = {
        payment_method: "paypal",
      };
      try {
        const response = await BaseApi.post(
          process.env.NEXT_PUBLIC_API_URL + "/checkout",
          payload
        );

        if (response.redirect_url) {
          router.push(response.redirect_url);
        }
      } catch (error) {
        setIsLoading(false);
        console.error("Error during checkout:", error);
      }
    }
  };

  return (
    <div className="bg-[linear-gradient(90deg,transparent_60%,oklch(97.59%_0.0029_264.54deg)_40%)] min-h-[calc(100vh-70px)] py-[30px]">
      <div className="max-w-[984px] mx-auto flex justify-between gap-[50px] px-[15px]">
        <div className="py-[50px] max-w-[calc(100%-320px)] w-full pr-[50px]">
          <Link
            href="/cart"
            className="flex items-center gap-[5px] mb-5 mt-[-50px]"
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-[20px] font-semibold mb-5">Checkout</h1>

          <div>
            <h2 className="text-[18px] font-semibold mb-2">Payment Method</h2>

            {paymentMethods.map((method) => (
              <div key={method.id}>
                <div className="bg-[#F6F7F9] font-semibold px-[10px] py-[5px] mb-2 flex items-center gap-[10px]  border-gray-300 border p-[10px] w-full">
                  <Image
                    src={method.icon}
                    width={100}
                    height={50}
                    alt={method.name}
                    className="bg-white border-[1px] border-[oklch(86.72%_0.0192_282.72deg)] p-[5px] rounded-md w-[50px] h-[30px] object-contain"
                  />
                  {method.name}
                </div>

                <div className="border bg-white border-[oklch(86.72%_0.0192_282.72deg)] border-t-0 p-[15px] mt-[-8px]">
                  <p className="text-[14px] text-gray-600">
                    {method.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-[20px]">
            <h2 className="text-[18px] font-semibold mb-2">
              Order details ({cart?.length} courses)
            </h2>

            {cart && cart.length > 0 && (
              <div className="flex flex-col space-y-[15px]">
                {cart.map((item, index) => (
                  <div key={item.id} className={``}>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-[10px]">
                        <Image
                          src={
                            process.env.NEXT_PUBLIC_API_DOMAIN +
                            item?.course?.cover_image?.path
                          }
                          width={50}
                          height={30}
                          alt={item?.course?.title}
                          className="w-[70px] h-[50px] object-cover rounded-md border-[1px] border-[oklch(86.72%_0.0192_282.72deg)]"
                        />
                        <div className="font-semibold">
                          {item?.course?.title}
                        </div>
                      </div>

                      <div className="font-light">
                        ₱{item?.course?.price_tier?.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="w-[350px] pl-[10px] py-[50px]">
          <h2 className="font-semibold text-[25px] mb-2">Order summary</h2>

          <div className="flex justify-between">
            <div className="font-semibold text-[18px]">
              Total ({cart?.length}) course:
            </div>
            <div className="font-semibold text-[18px]">₱{cartTotal}</div>
          </div>

          <div className="border-t border-[#ddd] mt-[30px] pt-[30px]">
            <p className="text-[14px] text-gray-500">
              By completing your purchase, you agree to these{" "}
              <Link
                href="/terms-of-use"
                target="_blank"
                className="text-[#0056D2]"
              >
                Terms of Use
              </Link>
              .
            </p>

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className={`${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} bg-[#0056D2]  gap-[5px] flex items-center justify-center w-full mt-[30px] min-w-[150px] font-semibold text-white px-[30px] py-[12px] rounded-[5px] hover:bg-[#1d6de0]`}
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
