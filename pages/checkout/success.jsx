import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

export async function getServerSideProps(context) {
  const { query } = context;
  const { token } = query;
  setContext(context);

  if (!token) {
    return {
      props: {
        data: null,
        capturePending: true,
      },
    };
  }

  try {
    const res = await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/checkout/capture`, {
      providerOrderId: token,
    });

    return {
      props: {
        data: res?.data?.data || null,
        capturePending: false,
      },
    };
  } catch (error) {
    return {
      props: {
        data: null,
        capturePending: true,
      },
    };
  }
}

export default function Page({ data, capturePending }) {
  const router = useRouter();
  const order = data?.order;
  const orderLines = order?.items || [];

  return (
    <div className="py-[50px] flex flex-col justify-center items-center bg-[#F6F6F6] min-h-[calc(100vh-100px)]">
      <div>
        <CheckCircle className="w-20 h-20 text-[#0056D2]" />
      </div>
      <h1 className="font-semibold text-[40px]">
        {capturePending ? "Payment received. Finalizing your order..." : "Thank you for your purchase!"}
      </h1>
      <p className="text-[20px] mt-2">
        Your order ID is: #{order?.id || router?.query?.order_id || "processing"}
      </p>

      <div className="bg-white shadow-md mt-5 rounded-lg p-[30px] w-full max-w-[600px]">
        <h2 className="font-semibold text-[24px] mb-4">Order Summary</h2>
        {capturePending ? (
          <p className="text-[15px] text-gray-600">
            We are waiting for payment confirmation from PayPal webhook. Please refresh this
            page in a few seconds, or open My Learning.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-[15px]">
              {orderLines?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between border-b border-[#ddd] py-2 pb-[20px]"
                >
                  <div className="flex items-center">
                    <Image
                      src={"/placeholder-cover.webp"}
                      width={50}
                      height={30}
                      alt={item?.courseId}
                      className="w-[70px] h-[50px] object-cover rounded-md border-[1px] border-[oklch(86.72%_0.0192_282.72deg)]"
                    />
                    <span className="ml-2">{item?.courseId}</span>
                  </div>
                  <span>₱{item.totalAmount}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold text-[18px] mt-4">
              <span>Total:</span>
              <span>₱{order?.totalAmount}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-center mt-8">
        <Link
          href="/my-courses/learning"
          className="border-[#0056D2] border-2 px-[30px] rounded-md py-[10px] text-[#0056D2] font-semibold hover:bg-[#0056D2] hover:text-white transition"
        >
          Go to your learning
        </Link>
      </div>
    </div>
  );
}
